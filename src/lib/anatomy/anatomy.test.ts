import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ANCHOR_SURFACES, NERVE_PATHS } from "../anatomy-paths.ts";
import { ANATOMY_MODELS, SOFT_MODELS, buildModelMesh } from "./soft-models.ts";
import {
  bounded,
  capsule,
  createNoise3,
  csg,
  meshSdf,
  profile,
  projectToSurface,
  smax,
  smin,
  sphere,
  type MeshData,
  type Sdf,
} from "./sdf.ts";

/** Every undirected edge of a closed surface is shared an even number of times. */
function openEdges(mesh: MeshData): number {
  const uses = new Map<string, number>();
  const { indices } = mesh;
  for (let t = 0; t < indices.length; t += 3) {
    for (let e = 0; e < 3; e += 1) {
      const a = indices[t + e];
      const b = indices[t + ((e + 1) % 3)];
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      uses.set(key, (uses.get(key) ?? 0) + 1);
    }
  }
  let open = 0;
  for (const n of uses.values()) if (n % 2 !== 0) open += 1;
  return open;
}

/** Share of triangles whose winding agrees with the stored (outward) normals. */
function outwardShare(mesh: MeshData): number {
  const { positions: p, normals: n, indices: idx } = mesh;
  let agree = 0;
  for (let t = 0; t < idx.length; t += 3) {
    const a = idx[t] * 3;
    const b = idx[t + 1] * 3;
    const c = idx[t + 2] * 3;
    const ux = p[b] - p[a];
    const uy = p[b + 1] - p[a + 1];
    const uz = p[b + 2] - p[a + 2];
    const vx = p[c] - p[a];
    const vy = p[c + 1] - p[a + 1];
    const vz = p[c + 2] - p[a + 2];
    const gx = uy * vz - uz * vy;
    const gy = uz * vx - ux * vz;
    const gz = ux * vy - uy * vx;
    const nx = n[a] + n[b] + n[c];
    const ny = n[a + 1] + n[b + 1] + n[c + 1];
    const nz = n[a + 2] + n[b + 2] + n[c + 2];
    if (gx * nx + gy * ny + gz * nz > 0) agree += 1;
  }
  return agree / (idx.length / 3);
}

function maxSurfaceError(f: Sdf, mesh: MeshData): number {
  let worst = 0;
  const p = mesh.positions;
  for (let i = 0; i < p.length; i += 3) worst = Math.max(worst, Math.abs(f(p[i], p[i + 1], p[i + 2])));
  return worst;
}

describe("smooth booleans", () => {
  it("equal plain min/max outside the blend band", () => {
    assert.equal(smin(1, 3, 0.5), 1);
    assert.equal(smax(1, 3, 0.5), 3);
  });

  it("round the crease inside the band", () => {
    assert.ok(smin(1, 1.1, 0.5) < 1);
    assert.ok(smax(1, 1.1, 0.5) > 1.1);
    assert.equal(smax(0.2, 0.3, 0.4), -smin(-0.2, -0.3, 0.4));
  });
});

describe("profile", () => {
  const f = profile([
    [2, 5],
    [0, 1],
    [1, 3],
  ]);

  it("passes through its knots in any order", () => {
    assert.equal(f(0), 1);
    assert.equal(f(1), 3);
    assert.equal(f(2), 5);
  });

  it("clamps outside the knot range", () => {
    assert.equal(f(-4), 1);
    assert.equal(f(9), 5);
  });
});

describe("createNoise3", () => {
  it("is deterministic per seed and bounded", () => {
    const a = createNoise3(7);
    const b = createNoise3(7);
    const c = createNoise3(8);
    let differs = false;
    for (let i = 0; i < 200; i += 1) {
      const x = i * 0.37;
      const y = i * 0.11;
      const z = i * 0.71;
      assert.equal(a(x, y, z), b(x, y, z));
      assert.ok(Math.abs(a(x, y, z)) <= 1.05);
      if (a(x, y, z) !== c(x, y, z)) differs = true;
    }
    assert.ok(differs, "different seeds should give different fields");
  });
});

describe("meshSdf", () => {
  const unit = sphere([0, 0, 0], 1);
  const spec = { min: [-1.3, -1.3, -1.3], max: [1.3, 1.3, 1.3], cell: 0.06 } as const;
  const mesh = meshSdf(unit, spec);

  it("places vertices on the zero set", () => {
    assert.ok(maxSurfaceError(unit, mesh) < 1e-3);
  });

  it("produces a closed surface wound outward", () => {
    assert.equal(openEdges(mesh), 0);
    assert.equal(outwardShare(mesh), 1);
  });

  it("closes shapes that the grid clips", () => {
    const clipped = meshSdf(unit, { ...spec, min: [-1.3, -1.3, -0.4] });
    assert.equal(openEdges(clipped), 0);
  });

  it("narrow-band sampling matches dense sampling", () => {
    const dense = meshSdf(unit, { ...spec, lipschitz: 1e9 });
    assert.equal(mesh.positions.length, dense.positions.length);
    assert.equal(mesh.indices.length, dense.indices.length);
  });
});

