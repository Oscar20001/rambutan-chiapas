// Genera la voz de cada guion con ElevenLabs: public/voz/<id>/<n>.mp3
// Uso: ELEVENLABS_API_KEY=... npm run voz            (todos los guiones)
//      ELEVENLABS_API_KEY=... npm run voz compradores (solo uno)
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const dir = new URL('./src/guiones/', import.meta.url);
const solo = process.argv[2];
const clave = process.env.ELEVENLABS_API_KEY;

for (const archivo of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const guion = JSON.parse(readFileSync(new URL(archivo, dir), 'utf8'));
  if (solo && guion.id !== solo) continue;
  const salida = new URL(`./public/voz/${guion.id}/`, import.meta.url);
  mkdirSync(salida, { recursive: true });
  for (const [n, texto] of guion.lineas.entries()) {
    const r = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${guion.voz}?output_format=mp3_44100_128`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(clave && { 'xi-api-key': clave }) },
        body: JSON.stringify({
          text: texto,
          model_id: 'eleven_multilingual_v2',
          language_code: 'es',
          voice_settings: { stability: 0.45, similarity_boost: 0.8, style: 0.35 },
        }),
      },
    );
    if (!r.ok) throw new Error(`${guion.id} línea ${n}: ${r.status} ${await r.text()}`);
    writeFileSync(new URL(`${n}.mp3`, salida), Buffer.from(await r.arrayBuffer()));
    console.log(`✓ ${guion.id}/${n}.mp3  ${texto}`);
  }
}
