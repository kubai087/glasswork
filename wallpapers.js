/*
 * Moving wallpapers drawn live in WebGL 2, each with a light and a dark
 * look that the theme crossfades between. Written for this project, so
 * they are covered by its MIT license, unlike the Tahoe videos.
 *
 * Each scene is one full-screen fragment shader. The canvas keeps its
 * drawing buffer, so the glass can sample the wallpaper under it the same
 * way it samples a video frame.
 *
 *   const scene = createScene(canvas);   // null without WebGL 2
 *   scene.setMode('dunes');
 *   scene.setDark(true);
 *   scene.setPlaying(true);
 */

const VERT = `#version 300 es
in vec2 aPos;
void main() { gl_Position = vec4(aPos, 0.0, 1.0); }`;

// Shared by every scene: the uniforms, value noise and fbm, and a
// per-pixel dither that keeps the soft gradients from banding.
const HEAD = `#version 300 es
precision highp float;
uniform vec2 uRes;
uniform float uTime;
uniform float uDark;
out vec4 outColor;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0;
  float a = 0.5;
  mat2 m = mat2(1.6, 1.2, -1.2, 1.6);
  for (int i = 0; i < 5; i++) {
    v += a * noise(p);
    p = m * p;
    a *= 0.5;
  }
  return v;
}

void finish(vec3 color) {
  color += (hash(gl_FragCoord.xy) - 0.5) / 128.0;
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}
`;

// Soft blobs of color drifting into each other, the way macOS's own
// gradient wallpapers move.
const MESH = `${HEAD}
const vec3 LIGHT[5] = vec3[5](vec3(1.0, 0.76, 0.62), vec3(0.78, 0.70, 1.0), vec3(0.58, 0.78, 1.0), vec3(0.62, 0.93, 0.82), vec3(1.0, 0.62, 0.78));
const vec3 DARK[5] = vec3[5](vec3(0.20, 0.12, 0.52), vec3(0.58, 0.10, 0.44), vec3(0.03, 0.36, 0.46), vec3(0.04, 0.06, 0.22), vec3(0.34, 0.14, 0.66));
void main() {
  float ar = uRes.x / uRes.y;
  vec2 p = gl_FragCoord.xy / uRes.y;
  float t = uTime * 0.12;
  vec2 q = p + 0.28 * vec2(fbm(p * 1.2 + t), fbm(p * 1.2 - t + 3.1)) - 0.14;
  vec3 color = vec3(0.0);
  float total = 0.0;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec2 c = vec2(0.5 * ar, 0.5) + vec2(cos(t * (0.7 + 0.13 * fi) + fi * 1.7) * 0.46 * ar, sin(t * (0.9 + 0.11 * fi) + fi * 2.3) * 0.42);
    float d = length(q - c);
    float w = 1.0 / (pow(d, 2.4) + 0.015);
    color += w * mix(LIGHT[i], DARK[i], uDark);
    total += w;
  }
  color /= total;
  color *= 0.94 + 0.1 * fbm(p * 2.0 - t);
  finish(color);
}`;

