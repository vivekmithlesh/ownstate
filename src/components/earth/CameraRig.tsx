"use client";

// OwnState — scroll-driven camera (Brick 14)
// Lerps the camera from z6 (full planet) to z3.1 (surface) and adds a slight
// downward tilt as the hero progresses. Eased toward the target each frame.

import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";

export function CameraRig({ progress }: { progress: MotionValue<number> }) {
  const { camera } = useThree();

  useFrame(() => {
    const p = progress.get();
    const targetZ = THREE.MathUtils.lerp(6, 3.1, p);
    const targetTilt = -0.12 * p;
    camera.position.z += (targetZ - camera.position.z) * 0.08;
    camera.rotation.x += (targetTilt - camera.rotation.x) * 0.08;
  });

  return null;
}
