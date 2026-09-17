/** Sensor looks adapted from bilawalsidhu/gods-eye-view (MIT) — CRT / NVG / FLIR / Noir / Snow. */

export type LookId = "none" | "crt" | "nvg" | "flir" | "noir" | "snow";

export interface Look {
  id: LookId;
  short: string;
  label: string;
  key: string;
  accent: string;
  fg: string;
}

export const LOOKS: Look[] = [
  { id: "none", short: "OPT", label: "Optical", key: "1", accent: "#9adbb8", fg: "#d5e4dc" },
  { id: "crt", short: "CRT", label: "CRT phosphor", key: "2", accent: "#ffaa00", fg: "#ffd080" },
  { id: "nvg", short: "NVG", label: "Night vision", key: "3", accent: "#33ff51", fg: "#b8ffc0" },
  { id: "flir", short: "FLIR", label: "Thermal / ironbow", key: "4", accent: "#f4f0ea", fg: "#f4f0ea" },
  { id: "noir", short: "NOIR", label: "Noir", key: "5", accent: "#d8d2c6", fg: "#e8e2d6" },
  { id: "snow", short: "SNOW", label: "Snow", key: "6", accent: "#c8e4f0", fg: "#e8f4fa" },
];

export const LOOK_BY_ID = Object.fromEntries(LOOKS.map((l) => [l.id, l])) as Record<LookId, Look>;

export const LOOK_RASTER: Record<
  LookId,
  { sat: number; hue: number; contrast: number; bright: number }
> = {
  none: { sat: 0, hue: 0, contrast: 0, bright: 0 },
  crt: { sat: 0.25, hue: 18, contrast: 0.28, bright: 0.04 },
  nvg: { sat: -0.92, hue: 108, contrast: 0.35, bright: 0.12 },
  flir: { sat: -1, hue: 0, contrast: 0.48, bright: 0.08 },
  noir: { sat: -1, hue: 12, contrast: 0.38, bright: -0.04 },
  snow: { sat: -0.45, hue: 200, contrast: 0.12, bright: 0.22 },
};

const VS = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const CRT = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uMap;
uniform vec2 uRes;
uniform float uTime;
float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
void main() {
  vec2 uv = vUv;
  vec2 c = uv * 2.0 - 1.0;
  float r2 = dot(c, c);
  c *= 1.0 + r2 * 0.06;
  uv = c * 0.5 + 0.5;
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  float lineY = floor(uv.y * uRes.y);
  float j = (hash(vec2(lineY, floor(uTime * 8.0))) - 0.5) * 0.003;
  vec2 juv = uv + vec2(j, 0.0);
  vec2 off = (juv - 0.5) * 0.004;
  float r = texture2D(uMap, juv + off).r;
  float g = texture2D(uMap, juv).g;
  float b = texture2D(uMap, juv - off).b;
  vec3 col = vec3(r, g, b);
  float scan = 0.82 + 0.18 * sin(uv.y * uRes.y * 3.14159);
  col *= scan;
  float flicker = 1.0 - 0.025 * (0.5 + 0.5 * sin(uTime * 48.0));
  col *= flicker;
  col *= vec3(1.05, 0.98, 0.78);
  vec2 vig = uv * (1.0 - uv);
  col *= pow(vig.x * vig.y * 16.0, 0.22);
  gl_FragColor = vec4(col, 1.0);
}
`;

const NVG = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uMap;
uniform vec2 uRes;
uniform float uTime;
float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
void main() {
  vec2 uv = vUv;
  vec2 c = uv * 2.0 - 1.0;
  c.x *= uRes.x / uRes.y;
  float rad = length(c);
  float tube = pow(1.0 - smoothstep(0.72, 1.12, rad), 0.7);
  if (tube < 0.01) {
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  vec2 d = uv * 2.0 - 1.0;
  d *= 1.0 + dot(d, d) * 0.12;
  vec2 duv = d * 0.5 + 0.5;
  vec3 src = texture2D(uMap, duv).rgb;
  float luma = dot(src, vec3(0.299, 0.587, 0.114));
  luma = pow(clamp(luma * 1.55, 0.0, 1.0), 0.85);
  vec2 texel = 1.0 / uRes;
  float bloom = 0.0;
  bloom += texture2D(uMap, duv + vec2(texel.x * 4.0, 0.0)).g;
  bloom += texture2D(uMap, duv - vec2(texel.x * 4.0, 0.0)).g;
  bloom += texture2D(uMap, duv + vec2(0.0, texel.y * 4.0)).g;
  bloom += texture2D(uMap, duv - vec2(0.0, texel.y * 4.0)).g;
  luma += bloom * 0.08;
  float noise = (hash(duv * uRes + uTime) - 0.5) * 0.12;
  vec3 green = vec3(0.05, luma + noise, 0.08) * vec3(0.35, 1.35, 0.4);
  float scan = 0.88 + 0.12 * sin(uv.y * uRes.y * 1.2);
  green *= scan * tube * (1.0 - rad * rad * 0.18);
  gl_FragColor = vec4(green, 1.0);
}
`;

