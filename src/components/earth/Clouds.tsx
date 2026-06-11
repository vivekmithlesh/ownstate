"use client";

// OwnState — drifting cloud patches (Brick 14)
// White Points at r2.05 from a sparse noise mask. Opacity fades 0.6 → 0 as the
// hero zooms in, so the clouds "part" to reveal the surface.

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";

import { fibonacciSphere, isCloud } from "./geo";

export function Clouds({
  progress,
  isMobile,
}: {
  progress: MotionValue<number>;
  isMobile: boolean;
}) {
  const points = useRef<THREE.Points>(null);
  const material = useRef<THREE.PointsMaterial>(null);

  const geometry = useMemo(() => {
    const base = fibonacciSphere(isMobile ? 4000 : 8000, 2.06);
    const pts: number[] = [];
    for (let i = 0; i < base.length; i += 3) {
      const x = base[i];
      const y = base[i + 1];
      const z = base[i + 2];
      if (isCloud(x, y, z)) pts.push(x, y, z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [isMobile]);

  useFrame((_, delta) => {
    if (points.current) points.current.rotation.y += delta * 0.06;
    if (material.current) {
      material.current.opacity = 0.6 * (1 - progress.get());
    }
  });

  return (
    <points ref={points} geometry={geometry}>
      <pointsMaterial
        ref={material}
        color="#eafff7"
        size={isMobile ? 0.05 : 0.04}
        sizeAttenuation
        transparent
        opacity={0.6}
        depthWrite={false}
      />
    </points>
  );
}
