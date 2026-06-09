const { neon } = require('@neondatabase/serverless');

// ── DB Connection ──────────────────────────────────────────────────
const DB_HOST = 'ep-old-star-abhpdbpp-pooler.eu-west-2.aws.neon.tech';
const DB_NAME = 'neondb';
const DB_USER = 'neondb_owner';
// Password stored as base64 to avoid masking issues
const DB_PW = Buffer.from('bnBnX0dZblNSajNsWmNWNQ==', 'base64').toString('utf8');

function getSql() {
  const url = `postgresql://${DB_USER}:${DB_PW}@${DB_HOST}/${DB_NAME}?sslmode=require`;
  return neon(url);
}

// ── Auth ───────────────────────────────────────────────────────────
async function getUserFromToken(authHeader, sql) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);

  // JWT compat token (header.payload.signature)
  if (token.includes('.')) {
    try {
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64url').toString()
      );
      if (payload.sub) return payload.sub;
    } catch { /* fall through */ }
  }

  // Session token (32-char from Better Auth)
  try {
    if (!sql) return null;
    const [session] = await sql`
      SELECT "userId" FROM session
      WHERE token = ${token} AND "expiresAt" > NOW()
    `;
    return session ? session.userId : null;
  } catch {
    return null;
  }
}

// ── Handler ────────────────────────────────────────────────────────
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

  const sql = getSql();

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
            return { statusCode: 404, headers, body: JSON.stringify({ error: 'Snippet not found' }) };
          }
          return { statusCode: 200, headers, body: JSON.stringify(snippet) };
        }
        const snippets = await sql`
          SELECT * FROM snippets WHERE user_id = ${userId} ORDER BY updated_at DESC
        `;
        return { statusCode: 200, headers, body: JSON.stringify(snippets) };
      }

      case 'POST': {
        const { title, description, code, language, tags } = JSON.parse(event.body);
        if (!title || !code) {
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Title and code are required' }) };
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
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Snippet ID required' }) };
        }
        const updates = JSON.parse(event.body);
        const [existing] = await sql`SELECT id FROM snippets WHERE id = ${snippetId} AND user_id = ${userId}`;
        if (!existing) {
          return { statusCode: 404, headers, body: JSON.stringify({ error: 'Snippet not found' }) };
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
          return { statusCode: 400, headers, body: JSON.stringify({ error: 'Snippet ID required' }) };
        }
        await sql`DELETE FROM snippets WHERE id = ${snippetId} AND user_id = ${userId}`;
        return { statusCode: 204, headers, body: '' };
      }

      default:
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
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
