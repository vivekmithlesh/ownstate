"use client";

// OwnState — drifting energy field (Brick 14)
// ~1500 teal/white points in a shell around the planet, with a gentle
// sinusoidal bob and slow rotation — the "higgs field" backdrop.

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function ParticleField({ count }: { count: number }) {
  const group = useRef<THREE.Group>(null);
  const points = useRef<THREE.Points>(null);

  const { geometry, base, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const baseArr = new Float32Array(count * 3);
    const phaseArr = new Float32Array(count);
    const colors = new Float32Array(count * 3);
    const teal = new THREE.Color("#1D9E75");
    const white = new THREE.Color("#dffaf0");

    for (let i = 0; i < count; i++) {
      // Spherical shell, radius 2.6 → 6.5.
      const r = 2.6 + Math.random() * 3.9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.sin(phi) * Math.sin(theta);
      const z = r * Math.cos(phi);
      positions.set([x, y, z], i * 3);
      baseArr.set([x, y, z], i * 3);
      phaseArr[i] = Math.random() * Math.PI * 2;

      const c = teal.clone().lerp(white, Math.random());
      colors.set([c.r, c.g, c.b], i * 3);
    }

    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    return { geometry: g, base: baseArr, phases: phaseArr };
  }, [count]);

  useFrame((state, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.02;
    const pts = points.current;
    if (!pts) return;
    const t = state.clock.elapsedTime;
    const attr = pts.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < count; i++) {
      const bob = Math.sin(t * 0.6 + phases[i]) * 0.12;
      attr.setY(i, base[i * 3 + 1] + bob);
    }
    attr.needsUpdate = true;
  });

  return (
    <group ref={group}>
      <points ref={points} geometry={geometry}>
        <pointsMaterial
          size={0.03}
          sizeAttenuation
          vertexColors
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  );
}
