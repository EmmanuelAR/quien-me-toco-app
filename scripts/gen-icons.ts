/**
 * genera los íconos de la pwa a partir de un svg dibujado a mano (sin fuentes del sistema):
 *   public/icons/icon-192.png, icon-512.png, icon-512-maskable.png
 *   app/icon.png (512) y app/apple-icon.png (180)
 * correr: pnpm icons
 */
import sharp from "sharp";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { colors } from "../lib/brand/tokens";

function iconSvg({ size, padding }: { size: number; padding: number }) {
  // dibujo en un lienzo de 512 y escalamos; `padding` deja zona segura para maskable
  const inner = 512 - padding * 2;
  const scale = inner / 512;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="${colors.bg}"/>
  <g transform="translate(${padding} ${padding}) scale(${scale})">
    <!-- marcador azul detrás del signo -->
    <rect x="150" y="128" width="212" height="262" rx="26" fill="${colors.markerBlue}" transform="rotate(-4 256 256)"/>
    <!-- signo de pregunta en line-art -->
    <path d="M190 206c0-46 32-74 70-74s66 26 66 62c0 50-60 52-60 110" fill="none" stroke="${colors.ink}" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="266" cy="372" r="21" fill="${colors.ink}"/>
  </g>
</svg>`;
}

async function render(svg: string, size: number, out: string) {
  const png = await sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
  await writeFile(out, png);
  console.log("ok", out, `${(png.length / 1024).toFixed(1)}kb`);
}

async function main() {
  await mkdir("public/icons", { recursive: true });
  const plain = iconSvg({ size: 512, padding: 0 });
  const maskable = iconSvg({ size: 512, padding: 64 }); // zona segura ~80%
  await render(plain, 192, "public/icons/icon-192.png");
  await render(plain, 512, "public/icons/icon-512.png");
  await render(maskable, 512, "public/icons/icon-512-maskable.png");
  await render(plain, 512, "app/icon.png");
  await render(plain, 180, "app/apple-icon.png");
  await writeFile("public/icons/icon.svg", plain);
  // caritas en png para los correos (los clientes de correo no renderizan svg)
  for (const name of ["cara-1", "cara-2", "cara-3"]) {
    const svg = await readFile(`public/stamps/${name}.svg`, "utf8");
    await render(svg, 120, `public/stamps/${name}.png`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
