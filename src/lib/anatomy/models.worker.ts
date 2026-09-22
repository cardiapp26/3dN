/**
 * Builds organ meshes off the main thread. Each message names one organ;
 * the reply transfers its vertex buffers back without copying.
 */
import { ANATOMY_MODELS, buildModelMesh } from "./soft-models.ts";

export type MeshRequest = { id: string };
export type MeshReply =
  | { id: string; ok: true; positions: Float32Array; normals: Float32Array; indices: Uint32Array }
  | { id: string; ok: false; error: string };

type WorkerScope = {
  onmessage: ((event: MessageEvent<MeshRequest>) => void) | null;
  postMessage: (message: MeshReply, transfer?: Transferable[]) => void;
};

const scope = self as unknown as WorkerScope;

scope.onmessage = (event) => {
  const { id } = event.data;
  const model = ANATOMY_MODELS.find((m) => m.id === id);
  if (!model) {
    scope.postMessage({ id, ok: false, error: `unknown organ "${id}"` });
    return;
  }
  try {
    const mesh = buildModelMesh(model);
    scope.postMessage({ id, ok: true, ...mesh }, [
      mesh.positions.buffer,
      mesh.normals.buffer,
      mesh.indices.buffer,
    ]);
  } catch (err) {
    scope.postMessage({ id, ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
