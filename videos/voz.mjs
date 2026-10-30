// Genera la voz de cada guion con ElevenLabs en una sola toma (suena más natural
// que línea por línea) y anota cuándo empieza cada línea: public/voz/<id>/toma.mp3
// y public/voz/<id>/tiempos.json.
// Las etiquetas entre corchetes ([inhales], [warmly], [excited], [pause]...) le dan
// respiraciones y emoción; no se leen en voz alta.
// Uso: ELEVENLABS_API_KEY=... npm run voz            (todos los guiones)
//      ELEVENLABS_API_KEY=... npm run voz compradores (solo uno)
//      ELEVENLABS_API_KEY=... npm run voz compradores mi-grabacion.mp3
//        (usa tu propia grabación en vez de generar la voz; solo la transcribe)
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';

const API = 'https://api.elevenlabs.io/v1';
const dir = new URL('./src/guiones/', import.meta.url);
const [solo, grabacion] = process.argv.slice(2);
const clave = process.env.ELEVENLABS_API_KEY ? { 'xi-api-key': process.env.ELEVENLABS_API_KEY } : {};

const palabras = (texto) =>
  texto
    .replace(/\[[^\]]*\]/g, ' ')
    .split(/\s+/)
    .filter((p) => /[\p{L}\p{N}]/u.test(p));

const pedir = async (ruta, opciones) => {
  const r = await fetch(`${API}${ruta}`, { ...opciones, headers: { ...clave, ...opciones.headers } });
  if (!r.ok) throw new Error(`${ruta}: ${r.status} ${await r.text()}`);
  return r;
};

for (const archivo of readdirSync(dir).filter((f) => f.endsWith('.json'))) {
  const guion = JSON.parse(readFileSync(new URL(archivo, dir), 'utf8'));
  if (solo && guion.id !== solo) continue;
  const salida = new URL(`./public/voz/${guion.id}/`, import.meta.url);
  mkdirSync(salida, { recursive: true });

  const audio = grabacion
    ? readFileSync(grabacion)
    : await pedir(`/text-to-speech/${guion.voz}?output_format=mp3_44100_128`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: guion.lineas.join(' '), model_id: guion.modelo ?? 'eleven_v3', language_code: 'es' }),
      }).then((r) => r.arrayBuffer());
  writeFileSync(new URL('toma.mp3', salida), Buffer.from(audio));

  // Transcribe la toma para saber en qué segundo empieza cada línea.
  const form = new FormData();
  form.append('model_id', 'scribe_v1');
  form.append('file', new Blob([audio], { type: 'audio/mpeg' }), 'toma.mp3');
  const { words } = await pedir('/speech-to-text', { method: 'POST', body: form }).then((r) => r.json());
  const dichas = words.filter((w) => w.type === 'word');
  const inicios = [];
  let n = 0;
  for (const linea of guion.lineas) {
    inicios.push(+dichas[Math.min(n, dichas.length - 1)].start.toFixed(2));
    n += palabras(linea).length;
  }
  const fin = +dichas.at(-1).end.toFixed(2);
  const lista = dichas.map((w) => ({ t: +w.start.toFixed(2), w: w.text.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '') }));
  writeFileSync(new URL('tiempos.json', salida), JSON.stringify({ inicios, fin, palabras: lista }, null, 1));
  console.log(`✓ ${guion.id}: ${fin}s, líneas en ${inicios.join(', ')}`);
}
