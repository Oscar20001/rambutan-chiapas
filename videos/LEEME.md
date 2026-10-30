# Videos de Ixchel (Remotion)

Videos verticales 1080×1920 para Reels/TikTok, con los colores y letras del sitio.

- `src/guiones/*.json`: el texto que dice la voz, línea por línea. Cada línea es una escena.
- `npm run voz`: genera la voz con ElevenLabs (necesita la variable `ELEVENLABS_API_KEY`).
- `npm run studio`: abre el editor de Remotion en el navegador para ver y ajustar.
- `npx remotion render Compradores out/Compradores.mp4`: renderiza el video.

La duración de cada video sale de la voz: si cambias el guion y regeneras la voz, las escenas se acomodan solas.