describe("csg", () => {
  const base = sphere([0, 0, 0], 1);
  const parts = [
    sphere([1.2, 0, 0], 0.6),
    capsule([0, -2, 0], [0, 2, 0], 0.3),
    sphere([5, 5, 5], 0.5),
  ];
  const culled = csg(base, [
    ["+", parts[0], 0.3],
    ["-", parts[1], 0.1],
    ["+", parts[2], 0.3],
  ]);
  const plain: Sdf = (x, y, z) => {
    let d = smin(base(x, y, z), parts[0](x, y, z), 0.3);
    d = smax(d, -parts[1](x, y, z), 0.1);
    return smin(d, parts[2](x, y, z), 0.3);
  };

  it("skips distant shapes without changing the field", () => {
    for (let i = 0; i < 500; i += 1) {
      const x = Math.sin(i * 1.3) * 3;
      const y = Math.cos(i * 0.7) * 3;
      const z = Math.sin(i * 2.1) * 3;
      assert.ok(Math.abs(culled(x, y, z) - plain(x, y, z)) < 1e-12);
    }
  });

  it("bounded() never overestimates the distance outside its box", () => {
    const boxed = bounded(base, [-1, -1, -1], [1, 1, 1], 0.2);
    const probes: Array<[number, number, number]> = [
      [3, 0, 0],
      [2, 2, 2],
      [0, -4, 1],
    ];
    for (const [x, y, z] of probes) {
      assert.ok(boxed(x, y, z) <= base(x, y, z) + 1e-12);
    }
  });
});

describe("projectToSurface", () => {
  it("lands on the surface, then steps inward by the inset", () => {
    const f = sphere([0, 0, 0], 2);
    const p = projectToSurface(f, [3, 1, -1], 0.1);
    assert.ok(Math.abs(Math.hypot(...p) - 1.9) < 1e-3);
  });
});

describe("anatomy registry", () => {
  it("has unique ids", () => {
    const ids = ANATOMY_MODELS.map((m) => m.id);
    assert.equal(new Set(ids).size, ids.length);
  });

  it("has well-formed grids of bounded size", () => {
    for (const m of ANATOMY_MODELS) {
      const { min, max, cell } = m.grid;
      assert.ok(cell > 0, m.id);
      let samples = 1;
      for (let a = 0; a < 3; a += 1) {
        assert.ok(max[a] > min[a], `${m.id} axis ${a}`);
        samples *= Math.ceil((max[a] - min[a]) / cell) + 1;
      }
      assert.ok(samples < 8e6, `${m.id} grid has ${samples} samples`);
    }
  });

  it("models mirrored twins on the +x side only", () => {
    for (const m of SOFT_MODELS.filter((s) => s.mirror)) {
      assert.ok(m.grid.min[0] >= 0, m.id);
    }
  });

  it("meshes small organs as closed, outward surfaces", () => {
    for (const id of ["lacrimal", "eom-trochlear", "labyrinth", "olfactory-mucosa"]) {
      const model = ANATOMY_MODELS.find((m) => m.id === id);
      assert.ok(model, id);
      const mesh = buildModelMesh(model);
      assert.ok(mesh.indices.length / 3 > 1000, `${id} is too coarse`);
      assert.equal(openEdges(mesh), 0, id);
      assert.ok(outwardShare(mesh) > 0.99, id);
    }
  });
});

describe("nerve courses", () => {
  it("anchor just inside their brain surface, never floating free", () => {
    // Field values are not true distances where shapes blend, so measure the
    // geometric depth: how far the end must move to reach the surface.
    for (const path of NERVE_PATHS) {
      for (const course of [path.main, ...path.branches]) {
        if (!course.anchor) continue;
        const surface = ANCHOR_SURFACES[course.anchorTo ?? "brainstem"];
        const p = course.anchor === "start" ? course.points[0] : course.points[course.points.length - 1];
        const onSurface = projectToSurface(surface, p);
        const depth = Math.hypot(p[0] - onSurface[0], p[1] - onSurface[1], p[2] - onSurface[2]);
        assert.ok(surface(...p) < 0, `CN ${path.id} end is outside its surface`);
        assert.ok(depth < 0.1, `CN ${path.id} end is ${depth.toFixed(3)} cm deep`);
      }
    }
  });

  it("have at least two points per course", () => {
    for (const path of NERVE_PATHS) {
      for (const course of [path.main, ...path.branches]) {
        assert.ok(course.points.length >= 2, `CN ${path.id}`);
      }
    }
  });
});
