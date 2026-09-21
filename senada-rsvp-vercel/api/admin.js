// GET /api/admin           -> daftar semua RSVP (butuh password admin)
// DELETE /api/admin?id=... -> hapus satu data
const crypto = require('crypto');
const { redis, KEY } = require('./_redis');

function sameSecret(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const secret = process.env.ADMIN_PASSWORD;
  if (!secret) return res.status(500).json({ error: 'ADMIN_PASSWORD belum diatur di Vercel.' });

  const auth = req.headers.authorization || '';
  const given = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!given || !sameSecret(given, secret)) {
    await new Promise((r) => setTimeout(r, 500)); // memperlambat tebak-tebakan password
    return res.status(401).json({ error: 'Password salah.' });
  }

  try {
    if (req.method === 'GET') {
      const flat = (await redis(['HGETALL', KEY])) || [];
      const items = [];
      for (let i = 1; i < flat.length; i += 2) {
        try { items.push(JSON.parse(flat[i])); } catch (e) {}
      }
      items.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
      return res.status(200).json({ items, serverTime: new Date().toISOString() });
    }
    if (req.method === 'DELETE') {
      const id = String((req.query && req.query.id) || '');
      if (!id) return res.status(400).json({ error: 'id wajib diisi.' });
      await redis(['HDEL', KEY, id]);
      return res.status(200).json({ ok: true });
    }
    res.setHeader('Allow', 'GET, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (e) {
    console.error('Admin error:', e && e.message);
    return res.status(503).json({ error: 'Database belum siap / terjadi gangguan.' });
  }
};