const FLIR = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uMap;
uniform vec2 uRes;
uniform float uTime;
vec3 ironbow(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c0 = vec3(0.0, 0.0, 0.0);
  vec3 c1 = vec3(0.13, 0.0, 0.30);
  vec3 c2 = vec3(0.49, 0.0, 0.45);
  vec3 c3 = vec3(0.86, 0.10, 0.18);
  vec3 c4 = vec3(1.0, 0.55, 0.0);
  vec3 c5 = vec3(1.0, 0.91, 0.32);
  vec3 c6 = vec3(1.0, 1.0, 1.0);
  float s = t * 6.0;
  if (s < 1.0) return mix(c0, c1, s);
  if (s < 2.0) return mix(c1, c2, s - 1.0);
  if (s < 3.0) return mix(c2, c3, s - 2.0);
  if (s < 4.0) return mix(c3, c4, s - 3.0);
  if (s < 5.0) return mix(c4, c5, s - 4.0);
  return mix(c5, c6, s - 5.0);
}
void main() {
  vec2 uv = vUv;
  vec3 src = texture2D(uMap, uv).rgb;
  float t = dot(src, vec3(0.299, 0.587, 0.114));
  t = pow(clamp((t - 0.08) * 1.35, 0.0, 1.0), 0.82);
  vec3 col = ironbow(t);
  float scan = 0.9 + 0.1 * sin(uv.y * uRes.y * 0.8 + uTime);
  col *= scan;
  vec2 vig = uv * (1.0 - uv);
  col *= pow(vig.x * vig.y * 18.0, 0.18);
  gl_FragColor = vec4(col, 1.0);
}
`;

const NOIR = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uMap;
uniform vec2 uRes;
void main() {
  vec2 uv = vUv;
  vec3 src = texture2D(uMap, uv).rgb;
  float luma = dot(src, vec3(0.299, 0.587, 0.114));
  luma = clamp((luma - 0.5) * 1.45 + 0.5, 0.0, 1.0);
  float grain = fract(sin(dot(uv * uRes, vec2(12.9898, 78.233))) * 43758.5453);
  luma += (grain - 0.5) * 0.06;
  vec3 sepia = vec3(luma * 1.02, luma * 0.96, luma * 0.82);
  vec2 vig = uv * (1.0 - uv);
  sepia *= pow(vig.x * vig.y * 15.0, 0.28);
  gl_FragColor = vec4(sepia, 1.0);
}
`;

const SNOW = `
precision mediump float;
varying vec2 vUv;
uniform sampler2D uMap;
uniform vec2 uRes;
uniform float uTime;
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
void main() {
  vec2 uv = vUv;
  vec3 src = texture2D(uMap, uv).rgb;
  float luma = dot(src, vec3(0.299, 0.587, 0.114));
  vec3 cold = mix(src, vec3(luma), 0.55) * vec3(0.82, 0.9, 1.05) + 0.12;
  float flakes = 0.0;
  for (int i = 0; i < 3; i++) {
    float layer = float(i);
    vec2 suv = uv * (3.0 + layer * 3.0);
    suv.y += uTime * (0.12 + layer * 0.08);
    suv.x += sin(uTime * 0.4 + layer) * 0.2;
    vec2 f = fract(suv);
    float n = hash(floor(suv) + layer * 17.0);
    flakes += step(0.92, n) * smoothstep(0.08, 0.0, length(f - 0.5));
  }
  gl_FragColor = vec4(cold + flakes * 0.85, 1.0);
}
`;

export const LOOK_FS: Record<Exclude<LookId, "none">, string> = {
  crt: CRT,
  nvg: NVG,
  flir: FLIR,
  noir: NOIR,
  snow: SNOW,
};

export const LOOK_VS = VS;

export function gsdMeters(lat: number, zoom: number) {
  return (156543.03392 * Math.cos((lat * Math.PI) / 180)) / 2 ** zoom;
}

export function niirsFromZoom(zoom: number) {
  const n = 0.4 * zoom - 0.6;
  return Math.max(1, Math.min(8.5, n));
}
