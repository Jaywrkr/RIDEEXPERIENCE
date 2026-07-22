// Genera N códigos únicos, los inserta en la base de datos y produce:
//   - out/codigos.csv            (respaldo de códigos + link)
//   - out/hoja-imprimir.html     (una tarjeta por persona, con QR, lista para imprimir)
//
// Uso:
//   POSTGRES_URL=... SITE_URL=https://tudominio.com node scripts/generar-codigos.mjs [cantidad]
//
// Requiere las devDependencies del proyecto instaladas (npm install).

import { writeFile, mkdir } from 'node:fs/promises';
import { sql } from '@vercel/postgres';
import { customAlphabet } from 'nanoid';
import QRCode from 'qrcode';

const CANTIDAD = Number(process.argv[2] || 100);
const SITE_URL = process.env.SITE_URL || 'https://tudominio.com';

// Alfabeto sin caracteres ambiguos (sin 0/O, 1/I/L) para que se puedan
// transcribir a mano sin errores si el QR no escanea.
const nanoid = customAlphabet('ABCDEFGHJKMNPQRSTUVWXYZ23456789', 5);

function generarCodigo() {
  return `SHN26-${nanoid()}`;
}

async function main() {
  const codigos = new Set();
  while (codigos.size < CANTIDAD) {
    codigos.add(generarCodigo());
  }
  const lista = Array.from(codigos);

  for (const codigo of lista) {
    await sql`insert into personas (codigo) values (${codigo}) on conflict (codigo) do nothing`;
  }

  await mkdir('out', { recursive: true });

  const csv = ['codigo,link', ...lista.map((c) => `${c},${SITE_URL}/?codigo=${c}`)].join('\n');
  await writeFile('out/codigos.csv', csv, 'utf8');

  const tarjetas = await Promise.all(
    lista.map(async (codigo) => {
      const url = `${SITE_URL}/?codigo=${codigo}`;
      const qrDataUrl = await QRCode.toDataURL(url, { margin: 1, width: 220 });
      return `
        <div class="tarjeta">
          <img src="${qrDataUrl}" alt="QR ${codigo}" />
          <div class="codigo">${codigo}</div>
          <div class="evento">Convención Nacional Shineray 2026</div>
        </div>
      `;
    })
  );

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8" />
<title>Códigos de pasaporte — para imprimir</title>
<style>
  @media print {
    .tarjeta { break-inside: avoid; }
  }
  body { font-family: Georgia, serif; margin: 0; padding: 16px; }
  .grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
  }
  .tarjeta {
    border: 1px dashed #999;
    border-radius: 8px;
    padding: 12px;
    text-align: center;
  }
  .tarjeta img { width: 140px; height: 140px; }
  .codigo { font-size: 16px; font-weight: bold; letter-spacing: 1px; margin-top: 6px; }
  .evento { font-size: 10px; color: #666; margin-top: 2px; }
</style>
</head>
<body>
  <div class="grid">
    ${tarjetas.join('\n')}
  </div>
</body>
</html>`;

  await writeFile('out/hoja-imprimir.html', html, 'utf8');

  console.log(`Generados ${lista.length} códigos.`);
  console.log('  - out/codigos.csv');
  console.log('  - out/hoja-imprimir.html (abrir en el navegador e imprimir / exportar a PDF)');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
