const { put, get } = require('@vercel/blob');

const BLOB_PATH = 'oche-state.json';
const EMPTY = { players: [], history: [], rev: 0 };

async function readState() {
  // useCache:false reads from origin rather than the CDN — a stale read here
  // would let one device overwrite another's newer scores.
  const result = await get(BLOB_PATH, { access: 'private', useCache: false });
  if (!result || result.statusCode !== 200 || !result.stream) return Object.assign({}, EMPTY);
  const data = await new Response(result.stream).json();
  return {
    players: Array.isArray(data.players) ? data.players : [],
    history: Array.isArray(data.history) ? data.history : [],
    rev: Number(data.rev) || 0
  };
}

module.exports = async function handler(req, res) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    res.status(500).json({ error: 'No BLOB_READ_WRITE_TOKEN set. Connect a Vercel Blob store to this project.' });
    return;
  }
  try {
    if (req.method === 'GET') {
      const state = await readState();
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).json(state);
      return;
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const players = Array.isArray(body.players) ? body.players : [];
      const history = Array.isArray(body.history) ? body.history : [];
      const clientRev = Number(body.rev) || 0;

      // Revision guard: a write that is behind what is already stored is a
      // straggler from an earlier save, so drop it rather than let it undo
      // newer data.
      const current = await readState();
      if (clientRev < current.rev) {
        res.status(200).json({ ok: false, stale: true, rev: current.rev });
        return;
      }

      await put(BLOB_PATH, JSON.stringify({ players: players, history: history, rev: clientRev }), {
        access: 'private',
        contentType: 'application/json',
        addRandomSuffix: false,
        allowOverwrite: true,
        cacheControlMaxAge: 0
      });
      res.status(200).json({ ok: true, rev: clientRev });
      return;
    }

    res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String((err && err.message) || err) });
  }
};
