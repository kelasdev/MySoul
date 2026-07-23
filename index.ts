import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { ExtensionAPI } from "@oh-my-pi/pi-coding-agent";

// Load persona dari SOUL.md (file sibling).
// import.meta.url dapat mengandung query (?mtime=...) dari loader OMP.
// new URL("./SOUL.md", import.meta.url) mengabaikan query tersebut dan
// menghasilkan path absolut yang benar. Normalisasi CRLF -> LF agar prompt
// konsisten di semua platform.
const PERSONA = readFileSync(
  fileURLToPath(new URL("./SOUL.md", import.meta.url)),
  "utf8",
)
  .replace(/\r\n/g, "\n")
  .trim();

export default function (pi: ExtensionAPI) {
  pi.setLabel("Bring Me To Life");

  // Beri notifikasi saat extension dimuat.
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.notify("→ SOUL Persona active", "info");
  });

  // Jadikan SOUL.md sebagai SYSTEM PROMPT PALING AWAL.
  // Jangan append ke belakang karena persona/identity sebaiknya memiliki
  // prioritas tertinggi sebelum system prompt bawaan OMP, tool inventory,
  // project context, maupun environment context.
  pi.on("before_agent_start", async (event) => {
    return {
      systemPrompt: [
        PERSONA,
        ...event.systemPrompt,
      ],
    };
  });
}
