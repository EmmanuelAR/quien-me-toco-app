/**
 * Agrega 2 personas de prueba a un grupo (sin Google).
 * Uso: pnpm exec tsx scripts/seed-test-members.ts <groupId>
 *
 * Requiere DATABASE_URL. No corre si VERCEL_ENV=production.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadDotEnv() {
  for (const name of [".env.local", ".env"]) {
    const path = resolve(process.cwd(), name);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const s = line.trim();
      if (!s || s.startsWith("#") || !s.includes("=")) continue;
      const i = s.indexOf("=");
      const k = s.slice(0, i).trim();
      let v = s.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!(k in process.env)) process.env[k] = v;
    }
  }
}

async function main() {
  loadDotEnv();
  if (process.env.VERCEL_ENV === "production") {
    console.error("bloqueado en production");
    process.exit(1);
  }
  const groupId = process.argv[2];
  if (!groupId) {
    console.error("uso: pnpm exec tsx scripts/seed-test-members.ts <groupId>");
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error("falta DATABASE_URL");
    process.exit(1);
  }

  const { addTestMembers, getGroup } = await import("../lib/db/groups");
  const group = await getGroup(groupId);
  if (!group) {
    console.error("grupo no encontrado");
    process.exit(1);
  }
  if (group.status !== "open" && group.status !== "closed") {
    console.error(`grupo en estado ${group.status}; no se pueden agregar`);
    process.exit(1);
  }

  const { added, total } = await addTestMembers(groupId, 2);
  if (added.length === 0) {
    console.error("no se agregó nadie (¿ya están Ana/Bruno/Carla?)");
    process.exit(1);
  }
  console.log(
    `ok: +${added.length} (${added.map((m) => m.name).join(", ")}). total en el grupo: ${total}`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
