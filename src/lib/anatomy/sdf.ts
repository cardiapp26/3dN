/**
 * Signed-distance modelling kit for the anatomy scene: primitives, smooth
 * booleans, 3D simplex noise and a narrow-band Surface Nets mesher.
 *
 * Scene frame, in centimetres: +x patient left, +y up, +z anterior, origin
 * between the ear canals on the Frankfort plane. Everything here is pure and
 * DOM-free so it runs inside a Web Worker and under `node --test`.
 */

export type Vec3 = readonly [number, number, number];
export type Sdf = (x: number, y: number, z: number) => number;
/** Bounding sphere (cx, cy, cz, r) enclosing a primitive's surface. */
export type Bound = readonly [number, number, number, number];
/** An SDF that may carry a bounding sphere, used to skip distant parts. */
export type Shape = Sdf & { bound?: Bound };

function withBound(f: Sdf, c: Vec3, r: number): Shape {
  const s = f as Shape;
  s.bound = [c[0], c[1], c[2], r];
  return s;
}

function midpoint(a: Vec3, b: Vec3): Vec3 {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
}

function distance(a: Vec3, b: Vec3): number {
  return Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2);
}

export type GridSpec = {
  min: Vec3;
  max: Vec3;
  /** Sample spacing in cm. */
  cell: number;
  /** Upper bound on |grad f|; widens the narrow band for bumpy fields. */
  lipschitz?: number;
  /** Cheap undisplaced field used to skip empty blocks (defaults to f). */
  coarse?: Sdf;
  /** Max |f - coarse|, added to the block skip threshold. */
  slack?: number;
};

export type MeshData = {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
};

/* ------------------------------------------------------------------ */
/* Scalar helpers                                                      */
/* ------------------------------------------------------------------ */

export function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

