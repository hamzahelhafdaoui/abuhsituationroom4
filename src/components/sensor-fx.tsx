import { useEffect, useRef, useState } from "react";
import type { Map as MlMap } from "maplibre-gl";
import { LOOK_FS, LOOK_VS, gsdMeters, niirsFromZoom, type LookId } from "@/lib/looks";
import { aglKm } from "@/lib/spy-cam";
import { toMgrs } from "@/lib/mgrs";
import { useAppStore } from "@/lib/store";
import type { DetectHit } from "@/lib/imagery-detect";
import type { FlightEvent } from "@/lib/types";
import { cn } from "@/lib/utils";

const FILTERS: Record<LookId, string> = {
  none: "",
  crt: "contrast(1.18) saturate(1.25) sepia(0.28)",
  nvg: "grayscale(1) sepia(1) hue-rotate(70deg) saturate(7) brightness(1.2) contrast(1.35)",
  flir: "grayscale(1) contrast(1.7) brightness(1.12)",
  noir: "grayscale(1) contrast(1.45) brightness(0.92)",
  snow: "grayscale(0.35) brightness(1.22) saturate(0.55) hue-rotate(190deg)",
};

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type);
  if (!sh) return null;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

function makeProgram(gl: WebGLRenderingContext, fsSrc: string) {
  const vs = compile(gl, gl.VERTEX_SHADER, LOOK_VS);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
  if (!vs || !fs) return null;
  const p = gl.createProgram();
  if (!p) return null;
  gl.attachShader(p, vs);
  gl.attachShader(p, fs);
  gl.bindAttribLocation(p, 0, "aPos");
  gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) return null;
  return p;
}

