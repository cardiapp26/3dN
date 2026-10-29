import { MeshPhysicalMaterial, Vector3 } from "three";
import type { Vec3 } from "@/lib/anatomy-paths";
import { EOM_APEX } from "@/lib/eye-motion";

type Apex = Readonly<Vec3>;

/**
 * Muscle contraction apexes for all cranial muscles:
 * EOMs, masticatory, facial mimetic, cervical (SCM/trapezius), and lingual.
 */
export const ALL_MUSCLE_APEXES: Record<string, Apex> = {
  ...EOM_APEX,
  masseter: [5.5, -2.0, 3.5],
  temporalis: [5.0, 3.5, 0],
  frontalis: [2.0, 8.5, 5.0],
  "orbicularis-oculi": [1.8, 1.2, 7.5],
  "orbicularis-oris": [0, -6.5, 9.0],
  zygomaticus: [4.5, -2.5, 6.5],
  buccinator: [3.2, -6.0, 4.5],
  scm: [4.8, -4.5, -0.5],
  trapezius: [3.0, -3.0, -5.0],
  tongue: [0, -8.5, 3.5],
};

/**
 * Shorten a muscle mesh toward its anatomical origin / apex.
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
