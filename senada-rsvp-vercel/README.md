# RSVP SENADA 2026 (form langsung + dashboard admin)

- `/`       → halaman undangan + form RSVP (tanpa login, tanpa Google Form)
- `/admin`  → dashboard admin (pakai password), data masuk tampil live (refresh otomatis tiap 3 detik)

## Isi folder

```
index.html     ← halaman undangan + form
admin.html     ← dashboard admin
api/rsvp.js    ← menerima kiriman form (publik)
api/admin.js   ← membaca/menghapus data (wajib password)
api/_redis.js  ← penghubung ke database
vercel.json, package.json
```

## Deploy (sekali saja, ±5 menit)

Karena sekarang ada bagian server (folder `api/`), deploy-nya lewat CLI atau GitHub
(drag-and-drop folder biasa tidak menjalankan `api/`).

1. **Deploy dulu**
   ```bash
   npm i -g vercel
   cd senada-rsvp-vercel
   vercel --prod
   ```
   (atau push folder ini ke GitHub lalu Import di vercel.com)

2. **Pasang database gratis (Upstash Redis)**
   Vercel dashboard → project kamu → tab **Storage** → Create/Connect Database →
   pilih **Upstash (Redis)** paket Free → **Connect to Project**.
   Environment variable-nya terisi otomatis.

3. **Buat password admin**
   Project → **Settings → Environment Variables** → tambah
   `ADMIN_PASSWORD` = (password yang kuat, bebas kamu tentukan) → centang Production.

4. **Redeploy** supaya env var terbaca: `vercel --prod` lagi
   (atau Deployments → ⋯ → Redeploy).

5. Buka `https://domainkamu.vercel.app/admin` → masuk dengan password tadi.

## Catatan

- Satu email = satu data. Kalau tamu mengirim lagi dengan email yang sama, jawabannya
  **diperbarui** (bukan dobel) — berguna kalau tamu berubah pikiran Hadir ↔ Tidak hadir.
- Dashboard: statistik, filter (Hadir / Tidak hadir / VVIP / Pers / butuh aksesibilitas),
  pencarian, klik nomor WA untuk langsung chat, hapus data, dan **Unduh CSV** (bisa dibuka di Excel).
- Perlindungan dasar: honeypot anti-bot, batas 15 kiriman/10 menit per IP, validasi di server,
  password admin dicek di server (data tidak bisa dibaca publik).
- Mau ubah isi form? Edit `index.html` (bagian `id="rsvp"`), lalu sesuaikan validasi di `api/rsvp.js`.
- Countdown tetap diset ke 15 Nov 2026 18:00 WIB (cari `new Date('2026-11-15T18:00:00+07:00')`).
