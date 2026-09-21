// Helper kecil untuk Upstash Redis (REST). Tanpa dependency npm.
// Env var otomatis terisi saat database Upstash dihubungkan ke project Vercel.
const DB_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const DB_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

async function redis(command) {
  if (!DB_URL || !DB_TOKEN) throw new Error('DB_NOT_CONFIGURED');
  const r = await fetch(DB_URL, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + DB_TOKEN, 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(j.error || 'Redis error ' + r.status);
  return j.result;
}

module.exports = { redis, KEY: 'senada2026:rsvp' };