// Layered dunes rolling slowly, each with a lit crest and a soft shadow on
// the one behind.
const DUNES = `${HEAD}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  float x = uv.x * uRes.x / uRes.y;
  float t = uTime * 0.1;
  vec3 skyLight = mix(vec3(0.99, 0.93, 0.86), vec3(0.62, 0.78, 0.98), uv.y);
  vec3 skyDark = mix(vec3(0.22, 0.13, 0.38), vec3(0.03, 0.04, 0.12), uv.y);
  vec3 color = mix(skyLight, skyDark, uDark);
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    float k = fi / 5.0;
    float h = 0.8 - fi * 0.13
      + 0.07 * sin(x * (1.1 + fi * 0.35) + t * (1.0 + fi * 0.3) + fi * 1.9)
      + 0.035 * sin(x * (2.3 + fi * 0.5) - t * 1.3 + fi)
      + 0.05 * (fbm(vec2(x * 1.2 + fi * 4.0, t * 0.4)) - 0.5);
    float d = uv.y - h;
    float aa = fwidth(d) * 1.2;
    float inside = smoothstep(aa, -aa, d);
    // The layer's shadow on the one behind it.
    color *= 1.0 - 0.22 * exp(-max(d, 0.0) * 28.0) * step(0.0, d);
    float depth = clamp(-d * 2.6, 0.0, 1.0);
    vec3 topLight = mix(vec3(0.84, 0.90, 0.99), vec3(0.10, 0.36, 0.92), k);
    vec3 deepLight = mix(vec3(0.62, 0.74, 0.96), vec3(0.02, 0.12, 0.55), k);
    vec3 topDark = mix(vec3(0.40, 0.30, 0.70), vec3(0.08, 0.10, 0.42), k);
    vec3 deepDark = mix(vec3(0.16, 0.12, 0.38), vec3(0.01, 0.02, 0.12), k);
    vec3 layer = mix(mix(topLight, deepLight, depth), mix(topDark, deepDark, depth), uDark);
    float crest = exp(-pow(d * 70.0, 2.0));
    layer += crest * mix(vec3(0.5), vec3(0.35, 0.3, 0.6), uDark);
    color = mix(color, layer, inside);
  }
  finish(color);
}`;

// Curtains of light over a dawn sky, or a night sky with stars.
const AURORA = `${HEAD}
const vec3 LIGHT[3] = vec3[3](vec3(0.45, 0.92, 0.72), vec3(0.50, 0.78, 1.0), vec3(0.86, 0.62, 1.0));
const vec3 DARK[3] = vec3[3](vec3(0.20, 1.0, 0.55), vec3(0.15, 0.70, 1.0), vec3(0.75, 0.30, 1.0));
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = gl_FragCoord.xy / uRes.y;
  float t = uTime * 0.08;
  vec3 light = mix(vec3(1.0, 0.88, 0.80), vec3(0.62, 0.76, 0.98), uv.y);
  vec3 dark = mix(vec3(0.04, 0.08, 0.17), vec3(0.01, 0.01, 0.05), uv.y);
  for (int i = 0; i < 3; i++) {
    float fi = float(i);
    float x = p.x * (0.8 + fi * 0.25) + fi * 3.7;
    float center = 0.38 + 0.13 * fi + 0.22 * (fbm(vec2(x * 0.8, t + fi)) - 0.5) + 0.05 * sin(x * 2.0 + t * 3.0 + fi);
    float dy = uv.y - center;
    float band = dy < 0.0 ? exp(dy * 34.0) : exp(-dy * 5.0);
    float rays = 0.45 + 0.55 * fbm(vec2(x * 14.0, t * 2.0 + fi * 5.0));
    float glow = band * rays;
    light = mix(light, LIGHT[i] * 0.92, min(1.0, glow * 0.85));
    dark += DARK[i] * glow * 0.75;
  }
  float star = step(0.9975, hash(floor(gl_FragCoord.xy / 2.0))) * (0.5 + 0.5 * sin(uTime * 2.0 + hash(floor(gl_FragCoord.xy)) * 40.0));
  dark += star * uv.y * 0.8;
  finish(mix(light, dark, uDark));
}`;

// Blobs that merge and part, with a sharp edge for the rim to bend.
const LAVA = `${HEAD}
void main() {
  float ar = uRes.x / uRes.y;
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime * 0.22;
  float field = 0.0;
  for (int i = 0; i < 9; i++) {
    float fi = float(i);
    vec2 c = vec2(sin(t * (0.5 + 0.07 * fi) + fi * 2.1) * (0.5 * ar - 0.12), cos(t * (0.43 + 0.09 * fi) + fi * 1.3) * 0.38);
    float r = 0.1 + 0.05 * sin(fi * 1.7);
    vec2 d = p - c;
    field += r * r / dot(d, d);
  }
  float aa = fwidth(field);
  float inside = smoothstep(1.0 - aa, 1.0 + aa, field);
  vec3 bg = mix(mix(vec3(0.99, 0.95, 0.90), vec3(0.94, 0.86, 0.88), uv.y), mix(vec3(0.05, 0.03, 0.09), vec3(0.11, 0.04, 0.13), uv.y), uDark);
  vec3 blob = mix(mix(vec3(1.0, 0.48, 0.22), vec3(0.93, 0.22, 0.55), uv.y), mix(vec3(1.0, 0.45, 0.12), vec3(0.85, 0.12, 0.62), uv.y), uDark);
  blob *= 0.82 + 0.18 * clamp((field - 1.0) * 0.6, 0.0, 1.0);
  vec3 color = mix(bg, blob, inside);
  // A glow round the blobs in the dark.
  color += uDark * blob * 0.35 * smoothstep(0.35, 1.0, field) * (1.0 - inside);
  finish(color);
}`;

