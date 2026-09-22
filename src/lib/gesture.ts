/**
 * Global pointer tracker to disambiguate click from drag/orbit gestures across the 3D canvas.
 */
let pointerDownState: { x: number; y: number; time: number } | null = null;

export function recordPointerDown(e: { clientX: number; clientY: number }): void {
  pointerDownState = { x: e.clientX, y: e.clientY, time: Date.now() };
}

export function isDragOrbit(e: { clientX: number; clientY: number }): boolean {
  if (!pointerDownState) return false;
  const dist = Math.hypot(e.clientX - pointerDownState.x, e.clientY - pointerDownState.y);
  const dt = Date.now() - pointerDownState.time;
  return dist > 6 || dt > 350;
}
