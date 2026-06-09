const { neon } = require('@neondatabase/serverless');

const NEON_API_BASE = 'https://console.neon.tech/api/v2';
const PROJECT_ID = 'raspy-star-93431686';
const BRANCH_ID = 'br-wispy-dew-abytefxv';
const ROLE_NAME = 'neondb_owner';

let cachedSql = null;

async function getSql() {
  if (cachedSql) return cachedSql;

  // 1) Try DATABASE_URL or NEON_DATABASE_URL directly
  const directUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL;
  if (directUrl && directUrl !== 'CHANGE_ME_IN_NETLIFY_DASHBOARD') {
    cachedSql = neon(directUrl);
    return cachedSql;
  }

  // 2) Use NEON_API_KEY to fetch the db secret from Neon's API
  const apiKey = process.env.NEON_API_KEY;
  if (!apiKey) {
    throw new Error(
      'No database connection available. Set DATABASE_URL, NEON_DATABASE_URL, or NEON_API_KEY.'
    );
  }

  // Fetch the secret from the reveal_password endpoint
  const pwUrl = `${NEON_API_BASE}/projects/${PROJECT_ID}/branches/${BRANCH_ID}/roles/${ROLE_NAME}/reveal_password`;
  const pwRes = await fetch(pwUrl, {
    headers: { Authorization: `Bearer ${apiKey}`, Accept: 'application/json' },
  });

  if (!pwRes.ok) {
    const errText = await pwRes.text();
    throw new Error(`Failed to fetch DB secret via API: ${pwRes.status} — ${errText}`);
  }

  const { password: dbSecret } = await pwRes.json();

  // Build the connection string using the pooled endpoint
  const host = 'ep-old-star-abhpdbpp-pooler.eu-west-2.aws.neon.tech';
  const connStr = `postgresql://neondb_owner:${dbSecret}@${host}/neondb?sslmode=require`;

  cachedSql = neon(connStr);
  return cachedSql;
}

/**
 * Verify JWT (header.payload.signature) or Better Auth session token via DB lookup.
 * Returns userId (string) or null.
 */
async function getUserFromToken(authHeader, sql) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);

  // JWT format
  if (token.includes('.')) {
    try {
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64url').toString()
      );
      if (payload.sub) return payload.sub;
    } catch {
      // fall through
    }
  }

  // Better Auth session token — query the session table
  try {
    if (!sql) return null;
    const sessions =
      await sql`SELECT "userId" FROM session WHERE token = ${token} AND "expiresAt" > NOW()`;
    if (sessions && sessions.length > 0) return sessions[0].userId;
    return null;
  } catch {
    return null;
  }
}

exports.handler = async (event) => {
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  let sql;
  try {
    sql = await getSql();
  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message }),
    };
  }

  // Auth check
  const userId = await getUserFromToken(event.headers.authorization || '', sql);
  if (!userId) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }

  const pathParts = event.path.replace(/^\/api\/snippets\/?/, '').split('/');
  const snippetId = pathParts[0] || null;

  try {
    switch (event.httpMethod) {
      case 'GET': {
        if (snippetId) {
          const [snippet] = await sql`
            SELECT * FROM snippets WHERE id = ${snippetId} AND user_id = ${userId}
          `;
          if (!snippet) {
            return {
              statusCode: 404,
              headers,
              body: JSON.stringify({ error: 'Snippet not found' }),
            };
          }
          return { statusCode: 200, headers, body: JSON.stringify(snippet) };
        } else {
          const snippets = await sql`
            SELECT * FROM snippets WHERE user_id = ${userId} ORDER BY updated_at DESC
          `;
          return { statusCode: 200, headers, body: JSON.stringify(snippets) };
        }
      }

      case 'POST': {
        const { title, description, code, language, tags } = JSON.parse(event.body);
        if (!title || !code) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Title and code are required' }),
          };
        }
        const [snippet] = await sql`
          INSERT INTO snippets (user_id, title, description, code, language, tags)
          VALUES (${userId}, ${title}, ${description || null}, ${code}, ${language || 'text'}, ${tags || []})
          RETURNING *
        `;
        return { statusCode: 201, headers, body: JSON.stringify(snippet) };
      }

      case 'PUT': {
        if (!snippetId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Snippet ID required' }),
          };
        }
        const updates = JSON.parse(event.body);
        const existing = await sql`
          SELECT * FROM snippets WHERE id = ${snippetId} AND user_id = ${userId}
        `;
        if (existing.length === 0) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Snippet not found' }),
          };
        }
        const [snippet] = await sql`
          UPDATE snippets SET
            title = COALESCE(${updates.title}, title),
            description = COALESCE(${updates.description}, description),
            code = COALESCE(${updates.code}, code),
            language = COALESCE(${updates.language}, language),
            tags = COALESCE(${updates.tags}, tags),
            updated_at = NOW()
          WHERE id = ${snippetId} AND user_id = ${userId}
          RETURNING *
        `;
        return { statusCode: 200, headers, body: JSON.stringify(snippet) };
      }

      case 'DELETE': {
        if (!snippetId) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: 'Snippet ID required' }),
          };
        }
        await sql`DELETE FROM snippets WHERE id = ${snippetId} AND user_id = ${userId}`;
        return { statusCode: 204, headers, body: '' };
      }

      default:
        return {
          statusCode: 405,
          headers,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (err) {
    console.error('Database error:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error', detail: err.message || String(err) }),
    };
  }
};
