import { Plane, Raycaster, Vector2, Vector3, type Camera } from "three";

// Populated by <ViewportRegistrar/> (mounted inside <Canvas>) so DOM-level
// drag-and-drop handlers — which fire outside the R3F event system — can
// still convert a drop's screen coordinates into a world position.
interface ViewportHandle {
  camera: Camera;
  domElement: HTMLElement;
}

let activeViewport: ViewportHandle | null = null;

export function registerViewport(handle: ViewportHandle) {
  activeViewport = handle;
}

export function unregisterViewport(handle: ViewportHandle) {
  if (activeViewport === handle) activeViewport = null;
}

const groundPlane = new Plane(new Vector3(0, 1, 0), 0);
const raycaster = new Raycaster();
const ndc = new Vector2();
const hitPoint = new Vector3();

/**
 * Projects a client-space point (e.g. a drop event's clientX/clientY) onto
 * the y=0 ground plane, returning the resulting world position, or null if
 * no viewport is registered yet or the ray is parallel to the ground.
 */
export function screenToGroundPoint(clientX: number, clientY: number): Vector3 | null {
  if (!activeViewport) return null;

  const rect = activeViewport.domElement.getBoundingClientRect();
  ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
  ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(ndc, activeViewport.camera);
  const hit = raycaster.ray.intersectPlane(groundPlane, hitPoint);
  return hit ? hit.clone() : null;
}
