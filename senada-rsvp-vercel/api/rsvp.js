// POST /api/rsvp  — dipakai form publik (tanpa login)
const { redis, KEY } = require('./_redis');

const KATEGORI = ['Tamu VVIP', 'Media Pers'];
const STATUS = ['Hadir', 'Tidak dapat hadir'];

function clean(v, max) {
  return String(v == null ? '' : v)
    .replace(/[\u0000-\u001f\u007f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || typeof b !== 'object') return res.status(400).json({ error: 'Data tidak valid.' });

  // Honeypot: bot biasanya mengisi field tersembunyi ini
  if (b.website) return res.status(200).json({ ok: true });

  const nama = clean(b.nama, 100);
  const instansi = clean(b.instansi, 150);
  const email = clean(b.email, 120);
  const kategori = clean(b.kategori, 30);
  const status = clean(b.status, 30);
  const akses = clean(b.akses, 500);
  let wa = clean(b.wa, 25).replace(/[^\d+]/g, '');
  const waDigits = wa.replace(/\D/g, '');

  const fields = {};
  if (nama.length < 2) fields.nama = 'Nama lengkap wajib diisi.';
  if (!instansi) fields.instansi = 'Instansi / organisasi / komunitas wajib diisi.';
  if (waDigits.length < 9 || waDigits.length > 15) fields.wa = 'Nomor WhatsApp tidak valid.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) fields.email = 'Alamat email tidak valid.';
  if (!KATEGORI.includes(kategori)) fields.kategori = 'Pilih kategori undangan.';
  if (!STATUS.includes(status)) fields.status = 'Pilih konfirmasi kehadiran.';
  if (Object.keys(fields).length) {
    return res.status(400).json({ error: 'Mohon periksa kembali isian Anda.', fields });
  }

  try {
    // Batas percobaan per IP: 15 kali / 10 menit
    const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
    const rk = 'senada2026:rl:' + ip;
    const n = await redis(['INCR', rk]);
    if (n === 1) await redis(['EXPIRE', rk, 600]);
    if (n > 15) return res.status(429).json({ error: 'Terlalu banyak percobaan. Coba lagi beberapa menit lagi.' });

    // Satu email = satu data. Kirim ulang dengan email sama = memperbarui jawaban.
    const id = email.toLowerCase();
    const now = new Date().toISOString();
    const prev = await redis(['HGET', KEY, id]);
    let createdAt = now;
    if (prev) { try { createdAt = JSON.parse(prev).createdAt || now; } catch (e) {} }

    const rec = { id, nama, instansi, wa, email, kategori, status, akses, createdAt, updatedAt: now };
    await redis(['HSET', KEY, id, JSON.stringify(rec)]);
    return res.status(200).json({ ok: true, updated: !!prev });
  } catch (e) {
    console.error('RSVP error:', e && e.message);
    const msg = e && e.message === 'DB_NOT_CONFIGURED'
      ? 'Sistem penyimpanan belum dikonfigurasi. Silakan hubungi panitia.'
      : 'Terjadi gangguan. Silakan coba lagi sebentar lagi.';
    return res.status(503).json({ error: msg });
  }
};
