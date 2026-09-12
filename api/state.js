const { neon } = require('@neondatabase/serverless');

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.NEON_DATABASE_URL;

const sql = neon(connectionString);

async function ensureTable() {
  await sql`
    CREATE TABLE IF NOT EXISTS oche_state (
      id INT PRIMARY KEY DEFAULT 1,
      data JSONB NOT NULL,
      rev INT NOT NULL DEFAULT 0
    )
  `;
}

module.exports = async function handler(req, res) {
  if (!connectionString) {
    res.status(500).json({ error: 'No database connection string found. Set DATABASE_URL (or POSTGRES_URL) in the Vercel project env vars.' });
    return;
  }
  try {
    await ensureTable();

    if (req.method === 'GET') {
      const rows = await sql`SELECT data, rev FROM oche_state WHERE id = 1`;
      if (rows.length === 0) {
        res.status(200).json({ players: [], history: [], rev: 0 });
        return;
      }
      const row = rows[0];
      res.status(200).json({ players: row.data.players || [], history: row.data.history || [], rev: row.rev });
      return;
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const players = Array.isArray(body.players) ? body.players : [];
      const history = Array.isArray(body.history) ? body.history : [];
      const clientRev = Number(body.rev) || 0;
      const payload = JSON.stringify({ players, history });

      // Atomic, race-free upsert: only apply this write if its revision is not
      // older than whatever is already stored (last-writer-wins by revision,
      // enforced by the database itself rather than by request arrival order).
      await sql`
        INSERT INTO oche_state (id, data, rev) VALUES (1, ${payload}::jsonb, ${clientRev})
        ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, rev = EXCLUDED.rev
        WHERE oche_state.rev <= EXCLUDED.rev
      `;
      res.status(200).json({ ok: true });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err && err.message || err) });
  }
};
