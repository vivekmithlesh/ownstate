"use client";

// OwnState — atmospheric rim glow (Brick 14)
// Back-side fresnel shader on a slightly larger sphere. Intensity ramps
// 0.08 → 0.16 as the camera zooms in, giving the planet a living halo.

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { MotionValue } from "framer-motion";

const VERT = /* glsl */ `
  varying vec3 vNormal;
  void main() {
    vNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  void main() {
    float rim = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
    gl_FragColor = vec4(uColor, 1.0) * clamp(rim, 0.0, 1.0) * uIntensity * 9.0;
  }
`;

export function Atmosphere({ progress }: { progress: MotionValue<number> }) {
  const uniforms = useMemo(
    () => ({
      uColor: { value: new THREE.Color("#5DCAA5") },
      uIntensity: { value: 0.08 },
    }),
    []
  );

  const mat = useRef<THREE.ShaderMaterial>(null);
  useFrame(() => {
    if (mat.current) {
      uniforms.uIntensity.value = 0.08 + 0.08 * progress.get();
    }
  });

  return (
    <mesh scale={1.16}>
      <sphereGeometry args={[2, 64, 64]} />
      <shaderMaterial
        ref={mat}
        uniforms={uniforms}
        vertexShader={VERT}
        fragmentShader={FRAG}
        side={THREE.BackSide}
        blending={THREE.AdditiveBlending}
        transparent
        depthWrite={false}
      />
    </mesh>
  );
}
