// OwnState — Earth hero geometry helpers (Brick 14)
// Pure THREE math: spherical point distribution, lat/lng → vector, and a local
// tangent basis used to lay markers flat on the globe surface.

import * as THREE from "three";

/** Evenly distribute `n` points on a sphere of radius `r` (Fibonacci spiral). */
export function fibonacciSphere(n: number, r: number): Float32Array {
  const out = new Float32Array(n * 3);
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - (i / (n - 1)) * 2; // 1 → -1
    const radius = Math.sqrt(1 - y * y);
    const theta = golden * i;
    out[i * 3] = Math.cos(theta) * radius * r;
    out[i * 3 + 1] = y * r;
    out[i * 3 + 2] = Math.sin(theta) * radius * r;
  }
  return out;
}

/**
 * Cheap layered-sine "continent" mask. Returns true where a surface point should
 * read as land. Deterministic, no texture files needed.
 */
export function isLand(x: number, y: number, z: number): boolean {
  const n =
    Math.sin(x * 1.5) * Math.cos(z * 1.6) +
    Math.sin(y * 2.1 + x) * 0.6 +
    Math.cos(z * 0.9 - y * 1.3) * 0.5;
  return n > 0.35;
}

/** Same field, higher cutoff — sparse patches used for drifting clouds. */
export function isCloud(x: number, y: number, z: number): boolean {
  const n =
    Math.sin(x * 0.9 + 1.3) * Math.cos(z * 1.1) +
    Math.cos(y * 1.7 - z) * 0.7;
  return n > 0.55;
}

/** A unit-length normal and two tangents spanning the surface plane at `p`. */
export function tangentBasis(p: THREE.Vector3): {
  normal: THREE.Vector3;
  t: THREE.Vector3;
  b: THREE.Vector3;
} {
  const normal = p.clone().normalize();
  const ref =
    Math.abs(normal.y) > 0.9
      ? new THREE.Vector3(1, 0, 0)
      : new THREE.Vector3(0, 1, 0);
  const t = new THREE.Vector3().crossVectors(ref, normal).normalize();
  const b = new THREE.Vector3().crossVectors(normal, t).normalize();
  return { normal, t, b };
}

/** Quaternion that stands a +Y-up object upright on the globe at normal `n`. */
export function uprightOn(n: THREE.Vector3): THREE.Quaternion {
  return new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    n.clone().normalize()
  );
}
