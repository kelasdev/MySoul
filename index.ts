import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

// Persona SOUL di-load dari SOUL.md (file sibling) agar index.ts tetap ringkas.
// import.meta.url bisa membawa query `?mtime=...` dari loader OMP — resolusi via
// `new URL("./SOUL.md", import.meta.url)` membuang query tersebut dan menghasilkan
// path absolut ke SOUL.md di direktori yang sama. CRLF dinormalisasi ke LF.
const PERSONA = readFileSync(
  fileURLToPath(new URL("./SOUL.md", import.meta.url)),
  "utf8",
).trim().replace(/\r\n/g, "\n");

export default function (pi: ExtensionAPI) {
  pi.setLabel("Bring Me To Life");

  // ── SYSTEM CONTEXT ────────────────────────────────────────────────
  // Setiap agent run, tambahkan PERSONA sebagai blok system prompt
  // TAMBAHAN. Kita spread `event.systemPrompt` (blok default OMP:
  // instruksi stabil, tool inventory, project/environment footer) agar
  // instruksi bawaan tetap utuh — kita APPEND, bukan REPLACE.
  pi.on("before_agent_start", async (event) => {
    return { systemPrompt: [...event.systemPrompt, PERSONA] };
  });

  // ── USER / CONVERSATION CONTEXT ───────────────────────────────────
  // Inject persona juga ke history percakapan sebagai entry tersembunyi
  // (display:false → tidak mengotori TUI, tapi tetap terlihat model).
  // triggerTurn:false → tidak memicu turn baru.
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("-> SOUL Persona active", "info");
    pi.sendMessage(
      {
        customType: "soul-persona",
        content: PERSONA,
        display: false,
        attribution: "user",
      },
      { triggerTurn: false },
    );
  });
}