export function LookFx({
  mapRef,
  flights,
  detections,
}: {
  mapRef: { current: MlMap | null };
  flights: FlightEvent[];
  detections: DetectHit[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const look = useAppStore((s) => s.look);
  const hudOn = useAppStore((s) => s.hudOn);
  const detectOn = useAppStore((s) => s.detectOn);
  const [telem, setTelem] = useState({ lat: 0, lon: 0, z: 0, mgrs: "—", gsd: "—", niirs: "—", agl: "—" });
  const [boxes, setBoxes] = useState<Array<{ x: number; y: number; w: number; h: number; id: string; label: string }>>([]);
  const glRef = useRef<{
    gl: WebGLRenderingContext;
    programs: Partial<Record<LookId, WebGLProgram>>;
    buf: WebGLBuffer;
    tex: WebGLTexture;
  } | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
    if (!gl) return;
    const buf = gl.createBuffer();
    if (!buf) return;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    const tex = gl.createTexture();
    if (!tex) return;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const programs: Partial<Record<LookId, WebGLProgram>> = {};
    (Object.keys(LOOK_FS) as Array<keyof typeof LOOK_FS>).forEach((id) => {
      const p = makeProgram(gl, LOOK_FS[id]);
      if (p) programs[id] = p;
    });
    glRef.current = { gl, programs, buf, tex };
    return () => {
      glRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    const canvas = canvasRef.current;
    const pack = glRef.current;
    if (!map || !canvas) return;

    const tick = () => {
      const c = map.getCenter();
      const z = map.getZoom();
      const gsd = gsdMeters(c.lat, z);
      const agl = aglKm(c.lat, z);
      setTelem({
        lat: c.lat,
        lon: c.lng,
        z,
        mgrs: toMgrs(c.lat, c.lng),
        gsd: gsd >= 10 ? `${gsd.toFixed(0)} m` : `${gsd.toFixed(1)} m`,
        niirs: niirsFromZoom(z).toFixed(1),
        agl: agl >= 10 ? `${agl.toFixed(0)} km` : `${agl.toFixed(1)} km`,
      });
      if (hudOn && (detectOn || look !== "none")) {
        const next: typeof boxes = [];
        const src = detectOn ? detections.slice(0, 10) : [];
        for (const h of src) {
          const p = map.project([h.lon, h.lat]);
          if (p.x < 8 || p.y < 8 || p.x > canvas.clientWidth - 8 || p.y > canvas.clientHeight - 8) continue;
          next.push({ x: p.x, y: p.y, w: 46, h: 36, id: h.id, label: h.title.slice(0, 18) });
        }
        let n = 0;
        for (const f of flights) {
          if (n >= 8) break;
          const p = map.project([f.lon, f.lat]);
          if (p.x < 8 || p.y < 8 || p.x > canvas.clientWidth - 8 || p.y > canvas.clientHeight - 8) continue;
          next.push({
            x: p.x,
            y: p.y,
            w: 42,
            h: 28,
            id: f.id,
            label: f.hex || f.typeCode || "ADS-B",
          });
          n += 1;
        }
        setBoxes(next);
      } else {
        setBoxes([]);
      }

      const srcCanvas = map.getCanvas();
      const lookId = useAppStore.getState().look;
      if (lookId === "none") {
        canvas.style.opacity = "0";
        srcCanvas.style.filter = "";
        return;
      }
      const prog = pack?.programs[lookId];
      if (!pack || !prog) {
        canvas.style.opacity = "0";
        srcCanvas.style.filter = FILTERS[lookId];
        return;
      }
      const { gl, buf, tex } = pack;
      const w = srcCanvas.width;
      const h = srcCanvas.height;
      if (w < 8 || h < 8) return;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      try {
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, srcCanvas);
      } catch {
        canvas.style.opacity = "0";
        srcCanvas.style.filter = FILTERS[lookId];
        return;
      }
      gl.uniform1i(gl.getUniformLocation(prog, "uMap"), 0);
      gl.uniform2f(gl.getUniformLocation(prog, "uRes"), w, h);
      gl.uniform1f(gl.getUniformLocation(prog, "uTime"), performance.now() / 1000);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      canvas.style.opacity = "1";
      srcCanvas.style.filter = "";
    };

    map.on("render", tick);
    tick();
    return () => {
      map.off("render", tick);
    };
  }, [mapRef, flights, detections, look, hudOn, detectOn]);

  const showHud = hudOn;
  const military = look === "crt" || look === "nvg" || look === "flir";

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none absolute inset-0 z-[8] h-full w-full"
        style={{ opacity: 0 }}
        aria-hidden
      />
      {showHud ? (
        <>
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] flex justify-center bg-bg/70 py-0.5 font-mono text-[9px] tracking-[0.28em] text-accent">
            DOCUMENTATION ONLY · NO TARGETING
          </div>
          <div className="pointer-events-none absolute left-3 top-[4.6rem] z-[16] hidden font-mono text-[10px] leading-relaxed tracking-wide text-accent/90 sm:block">
            <div>LAT {telem.lat.toFixed(4)}</div>
            <div>LON {telem.lon.toFixed(4)}</div>
            <div>MGRS {telem.mgrs}</div>
            <div>GSD {telem.gsd}</div>
            <div>AGL {telem.agl}</div>
            <div>NIIRS {telem.niirs}</div>
            <div>Z {telem.z.toFixed(1)}</div>
            {military ? (
              <div className="mt-1 flex items-center gap-1.5">
                <span className="inline-block size-1.5 rounded-full bg-damage live-pulse" />
                REC
              </div>
            ) : null}
          </div>
          {boxes.map((b) => (
            <div
              key={b.id}
              className="detect-box"
              style={{ left: b.x - b.w / 2, top: b.y - b.h / 2, width: b.w, height: b.h }}
            >
              <b>{b.label}</b>
            </div>
          ))}
        </>
      ) : null}
    </>
  );
}

export function LookTray() {
  const look = useAppStore((s) => s.look);
  const setLook = useAppStore((s) => s.setLook);
  const hudOn = useAppStore((s) => s.hudOn);
  const setHudOn = useAppStore((s) => s.setHudOn);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const hit = ["none", "crt", "nvg", "flir", "noir", "snow"][Number(e.key) - 1] as LookId | undefined;
      if (!hit) return;
      e.preventDefault();
      setLook(hit);
      if (hit !== "none") setHudOn(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setLook, setHudOn]);

  if (!hudOn) return null;
  return (
    <div className="hud-panel pointer-events-auto flex items-center gap-0.5 p-1">
      {(["none", "crt", "nvg", "flir", "noir", "snow"] as LookId[]).map((id, i) => (
        <button
          key={id}
          type="button"
          title={`${id.toUpperCase()} · key ${i + 1}`}
          onClick={() => setLook(id)}
          className={cn(
            "h-8 min-w-9 rounded-sm px-1.5 font-mono text-[10px] tracking-wider",
            look === id ? "bg-accent text-accent-fg" : "text-muted hover:text-fg",
          )}
        >
          {id === "none" ? "OPT" : id.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
