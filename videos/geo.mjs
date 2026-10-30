// Prepara los mapas reales para el video "Viaje": mundo (Natural Earth, dominio público, vía world-atlas)
// y estados de México (@svg-maps/mexico, CC BY 4.0).
import fs from 'node:fs';
import { feature, mesh } from 'topojson-client';
import { geoContains } from 'd3-geo';
import mexico from '@svg-maps/mexico';
const r = (p) => JSON.parse(fs.readFileSync(new URL(p, import.meta.url)));
const paises = r('./node_modules/world-atlas/countries-50m.json');
const l110 = r('./node_modules/world-atlas/land-110m.json');
const tierra = feature(l110, l110.objects.land);
const bordes = mesh(paises, paises.objects.countries);
const mx = feature(paises, paises.objects.countries).features.find((f) => f.properties.name === 'Mexico');
const red = (n) => Math.round(n * 100) / 100;
const lineas = (g) => (g.type === 'MultiLineString' ? g.coordinates : g.type === 'LineString' ? [g.coordinates] : g.type === 'Polygon' ? g.coordinates : g.coordinates.flat());
const puntos = [];
for (let lat = -58; lat <= 78; lat += 1.1)
  for (let lon = -180; lon < 180; lon += 1.1 / Math.max(0.25, Math.cos((lat * Math.PI) / 180)))
    if (geoContains(tierra, [lon, lat])) puntos.push(red(lon), red(lat));
// México con más detalle
for (let lat = 14; lat <= 33; lat += 0.25) for (let lon = -118; lon <= -86; lon += 0.25) if (geoContains(mx, [lon, lat])) puntos.push(red(lon), red(lat));
fs.mkdirSync('public/viaje', { recursive: true });
fs.writeFileSync('public/viaje/mundo.json', JSON.stringify({ puntos, bordes: lineas(bordes).map((l) => l.flat().map(red)), mexico: lineas(mx.geometry).map((l) => l.flat().map(red)) }));
// estados: el svg es Mercator; ajustamos con la caja de México real
let [x0, y0, x1, y1] = [1e9, 1e9, -1e9, -1e9];
const m = mexico.default ?? mexico;
fs.writeFileSync('public/viaje/estados.json', JSON.stringify({ viewBox: m.viewBox, estados: m.locations.map((l) => ({ id: l.id, nombre: l.name, d: l.path })) }));
console.log('puntos', puntos.length / 2, 'bordes', lineas(bordes).length);
