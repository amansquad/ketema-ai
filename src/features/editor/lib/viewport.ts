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

/**
 * Ground point roughly a third of the way up from the bottom of the current
 * view — i.e. "in front of the camera, in the near/middle ground" rather
 * than dead-center (which, at this editor's default overhead-ish angle,
 * projects to a point far off toward the horizon). Used as the drop point
 * for click-to-place, so newly placed assets land somewhere already visible
 * and close to the camera instead of requiring the user to pan/zoom to find
 * them.
 */
export function cameraGroundPoint(): Vector3 | null {
  if (!activeViewport) return null;

  ndc.x = 0;
  ndc.y = -0.35;

  raycaster.setFromCamera(ndc, activeViewport.camera);
  const hit = raycaster.ray.intersectPlane(groundPlane, hitPoint);
  return hit ? hit.clone() : null;
}