// Rings of ink rippling out: the hardest test for the rim and its color
// split.
const LINES = `${HEAD}
void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime * 0.2;
  vec2 w = p + 0.15 * vec2(sin(p.y * 3.0 + t), cos(p.x * 2.5 - t * 1.2));
  vec2 c = vec2(0.25 * sin(t * 0.7), 0.15 * cos(t * 0.5));
  float v = length(w - c) * 30.0 - t * 4.0;
  float s = sin(v);
  float aa = fwidth(s) * 1.2;
  float stripe = smoothstep(-aa, aa, s);
  float hue = 0.5 + 0.5 * sin(atan(w.y - c.y, w.x - c.x) + t);
  vec3 inkLight = mix(vec3(0.12, 0.22, 0.86), vec3(0.92, 0.20, 0.42), hue);
  vec3 inkDark = mix(vec3(0.55, 0.75, 1.0), vec3(1.0, 0.62, 0.80), hue);
  vec3 light = mix(vec3(0.97, 0.96, 0.93), inkLight, stripe);
  vec3 dark = mix(vec3(0.04, 0.04, 0.07), inkDark, stripe);
  finish(mix(light, dark, uDark));
}`;

// Out-of-focus lights drifting upward in layers.
const BOKEH = `${HEAD}
void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = gl_FragCoord.xy / uRes.y;
  float t = uTime * 0.05;
  vec3 light = mix(vec3(0.98, 0.92, 0.88), vec3(0.78, 0.85, 0.98), uv.y);
  vec3 dark = mix(vec3(0.08, 0.04, 0.12), vec3(0.01, 0.02, 0.07), uv.y);
  for (int l = 0; l < 4; l++) {
    float fl = float(l);
    float scale = 2.5 + fl * 1.8;
    vec2 q = p * scale + vec2(t * (0.6 + fl * 0.3), -t * (1.2 + fl * 0.5)) + fl * 7.3;
    vec2 cell = floor(q);
    vec2 f = fract(q) - 0.5;
    float h = hash(cell + fl * 17.0);
    // About half the cells hold a light.
    float lit = step(h, 0.55);
    // Offset and radius stay within the cell, or a light is cut off at its edge.
    vec2 off = (vec2(hash(cell + 3.1), hash(cell + 7.7)) - 0.5) * 0.36;
    float radius = 0.12 + 0.14 * hash(cell + 1.3);
    float d = length(f - off);
    float aa = fwidth(d) * 1.5;
    float disk = lit * smoothstep(radius + aa, radius - aa, d) * (0.75 + 0.25 * smoothstep(radius * 0.5, radius, d));
    float twinkle = 0.8 + 0.2 * sin(uTime * (0.6 + h * 2.0) + h * 30.0);
    float hue = hash(cell + 9.0);
    vec3 warm = mix(vec3(1.0, 0.62, 0.26), vec3(1.0, 0.36, 0.52), hue);
    vec3 cool = mix(vec3(0.32, 0.62, 1.0), vec3(0.62, 0.44, 1.0), hue);
    vec3 tone = hue > 0.5 ? warm : cool;
    float near = 1.0 - fl / 4.0;
    light = mix(light, mix(tone, vec3(1.0), 0.45), disk * (0.35 + 0.3 * near));
    dark += tone * disk * twinkle * (0.25 + 0.35 * near);
  }
  finish(mix(light, dark, uDark));
}`;