export function mix(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(e0: number, e1: number, v: number): number {
  const t = clamp((v - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Polynomial smooth minimum; k is the blend radius in cm. */
export function smin(a: number, b: number, k: number): number {
  if (k <= 0) return a < b ? a : b;
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return (a < b ? a : b) - h * h * k * 0.25;
}

export function smax(a: number, b: number, k: number): number {
  return -smin(-a, -b, k);
}

/** Smooth 1D profile through (t, value) knots (cubic Hermite, clamped ends). */
export function profile(knots: ReadonlyArray<readonly [number, number]>): (t: number) => number {
  const pts = [...knots].sort((a, b) => a[0] - b[0]);
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const n = pts.length;
  return (t) => {
    if (t <= xs[0]) return ys[0];
    if (t >= xs[n - 1]) return ys[n - 1];
    let i = 0;
    while (t > xs[i + 1]) i += 1;
    const x0 = xs[i];
    const x1 = xs[i + 1];
    const span = x1 - x0;
    const u = (t - x0) / span;
    const y0 = ys[i];
    const y1 = ys[i + 1];
    const m0 = i > 0 ? ((y1 - ys[i - 1]) / (x1 - xs[i - 1])) * span : y1 - y0;
    const m1 = i + 2 < n ? ((ys[i + 2] - y0) / (xs[i + 2] - x0)) * span : y1 - y0;
    const u2 = u * u;
    const u3 = u2 * u;
    return (
      (2 * u3 - 3 * u2 + 1) * y0 +
      (u3 - 2 * u2 + u) * m0 +
      (-2 * u3 + 3 * u2) * y1 +
      (u3 - u2) * m1
    );
  };
}

/* ------------------------------------------------------------------ */
/* Vector helpers (setup time only; hot paths stay scalar)             */
/* ------------------------------------------------------------------ */

function sub(a: Vec3, b: Vec3): Vec3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

function dot(a: Vec3, b: Vec3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function cross(a: Vec3, b: Vec3): Vec3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

function normalize(a: Vec3): Vec3 {
  const l = Math.sqrt(dot(a, a)) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
}

/** Orthonormal (side, up) pair perpendicular to `axis`, biased toward `upHint`. */
function basis(axis: Vec3, upHint: Vec3): { s: Vec3; v: Vec3 } {
  let s = cross(upHint, axis);
  if (dot(s, s) < 1e-8) s = cross([0, 0, 1], axis);
  if (dot(s, s) < 1e-8) s = cross([1, 0, 0], axis);
  s = normalize(s);
  return { s, v: cross(axis, s) };
}

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

export function sphere(c: Vec3, r: number): Shape {
  const [cx, cy, cz] = c;
  return withBound(
    (x, y, z) => {
      const dx = x - cx;
      const dy = y - cy;
      const dz = z - cz;
      return Math.sqrt(dx * dx + dy * dy + dz * dz) - r;
    },
    c,
    r,
  );
}

/** Axis-aligned ellipsoid (Quilez bound, good near the surface). */
export function ellipsoid(c: Vec3, r: Vec3): Shape {
  const [cx, cy, cz] = c;
  const [rx, ry, rz] = r;
  const rmin = Math.min(rx, ry, rz);
  return withBound((x, y, z) => {
    const px = (x - cx) / rx;
    const py = (y - cy) / ry;
    const pz = (z - cz) / rz;
    const k0 = Math.sqrt(px * px + py * py + pz * pz);
    const k1 = Math.sqrt((px * px) / (rx * rx) + (py * py) / (ry * ry) + (pz * pz) / (rz * rz));
    return k1 === 0 ? -rmin : (k0 * (k0 - 1)) / k1;
  }, c, Math.max(rx, ry, rz));
}

/**
 * Ellipsoid whose first radius lies along `axis`; the other two follow the
 * side/up frame built from `upHint`.
 */
export function orientedEllipsoid(c: Vec3, axis: Vec3, r: Vec3, upHint: Vec3 = [0, 1, 0]): Shape {
  const u = normalize(axis);
  const { s, v } = basis(u, upHint);
  const [cx, cy, cz] = c;
  const [ra, rs, rv] = r;
  const rmin = Math.min(ra, rs, rv);
  return withBound((x, y, z) => {
    const dx = x - cx;
    const dy = y - cy;
    const dz = z - cz;
    const a = (dx * u[0] + dy * u[1] + dz * u[2]) / ra;
    const b = (dx * s[0] + dy * s[1] + dz * s[2]) / rs;
    const e = (dx * v[0] + dy * v[1] + dz * v[2]) / rv;
    const k0 = Math.sqrt(a * a + b * b + e * e);
    const k1 = Math.sqrt((a * a) / (ra * ra) + (b * b) / (rs * rs) + (e * e) / (rv * rv));
    return k1 === 0 ? -rmin : (k0 * (k0 - 1)) / k1;
  }, c, Math.max(ra, rs, rv));
}

export function capsule(a: Vec3, b: Vec3, r: number): Shape {
  const [ax, ay, az] = a;
  const bax = b[0] - ax;
  const bay = b[1] - ay;
  const baz = b[2] - az;
  const bb = bax * bax + bay * bay + baz * baz || 1;
  return withBound((x, y, z) => {
    const px = x - ax;
    const py = y - ay;
    const pz = z - az;
    const h = clamp((px * bax + py * bay + pz * baz) / bb, 0, 1);
    const dx = px - bax * h;
    const dy = py - bay * h;
    const dz = pz - baz * h;
    return Math.sqrt(dx * dx + dy * dy + dz * dz) - r;
  }, midpoint(a, b), distance(a, b) / 2 + r);
}

/** Cone with spherical caps of radius r1 at a and r2 at b (Quilez). */
export function roundCone(a: Vec3, b: Vec3, r1: number, r2: number): Shape {
  const [ax, ay, az] = a;
  const bax = b[0] - ax;
  const bay = b[1] - ay;
  const baz = b[2] - az;
  const l2 = bax * bax + bay * bay + baz * baz;
  const rr = r1 - r2;
  const a2 = l2 - rr * rr;
  const il2 = 1 / l2;
  return withBound((x, y, z) => {
    const pax = x - ax;
    const pay = y - ay;
    const paz = z - az;
    const yy = pax * bax + pay * bay + paz * baz;
    const zz = yy - l2;
    const xvx = pax * l2 - bax * yy;
    const xvy = pay * l2 - bay * yy;
    const xvz = paz * l2 - baz * yy;
    const x2 = xvx * xvx + xvy * xvy + xvz * xvz;
    const y2 = yy * yy * l2;
    const z2 = zz * zz * l2;
    const k = Math.sign(rr) * rr * rr * x2;
    if (Math.sign(zz) * a2 * z2 > k) return Math.sqrt(x2 + z2) * il2 - r2;
    if (Math.sign(yy) * a2 * y2 < k) return Math.sqrt(x2 + y2) * il2 - r1;
    return (Math.sqrt(x2 * a2 * il2) + yy * rr) * il2 - r1;
  }, midpoint(a, b), distance(a, b) / 2 + Math.max(r1, r2));
}

/**
 * Flattened, tapered segment: an elliptical cross-section (half-width w
 * along the side axis, half-thickness t along the up axis) swept from a to b,
 * with ellipsoidal end caps. Good for muscle bellies, bone plates and bands.
 */
export function band(
  a: Vec3,
  b: Vec3,
  w: number | readonly [number, number],
  t: number | readonly [number, number],
  upHint: Vec3,
): Shape {
  const [w1, w2] = typeof w === "number" ? [w, w] : w;
  const [t1, t2] = typeof t === "number" ? [t, t] : t;
  const d = sub(b, a);
  const len = Math.sqrt(dot(d, d)) || 1;
  const u = normalize(d);
  const { s, v } = basis(u, upHint);
  const [ax, ay, az] = a;
  return withBound((x, y, z) => {
    const qx = x - ax;
    const qy = y - ay;
    const qz = z - az;
    const along = qx * u[0] + qy * u[1] + qz * u[2];
    const h = clamp(along / len, 0, 1);
    const over = along - h * len;
    const ww = w1 + (w2 - w1) * h;
    const tt = t1 + (t2 - t1) * h;
    const m = ww < tt ? ww : tt;
    const ds = (qx * s[0] + qy * s[1] + qz * s[2]) / ww;
    const dv = (qx * v[0] + qy * v[1] + qz * v[2]) / tt;
    const da = over / m;
    return (Math.sqrt(ds * ds + dv * dv + da * da) - 1) * m;
  }, midpoint(a, b), len / 2 + Math.max(w1, w2, t1, t2));
}

/** Ring around `axis` with elliptical radii (rs, rv) and tube radius r. */
export function torus(c: Vec3, axis: Vec3, rs: number, rv: number, r: number, upHint: Vec3 = [0, 1, 0]): Shape {
  const n = normalize(axis);
  const { s, v } = basis(n, upHint);
  const [cx, cy, cz] = c;
  return withBound((x, y, z) => {
    const dx = x - cx;
    const dy = y - cy;
    const dz = z - cz;
    const a = dx * s[0] + dy * s[1] + dz * s[2];
    const b = dx * v[0] + dy * v[1] + dz * v[2];
    const h = dx * n[0] + dy * n[1] + dz * n[2];
    const rad = Math.sqrt(a * a + b * b);
    let ring = rs;
    if (rad > 1e-6) {
      const ca = a / rad / rs;
      const cb = b / rad / rv;
      ring = 1 / Math.sqrt(ca * ca + cb * cb);
    }
    const q = rad - ring;
    return Math.sqrt(q * q + h * h) - r;
  }, c, Math.max(rs, rv) + r);
}

/** Half-space: positive on the side `normal` points to. */
export function plane(point: Vec3, normal: Vec3): Sdf {
  const n = normalize(normal);
  const off = dot(point, n);
  return (x, y, z) => x * n[0] + y * n[1] + z * n[2] - off;
}

/** Smooth union of round cones along a polyline. */
export function chain(points: ReadonlyArray<Vec3>, radii: number | ReadonlyArray<number>, k = 0): Shape {
  const rs = typeof radii === "number" ? points.map(() => radii) : radii;
  const segs: Sdf[] = [];
  for (let i = 0; i + 1 < points.length; i += 1) {
    segs.push(roundCone(points[i], points[i + 1], rs[i], rs[i + 1]));
  }
  const rmax = Math.max(...rs);
  const lo: Vec3 = [
    Math.min(...points.map((p) => p[0])),
    Math.min(...points.map((p) => p[1])),
    Math.min(...points.map((p) => p[2])),
  ];
  const hi: Vec3 = [
    Math.max(...points.map((p) => p[0])),
    Math.max(...points.map((p) => p[1])),
    Math.max(...points.map((p) => p[2])),
  ];
  return withBound(
    bounded(smoothUnion(k, ...segs), lo, hi, rmax + k + 0.05),
    midpoint(lo, hi),
    distance(lo, hi) / 2 + rmax + k,
  );
}

/* ------------------------------------------------------------------ */
/* Combinators                                                         */
/* ------------------------------------------------------------------ */

export function smoothUnion(k: number, ...fs: Sdf[]): Sdf {
  if (fs.length === 1) return fs[0];
  return (x, y, z) => {
    let d = fs[0](x, y, z);
    for (let i = 1; i < fs.length; i += 1) d = smin(d, fs[i](x, y, z), k);
    return d;
  };
}

/** Mirror across the sagittal plane: model the +x side, get both. */
export function mirrorX(f: Sdf): Sdf {
  return (x, y, z) => f(x < 0 ? -x : x, y, z);
}

/** Smooth union of shapes that keeps a bounding sphere around all of them. */
export function group(k: number, ...shapes: Shape[]): Shape {
  const f = csg(
    shapes[0],
    shapes.slice(1).map((sh) => ["+", sh, k] as const),
  );
  const bounds = shapes.map((sh) => sh.bound);
  if (bounds.some((b) => b === undefined)) return f;
  const lo: Vec3 = [0, 1, 2].map((a) => Math.min(...bounds.map((b) => b![a] - b![3]))) as unknown as Vec3;
  const hi: Vec3 = [0, 1, 2].map((a) => Math.max(...bounds.map((b) => b![a] + b![3]))) as unknown as Vec3;
  return withBound(f, midpoint(lo, hi), distance(lo, hi) / 2 + k);
}

export type CsgOp = readonly [op: "+" | "-", shape: Shape, k: number];

/**
 * Apply smooth unions ("+") and subtractions ("-") to `base` in order,
 * skipping any shape whose bounding sphere proves it cannot change the
 * running distance. Most samples touch only two or three primitives.
 */
export function csg(base: Sdf, ops: ReadonlyArray<CsgOp>): Sdf {
  const n = ops.length;
  const add = ops.map((o) => o[0] === "+");
  const fs = ops.map((o) => o[1]);
  const ks = ops.map((o) => o[2]);
  const bs = new Float64Array(n * 4);
  const has = ops.map((o) => o[1].bound !== undefined);
  ops.forEach((o, i) => {
    const b = o[1].bound;
    if (b) bs.set(b, i * 4);
  });
  return (x, y, z) => {
    let d = base(x, y, z);
    for (let i = 0; i < n; i += 1) {
      const k = ks[i];
      if (has[i]) {
        const o = i * 4;
        const dx = x - bs[o];
        const dy = y - bs[o + 1];
        const dz = z - bs[o + 2];
        const lb = Math.sqrt(dx * dx + dy * dy + dz * dz) - bs[o + 3];
        if (add[i] ? lb >= d + k : lb >= k - d) continue;
      }
      d = add[i] ? smin(d, fs[i](x, y, z), k) : smax(d, -fs[i](x, y, z), k);
    }
    return d;
  };
}

/**
 * Skip `f` far from its bounding box. Outside the box grown by `pad` the
 * returned value is a lower bound of the true distance and never below
 * `pad`, so smooth unions with blend radius <= pad are unaffected.
 */
export function bounded(f: Sdf, lo: Vec3, hi: Vec3, pad: number): Shape {
  const x0 = lo[0] - pad;
  const y0 = lo[1] - pad;
  const z0 = lo[2] - pad;
  const x1 = hi[0] + pad;
  const y1 = hi[1] + pad;
  const z1 = hi[2] + pad;
  const shape: Sdf = (x, y, z) => {
    const dx = x < x0 ? x0 - x : x > x1 ? x - x1 : 0;
    const dy = y < y0 ? y0 - y : y > y1 ? y - y1 : 0;
    const dz = z < z0 ? z0 - z : z > z1 ? z - z1 : 0;
    if (dx === 0 && dy === 0 && dz === 0) return f(x, y, z);
    const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return d > pad ? d : pad;
  };
  return withBound(shape, midpoint(lo, hi), distance(lo, hi) / 2);
}

/* ------------------------------------------------------------------ */
/* Simplex noise                                                       */
/* ------------------------------------------------------------------ */

const GRAD3 = [
  1, 1, 0, -1, 1, 0, 1, -1, 0, -1, -1, 0, 1, 0, 1, -1, 0, 1, 1, 0, -1, -1, 0, -1, 0, 1, 1, 0, -1,
  1, 0, 1, -1, 0, -1, -1,
];
const F3 = 1 / 3;
const G3 = 1 / 6;

/** Seeded 3D simplex noise in roughly [-1, 1]. */
export function createNoise3(seed = 1): Sdf {
  const p = new Uint8Array(256);
  for (let i = 0; i < 256; i += 1) p[i] = i;
  let s = seed >>> 0 || 1;
  for (let i = 255; i > 0; i -= 1) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    const tmp = p[i];
    p[i] = p[j];
    p[j] = tmp;
  }
  const perm = new Uint8Array(512);
  const g = new Uint8Array(512);
  for (let i = 0; i < 512; i += 1) {
    perm[i] = p[i & 255];
    g[i] = (perm[i] % 12) * 3;
  }
  const corner = (t: number, gi: number, x: number, y: number, z: number) => {
    if (t <= 0) return 0;
    const t2 = t * t;
    return t2 * t2 * (GRAD3[gi] * x + GRAD3[gi + 1] * y + GRAD3[gi + 2] * z);
  };
  return (xin, yin, zin) => {
    const sk = (xin + yin + zin) * F3;
    const i = Math.floor(xin + sk);
    const j = Math.floor(yin + sk);
    const k = Math.floor(zin + sk);
    const t = (i + j + k) * G3;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    const z0 = zin - (k - t);
    let i1: number, j1: number, k1: number, i2: number, j2: number, k2: number;
    if (x0 >= y0) {
      if (y0 >= z0) [i1, j1, k1, i2, j2, k2] = [1, 0, 0, 1, 1, 0];
      else if (x0 >= z0) [i1, j1, k1, i2, j2, k2] = [1, 0, 0, 1, 0, 1];
      else [i1, j1, k1, i2, j2, k2] = [0, 0, 1, 1, 0, 1];
    } else if (y0 < z0) [i1, j1, k1, i2, j2, k2] = [0, 0, 1, 0, 1, 1];
    else if (x0 < z0) [i1, j1, k1, i2, j2, k2] = [0, 1, 0, 0, 1, 1];
    else [i1, j1, k1, i2, j2, k2] = [0, 1, 0, 1, 1, 0];
    const x1 = x0 - i1 + G3;
    const y1 = y0 - j1 + G3;
    const z1 = z0 - k1 + G3;
    const x2 = x0 - i2 + 2 * G3;
    const y2 = y0 - j2 + 2 * G3;
    const z2 = z0 - k2 + 2 * G3;
    const x3 = x0 - 1 + 3 * G3;
    const y3 = y0 - 1 + 3 * G3;
    const z3 = z0 - 1 + 3 * G3;
    const ii = i & 255;
    const jj = j & 255;
    const kk = k & 255;
    const n =
      corner(0.6 - x0 * x0 - y0 * y0 - z0 * z0, g[ii + perm[jj + perm[kk]]], x0, y0, z0) +
      corner(0.6 - x1 * x1 - y1 * y1 - z1 * z1, g[ii + i1 + perm[jj + j1 + perm[kk + k1]]], x1, y1, z1) +
      corner(0.6 - x2 * x2 - y2 * y2 - z2 * z2, g[ii + i2 + perm[jj + j2 + perm[kk + k2]]], x2, y2, z2) +
      corner(0.6 - x3 * x3 - y3 * y3 - z3 * z3, g[ii + 1 + perm[jj + 1 + perm[kk + 1]]], x3, y3, z3);
    return 32 * n;
  };
}

/* ------------------------------------------------------------------ */
/* Surface queries                                                     */
/* ------------------------------------------------------------------ */

/** Unit gradient of f at p (tetrahedral central differences). */
export function gradient(f: Sdf, x: number, y: number, z: number, e = 0.01): Vec3 {
  const a = f(x + e, y - e, z - e);
  const b = f(x - e, y - e, z + e);
  const c = f(x - e, y + e, z - e);
  const d = f(x + e, y + e, z + e);
  return normalize([a - b - c + d, -a - b + c + d, -a + b - c + d]);
}

/**
 * Pull p onto the zero set of f, then `inset` cm inward. Newton steps divide
 * by |grad f|, so blended or height-field regions whose field is not a true
 * distance (|grad f| != 1) still converge instead of overshooting.
 */
export function projectToSurface(f: Sdf, p: Vec3, inset = 0): Vec3 {
  let [x, y, z] = p;
  const e = 0.005;
  for (let i = 0; i < 32; i += 1) {
    const d = f(x, y, z);
    if (Math.abs(d) < 1e-4) break;
    const gx = (f(x + e, y, z) - f(x - e, y, z)) / (2 * e);
    const gy = (f(x, y + e, z) - f(x, y - e, z)) / (2 * e);
    const gz = (f(x, y, z + e) - f(x, y, z - e)) / (2 * e);
    const g2 = gx * gx + gy * gy + gz * gz || 1;
    // Cap each step so a flat spot cannot fling the point away.
    const s = clamp(d / g2, -0.5, 0.5);
    x -= gx * s;
    y -= gy * s;
    z -= gz * s;
  }
  const g = gradient(f, x, y, z);
  return [x - g[0] * inset, y - g[1] * inset, z - g[2] * inset];
}

/* ------------------------------------------------------------------ */
/* Surface Nets mesher                                                 */
/* ------------------------------------------------------------------ */

// Cube corner g sits at offset (g & 1, (g >> 1) & 1, (g >> 2) & 1).
const EDGES = [0, 1, 2, 3, 4, 5, 6, 7, 0, 2, 1, 3, 4, 6, 5, 7, 0, 4, 1, 5, 2, 6, 3, 7];

function grow<T extends Float32Array | Uint32Array>(arr: T, need: number): T {
  if (need <= arr.length) return arr;
  const next = new (arr.constructor as { new (n: number): T })(Math.max(need, arr.length * 2));
  next.set(arr);
  return next;
}

function sampleField(f: Sdf, spec: GridSpec, nx: number, ny: number, nz: number): Float32Array {
  const h = spec.cell;
  const [x0, y0, z0] = spec.min;
  const coarse = spec.coarse ?? f;
  const L = spec.lipschitz ?? 1.5;
  const slack = spec.slack ?? 0;
  const field = new Float32Array(nx * ny * nz);
  const B = 4;
  const sy = nx;
  const sz = nx * ny;
  for (let bk = 0; bk < nz; bk += B) {
    const k1 = Math.min(bk + B, nz);
    for (let bj = 0; bj < ny; bj += B) {
      const j1 = Math.min(bj + B, ny);
      for (let bi = 0; bi < nx; bi += B) {
        const i1 = Math.min(bi + B, nx);
        const cx = x0 + ((bi + i1 - 1) / 2) * h;
        const cy = y0 + ((bj + j1 - 1) / 2) * h;
        const cz = z0 + ((bk + k1 - 1) / 2) * h;
        const halfDiag = (Math.sqrt((i1 - bi) ** 2 + (j1 - bj) ** 2 + (k1 - bk) ** 2) * h) / 2;
        const dc = coarse(cx, cy, cz);
        const far = Math.abs(dc) > halfDiag * L + slack + h;
        for (let k = bk; k < k1; k += 1) {
          const z = z0 + k * h;
          for (let j = bj; j < j1; j += 1) {
            const y = y0 + j * h;
            let idx = bi + j * sy + k * sz;
            for (let i = bi; i < i1; i += 1, idx += 1) {
              field[idx] = far ? dc : f(x0 + i * h, y, z);
            }
          }
        }
      }
    }
  }
  // Close anything the box clips so every mesh is watertight.
  for (let k = 0; k < nz; k += 1) {
    for (let j = 0; j < ny; j += 1) {
      for (let i = 0; i < nx; i += 1) {
        if (i === 0 || j === 0 || k === 0 || i === nx - 1 || j === ny - 1 || k === nz - 1) {
          const idx = i + j * sy + k * sz;
          if (field[idx] < h * 0.5) field[idx] = h * 0.5;
        }
      }
    }
  }
  return field;
}

/**
 * Mesh the zero set of `f` inside `spec` with Surface Nets. Vertices are
 * projected onto the surface and normals come from the field gradient, so
 * the result shades smoothly without extra passes. Triangles wind CCW when
 * seen from outside (f > 0).
 */
export function meshSdf(f: Sdf, spec: GridSpec): MeshData {
  const h = spec.cell;
  const [x0, y0, z0] = spec.min;
  const nx = Math.max(2, Math.ceil((spec.max[0] - x0) / h) + 1);
  const ny = Math.max(2, Math.ceil((spec.max[1] - y0) / h) + 1);
  const nz = Math.max(2, Math.ceil((spec.max[2] - z0) / h) + 1);
  const field = sampleField(f, spec, nx, ny, nz);

  const sy = nx;
  const sz = nx * ny;
  const cx = nx - 1;
  const cy = ny - 1;
  const cz = nz - 1;
  const cellIndex = new Int32Array(cx * cy * cz);
  const sxy = cx * cy;
  let pos = new Float32Array(1 << 15);
  let nPos = 0;
  let idx = new Uint32Array(1 << 16);
  let nIdx = 0;
  const v = new Float64Array(8);

  const quad = (a: number, b: number, c: number, d: number, inside: boolean) => {
    idx = grow(idx, nIdx + 6);
    if (inside) {
      idx[nIdx] = a; idx[nIdx + 1] = b; idx[nIdx + 2] = c;
      idx[nIdx + 3] = a; idx[nIdx + 4] = c; idx[nIdx + 5] = d;
    } else {
      idx[nIdx] = a; idx[nIdx + 1] = d; idx[nIdx + 2] = c;
      idx[nIdx + 3] = a; idx[nIdx + 4] = c; idx[nIdx + 5] = b;
    }
    nIdx += 6;
  };

  for (let k = 0; k < cz; k += 1) {
    for (let j = 0; j < cy; j += 1) {
      let base = j * sy + k * sz;
      let m = j * cx + k * sxy;
      for (let i = 0; i < cx; i += 1, base += 1, m += 1) {
        const v0 = field[base];
        const v1 = field[base + 1];
        const v2 = field[base + sy];
        const v3 = field[base + sy + 1];
        const v4 = field[base + sz];
        const v5 = field[base + sz + 1];
        const v6 = field[base + sy + sz];
        const v7 = field[base + sy + sz + 1];
        const mask =
          (v0 < 0 ? 1 : 0) | (v1 < 0 ? 2 : 0) | (v2 < 0 ? 4 : 0) | (v3 < 0 ? 8 : 0) |
          (v4 < 0 ? 16 : 0) | (v5 < 0 ? 32 : 0) | (v6 < 0 ? 64 : 0) | (v7 < 0 ? 128 : 0);
        if (mask === 0 || mask === 255) {
          cellIndex[m] = -1;
          continue;
        }
        v[0] = v0; v[1] = v1; v[2] = v2; v[3] = v3;
        v[4] = v4; v[5] = v5; v[6] = v6; v[7] = v7;
        let ax = 0;
        let ay = 0;
        let az = 0;
        let count = 0;
        for (let e = 0; e < 24; e += 2) {
          const ga = EDGES[e];
          const gb = EDGES[e + 1];
          const va = v[ga];
          const vb = v[gb];
          if (va < 0 === vb < 0) continue;
          const t = va / (va - vb);
          ax += (ga & 1) + t * ((gb & 1) - (ga & 1));
          ay += ((ga >> 1) & 1) + t * (((gb >> 1) & 1) - ((ga >> 1) & 1));
          az += ((ga >> 2) & 1) + t * (((gb >> 2) & 1) - ((ga >> 2) & 1));
          count += 1;
        }
        const vi = nPos / 3;
        cellIndex[m] = vi;
        pos = grow(pos, nPos + 3);
        pos[nPos] = x0 + (i + ax / count) * h;
        pos[nPos + 1] = y0 + (j + ay / count) * h;
        pos[nPos + 2] = z0 + (k + az / count) * h;
        nPos += 3;

        // Quads across the three edges leaving corner 0; the four cells
        // sharing an edge along axis a sit at -0/-1 steps on the other two.
        const inside = v0 < 0;
        if (inside !== v1 < 0 && j > 0 && k > 0) {
          quad(vi, cellIndex[m - cx], cellIndex[m - cx - sxy], cellIndex[m - sxy], inside);
        }
        if (inside !== v2 < 0 && k > 0 && i > 0) {
          quad(vi, cellIndex[m - sxy], cellIndex[m - sxy - 1], cellIndex[m - 1], inside);
        }
        if (inside !== v4 < 0 && i > 0 && j > 0) {
          quad(vi, cellIndex[m - 1], cellIndex[m - 1 - cx], cellIndex[m - cx], inside);
        }
      }
    }
  }

  const positions = pos.slice(0, nPos);
  const normals = new Float32Array(positions.length);
  const e = h * 0.35;
  for (let p = 0; p < positions.length; p += 3) {
    const x = positions[p];
    const y = positions[p + 1];
    const z = positions[p + 2];
    const fa = f(x + e, y - e, z - e);
    const fb = f(x - e, y - e, z + e);
    const fc = f(x - e, y + e, z - e);
    const fd = f(x + e, y + e, z + e);
    let gx = fa - fb - fc + fd;
    let gy = -fa - fb + fc + fd;
    let gz = -fa + fb - fc + fd;
    const len = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;
    gx /= len;
    gy /= len;
    gz /= len;
    const dist = clamp((fa + fb + fc + fd) / 4, -h, h);
    positions[p] = x - gx * dist;
    positions[p + 1] = y - gy * dist;
    positions[p + 2] = z - gz * dist;
    normals[p] = gx;
    normals[p + 1] = gy;
    normals[p + 2] = gz;
  }
  return { positions, normals, indices: idx.slice(0, nIdx) };
}
