"use client";

// OwnState — procedural Earth (Brick 14)
// Ocean sphere + green land rendered as Points from a layered-sine continent
// mask, so it runs with zero texture files. Slow auto-rotate unless reduced.

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";

import { fibonacciSphere, isLand } from "./geo";

export function Earth({
  scrollProgress,
  isScrolling,
  isMobile,
}: {
  scrollProgress: MotionValue<number>;
  isScrolling: boolean;
  isMobile: boolean;
}) {
  const group = useRef<THREE.Group>(null);

  const landGeometry = useMemo(() => {
    const count = isMobile ? 7000 : 14000;
    const base = fibonacciSphere(count, 2.012);
    const pts: number[] = [];
    for (let i = 0; i < base.length; i += 3) {
      const x = base[i];
      const y = base[i + 1];
      const z = base[i + 2];
      if (isLand(x, y, z)) pts.push(x, y, z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [isMobile]);

  useFrame((state, delta) => {
    if (!group.current) return;
    // Rotate faster when scrolling, slow down to a drift when static
    const rotationSpeed = isScrolling ? delta * 0.5 : delta * 0.045;
    group.current.rotation.y += rotationSpeed;
  });

  const segments = isMobile ? 48 : 64;

  return (
    <group ref={group} rotation={[0.3, 0, 0.1]}>
      <mesh>
        <sphereGeometry args={[2, segments, segments]} />
        <meshStandardMaterial
          color="#0a2540"
          roughness={0.85}
          metalness={0.15}
          emissive="#04101e"
          emissiveIntensity={0.4}
        />
      </mesh>
      <points geometry={landGeometry}>
        <pointsMaterial
          color="#1D9E75"
          size={isMobile ? 0.022 : 0.018}
          sizeAttenuation
          transparent
          opacity={0.95}
          depthWrite={false}
        />
      </points>
    </group>
  );
}
