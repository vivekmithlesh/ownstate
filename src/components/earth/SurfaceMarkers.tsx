"use client";

// OwnState — surface storytelling markers (Brick 14)
// Three beats laid on the globe, revealed by scroll progress:
//   0.6–0.8  a fencing hexagon ring draws edge-by-edge  → "2.4 acres"
//   0.8–0.9  a cluster of buildings rises               → "For Sale" / "For Rent"
//   0.9–1.0  an island + pulsing ring appears           → "Island for sale"

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import { motion, useTransform, type MotionValue } from "framer-motion";
import * as THREE from "three";

import { tangentBasis, uprightOn } from "./geo";

const FENCE = new THREE.Vector3(-0.5, 0.6, 1).normalize().multiplyScalar(2);
const TOWN = new THREE.Vector3(0.7, -0.05, 1).normalize().multiplyScalar(2);
const ISLE = new THREE.Vector3(-0.05, -0.7, 0.9).normalize().multiplyScalar(2);

const RING_STEPS = 48; // subdivided hexagon for edge-by-edge draw

export function SurfaceMarkers({
  progress,
  isMobile,
}: {
  progress: MotionValue<number>;
  isMobile: boolean;
}) {
  // ---- fencing ring (subdivided hexagon, hugging the surface) ---------------
  // Built imperatively: the JSX <line> intrinsic collides with SVG's <line>, so
  // we render a real THREE.Line via <primitive> and animate its drawRange.
  const ringLine = useMemo(() => {
    const { t, b } = tangentBasis(FENCE);
    const r = 0.34;
    const verts: number[] = [];
    for (let s = 0; s <= RING_STEPS; s++) {
      const a = (s / RING_STEPS) * Math.PI * 2;
      // snap to 6 corners by quantising the angle for a hexagon feel
      const corner = Math.round((a / (Math.PI * 2)) * 6) / 6;
      const ang = corner * Math.PI * 2;
      const p = FENCE.clone()
        .add(t.clone().multiplyScalar(Math.cos(ang) * r))
        .add(b.clone().multiplyScalar(Math.sin(ang) * r));
      p.normalize().multiplyScalar(2.03);
      verts.push(p.x, p.y, p.z);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    g.setDrawRange(0, 0);
    const m = new THREE.LineBasicMaterial({ color: "#1D9E75", transparent: true });
    return new THREE.Line(g, m);
  }, []);

  // ---- buildings ------------------------------------------------------------
  const buildings = useMemo(() => {
    const { normal, t, b } = tangentBasis(TOWN);
    const q = uprightOn(normal);
    const n = isMobile ? 14 : 20;
    const items: { pos: THREE.Vector3; h: number; sale: boolean }[] = [];
    for (let i = 0; i < n; i++) {
      const u = (Math.random() - 0.5) * 0.5;
      const v = (Math.random() - 0.5) * 0.5;
      const local = t
        .clone()
        .multiplyScalar(u)
        .add(b.clone().multiplyScalar(v));
      const pos = TOWN.clone().add(local).normalize().multiplyScalar(2.0);
      items.push({ pos, h: 0.06 + Math.random() * 0.16, sale: Math.random() > 0.5 });
    }
    return { items, q };
  }, [isMobile]);

  const townRef = useRef<THREE.Group>(null);

  // ---- island ---------------------------------------------------------------
  const islandRef = useRef<THREE.Group>(null);
  const islandRing = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const p = progress.get();

    // Fence ring draws across 0.6 → 0.8.
    const ringK = THREE.MathUtils.clamp((p - 0.6) / 0.2, 0, 1);
    ringLine.geometry.setDrawRange(0, Math.ceil(ringK * (RING_STEPS + 1)));

    // Buildings rise across 0.8 → 0.9.
    const townK = THREE.MathUtils.clamp((p - 0.8) / 0.1, 0, 1);
    if (townRef.current) {
      townRef.current.scale.y = Math.max(townK, 0.0001);
      townRef.current.visible = townK > 0.001;
    }

    // Island fades/scales in across 0.9 → 1.0 with a pulsing ring.
    const isleK = THREE.MathUtils.clamp((p - 0.9) / 0.1, 0, 1);
    if (islandRef.current) {
      islandRef.current.scale.setScalar(Math.max(isleK, 0.0001));
      islandRef.current.visible = isleK > 0.001;
    }
    if (islandRing.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.12;
      islandRing.current.scale.setScalar(pulse);
    }
  });

  const fenceLabel = useTransform(progress, [0.62, 0.68], [0, 1]);
  const townLabel = useTransform(progress, [0.82, 0.88], [0, 1]);
  const isleLabel = useTransform(progress, [0.92, 0.98], [0, 1]);

  const { normal: isleNormal } = tangentBasis(ISLE);

  return (
    <group>
      {/* Fencing ring */}
      <primitive object={ringLine} />
      <Html position={FENCE.clone().multiplyScalar(1.08).toArray()} center distanceFactor={9}>
        <motion.div style={{ opacity: fenceLabel }} className="earth-pill">
          2.4 acres · fenced
        </motion.div>
      </Html>

      {/* Buildings */}
      <group ref={townRef} quaternion={buildings.q} position={TOWN.toArray()}>
        {buildings.items.map((b, i) => {
          const local = b.pos.clone().sub(TOWN).applyQuaternion(buildings.q.clone().invert());
          return (
            <mesh key={i} position={[local.x, b.h / 2, local.z]} scale={[1, b.h, 1]}>
              <boxGeometry args={[0.04, 1, 0.04]} />
              <meshStandardMaterial
                color={b.sale ? "#1D9E75" : "#5DCAA5"}
                emissive={b.sale ? "#0F6E56" : "#2f8f73"}
                emissiveIntensity={0.4}
              />
            </mesh>
          );
        })}
      </group>
      <Html position={TOWN.clone().multiplyScalar(1.12).toArray()} center distanceFactor={9}>
        <motion.div style={{ opacity: townLabel }} className="flex gap-1.5">
          <span className="earth-pill bg-brand-teal/90">For Sale</span>
          <span className="earth-pill bg-white/15">For Rent</span>
        </motion.div>
      </Html>

      {/* Island */}
      <group ref={islandRef} position={ISLE.toArray()} quaternion={uprightOn(isleNormal)}>
        <mesh>
          <sphereGeometry args={[0.12, 24, 24]} />
          <meshStandardMaterial color="#e8d8a8" emissive="#7a6a3a" emissiveIntensity={0.3} />
        </mesh>
        <mesh ref={islandRing} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <torusGeometry args={[0.2, 0.012, 12, 48]} />
          <meshBasicMaterial color="#5DCAA5" transparent opacity={0.8} />
        </mesh>
      </group>
      <Html position={ISLE.clone().multiplyScalar(1.16).toArray()} center distanceFactor={9}>
        <motion.div style={{ opacity: isleLabel }} className="earth-pill">
          Island for sale
        </motion.div>
      </Html>
    </group>
  );
}
