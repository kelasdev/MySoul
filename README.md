# MySoul — OMP Persona Extension

Ekstensi **oh-my-pi (OMP)** yang menyuntikkan persona "SOUL" (CTO Agent & Asisten
Pribadi CEO) ke dalam prompt model pada setiap sesi. Persona didefinisikan
di `SOUL.md` (terpisah dari kode) agar mudah diedit.

- **Nama paket:** `SOUL`
- **Versi:** `1.2.3`
- **Target:** `@oh-my-pi/pi-coding-agent` (runtime ekstensi OMP)

## Struktur direktori

```
MySoul/
├── index.ts     # Logika ekstensi: load SOUL.md + 2 titik injeksi
├── SOUL.md      # Isi persona (teks instruksi perilaku)
└── package.json # Manifest: { "omp": { "extensions": ["index.ts"] } }
```

## Cara kerja

Ekstensi OMP **tidak otomatis** masuk ke prompt. Ia harus menyuntik secara eksplisit.
MySoul menyuntik lewat dua kanal:

### 1. System context — `before_agent_start`

Setiap agent run, persona **ditambahkan** sebagai blok terakhir dari system prompt.
Kita spread `event.systemPrompt` (blok default OMP: instruksi stabil + tool inventory +
project/environment footer) agar instruksi bawaan tetap utuh — kita *append*, bukan *replace*.

```ts
pi.on("before_agent_start", async (event) => {
  return { systemPrompt: [...event.systemPrompt, PERSONA] };
});
```

### 2. User / conversation context — `session_start`

Persona juga di-inject ke history percakapan sebagai entry tersembunyi
(`display: false` → tidak mengotori TUI, tapi tetap terlihat model;
`triggerTurn: false` → tidak memicu turn baru).

```ts
pi.on("session_start", async (_event, ctx) => {
  ctx.ui.notify("-> SOUL Persona active", "info");
  pi.sendMessage(
    { customType: "soul-persona", content: PERSONA, display: false, attribution: "user" },
    { triggerTurn: false },
  );
});
```

`SOUL.md` dibaca saat modul di-load:

```ts
const PERSONA = readFileSync(
  fileURLToPath(new URL("./SOUL.md", import.meta.url)),
  "utf8",
).trim().replace(/\r\n/g, "\n");
```

> `import.meta.url` bisa membawa query `?mtime=…` dari loader OMP; resolusi relatif
> membuang query tersebut sehingga path ke `SOUL.md` tetap benar. CRLF dinormalisasi ke LF.

## Aktivasi

Letakkan folder ini di salah satu lokasi discovery OMP:

- User: `~/.omp/agent/extensions/MySoul/`  ← lokasi saat ini
- Project: `<cwd>/.omp/extensions/MySoul/`

Tidak perlu konfigurasi tambahan — OMP memuat otomatis saat startup (tanpa flag
`--no-extensions`). **Restart `omp`** agar perubahan/ekstensi baru terbaca.

### Menonaktifkan sementara

Di `~/.omp/agent/config.yml`:

```yaml
disabledExtensions:
  - extension-module: MySoul
```

(Nama turunan = nama folder / stem file entry, yaitu `MySoul`.)

## Mengubah persona

Edit `SOUL.md` secara langsung. Karena `PERSONA` dibaca saat load, **restart `omp`**
agar perubahan terambil. Jika ingin edit terasa tanpa restart, pindahkan pembacaan
`SOUL.md` ke dalam handler `session_start` (baca ulang setiap sesi).

## Verifikasi

OMP tidak bisa di-smoke-test secara headless. Setelah restart:

```bash
tail -f ~/.omp/logs/omp.$(date +%F).log
```

Cari diagnostik load ekstensi `SOUL` tanpa error. Lalu pastikan teks SOUL muncul di
system prompt / history sesi (mis. tanya model: *"siapa persona kamu?"*).

## Catatan

- `appendEntry` **tidak** menyuntik ke model — hanya menyimpan state sesi. Oleh karena
  itu MySoul menggunakan `sendMessage`, bukan `appendEntry`.
- Untuk persona statis yang sederhana, alternatif tanpa ekstensi: `~/.omp/agent/APPEND_SYSTEM.md`.
  MySoul dipakai ketika injeksi perlu dikelola secara terprogram (satu paket berisi
  persona + logika).
