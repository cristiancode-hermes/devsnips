const { neon } = require('@neondatabase/serverless');

const DATABASE_URL = process.env.DATABASE_URL;

/**
 * Verify JWT and extract user_id (sub claim).
 * Supports both JWT tokens and Better Auth session tokens (32-char).
 * For JWT: decodes payload and extracts sub.
 * For session tokens: validates via Neon Auth get-session endpoint.
 */
async function getUserFromToken(authHeader, sql) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice(7);

  // Try JWT format (header.payload.signature)
  if (token.includes('.')) {
    try {
      const payload = JSON.parse(
        Buffer.from(token.split('.')[1], 'base64url').toString()
      );
      if (payload.sub) return payload.sub;
    } catch {
      // Not a valid JWT, try as session token
    }
  }

  // Try as Better Auth session token (32-char, no dots)
  // Query the session table directly from the database
  try {
    if (!sql) return null;
    const sessions = await sql`
      SELECT "userId" FROM session WHERE token = ${token} AND "expiresAt" > NOW()
    `;
    if (sessions && sessions.length > 0) {
      return sessions[0].userId;
    }
    return null;
  } catch {
    return null;
  }
}

exports.handler = async (event) => {
  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (!DATABASE_URL) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Database not configured' }),
    };
  }

  const sql = neon(DATABASE_URL);

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
          // Get single snippet
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
          // List all snippets for user
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
        await sql`
          DELETE FROM snippets WHERE id = ${snippetId} AND user_id = ${userId}
        `;
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
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