// In the order the panel lists them.
export const SCENES = { mesh: MESH, dunes: DUNES, aurora: AURORA, lava: LAVA, lines: LINES, bokeh: BOKEH };

// The pixels drawn for each CSS pixel: the scenes are soft and the glass
// blurs what is behind it, so one per CSS pixel is plenty.
const density = () => Math.min(devicePixelRatio || 1, 1);

// The scenes move slowly, so they draw at most 30 times a second, as the
// videos play; the glass over them then refracts half as often.
const FRAME_MS = 1000 / 30;

export function createScene(canvas) {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false, preserveDrawingBuffer: true });
  if (!gl) return null;

  let programs = new Map();
  let mode = 'mesh';
  let dark = 0;
  let darkTarget = 0;
  let time = 0;
  let speed = 1;
  let playing = false;
  let visible = false;
  let frame = 0;
  let last = 0;
  let drawn = 0;

  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }

  // Built the first time its scene is shown.
  function program(name) {
    let entry = programs.get(name);
    if (entry) return entry;
    const prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, SCENES[name]));
    gl.bindAttribLocation(prog, 0, 'aPos');
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
    entry = {
      prog,
      res: gl.getUniformLocation(prog, 'uRes'),
      time: gl.getUniformLocation(prog, 'uTime'),
      dark: gl.getUniformLocation(prog, 'uDark'),
    };
    programs.set(name, entry);
    return entry;
  }

  // One triangle that covers the screen.
  function setup() {
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  }
  setup();

  function draw() {
    const scale = density();
    const width = Math.max(1, Math.round(canvas.clientWidth * scale));
    const height = Math.max(1, Math.round(canvas.clientHeight * scale));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const p = program(mode);
    gl.viewport(0, 0, width, height);
    gl.useProgram(p.prog);
    gl.uniform2f(p.res, width, height);
    gl.uniform1f(p.time, time);
    gl.uniform1f(p.dark, dark * dark * (3 - 2 * dark));
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    // For anything drawn from this canvas (refract.js).
    canvas.dispatchEvent(new Event('scenedraw'));
  }

  function loop(now) {
    frame = 0;
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    if (playing) time += dt * speed;
    // The theme fades over 620ms, as the Tahoe videos do.
    if (dark !== darkTarget) dark = darkTarget > dark ? Math.min(darkTarget, dark + dt / 0.62) : Math.max(darkTarget, dark - dt / 0.62);
    // A frame early by a few milliseconds still counts, so 60Hz displays
    // draw every other frame rather than drifting.
    const due = !playing || now - drawn >= FRAME_MS - 4;
    if (due) {
      drawn = now;
      draw();
    }
    if (visible && !document.hidden && (playing || dark !== darkTarget)) frame = requestAnimationFrame(loop);
    else last = 0;
  }

  // Draws a frame, and keeps drawing while there is motion to show.
  function kick() {
    if (!frame && visible) frame = requestAnimationFrame(loop);
  }

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    cancelAnimationFrame(frame);
    frame = 0;
  });
  canvas.addEventListener('webglcontextrestored', () => {
    programs = new Map();
    setup();
    kick();
  });
  new ResizeObserver(kick).observe(canvas);
  document.addEventListener('visibilitychange', kick);

  return {
    canvas,
    // The seconds of motion shown so far; the player's clock runs on it.
    get time() {
      return time;
    },
    set time(value) {
      time = Math.max(0, value);
      kick();
    },
    get mode() {
      return mode;
    },
    setMode(name) {
      if (!SCENES[name]) return;
      mode = name;
      kick();
    },
    setDark(on, instant = false) {
      darkTarget = on ? 1 : 0;
      if (instant) dark = darkTarget;
      kick();
    },
    setSpeed(value) {
      speed = value;
    },
    setPlaying(on) {
      playing = on;
      kick();
    },
    setVisible(on) {
      visible = on;
      canvas.hidden = !on;
      kick();
    },
  };
}
