import { MeshPhysicalMaterial, Vector3 } from "three";
import type { Vec3 } from "@/lib/anatomy-paths";

type Apex = Readonly<Vec3>;

/**
 * Shorten a static extraocular mesh toward its orbital apex.
 * The geometry is the +x model; the mirrored twin shares it under scale -1,
 * so the apex stays in that local frame and both sides contract.
 */
export function installRadialTwitch(
  material: MeshPhysicalMaterial,
  cacheId: string,
  apex: Apex,
): { value: number } {
  const twitch = { value: 0 };
  const apexVec = new Vector3(apex[0], apex[1], apex[2]);
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTwitch = twitch;
    shader.uniforms.uApex = { value: apexVec };
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
uniform float uTwitch;
uniform vec3 uApex;
`,
      )
      .replace(
        "#include <begin_vertex>",
        `vec3 transformed = vec3(position);
vec3 fromApex = transformed - uApex;
float gain = uTwitch * 0.16;
transformed -= fromApex * gain;
transformed += objectNormal * (gain * 1.1);
`,
      );
  };
  material.customProgramCacheKey = () => `radial-twitch:${cacheId}`;
  return twitch;
}
