"use client";

// OwnState — cinematic Earth canvas (Brick 14)
// Deep-space R3F scene: procedural Earth, clouds, atmosphere, energy field and
// scroll-revealed surface markers, with bloom. Pixel ratio capped at 2; the
// frameloop pauses when the hero scrolls out of view.

import { Canvas } from "@react-three/fiber";
import {
  PerspectiveCamera,
  Stars,
  AdaptiveDpr,
  AdaptiveEvents,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import type { MotionValue } from "framer-motion";

import { Earth } from "./Earth";
import { Clouds } from "./Clouds";
import { Atmosphere } from "./Atmosphere";
import { ParticleField } from "./ParticleField";
import { SurfaceMarkers } from "./SurfaceMarkers";
import { CameraRig } from "./CameraRig";

export default function EarthHero({
  progress,
  reducedMotion,
  isMobile,
  active,
}: {
  progress: MotionValue<number>;
  reducedMotion: boolean;
  isMobile: boolean;
  active: boolean;
}) {
  return (
    <Canvas
      dpr={[1, 2]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      style={{ background: "#05060a" }}
    >
      <color attach="background" args={["#05060a"]} />
      <PerspectiveCamera makeDefault fov={45} position={[0, 0, 6]} />

      <ambientLight intensity={0.45} color="#7fb0ff" />
      <directionalLight position={[5, 3, 5]} intensity={2.2} color="#fff2e0" />

      <Stars
        radius={120}
        depth={50}
        count={isMobile ? 1500 : 3000}
        factor={4}
        saturation={0}
        fade
        speed={0.4}
      />

      <Earth progress={progress} reducedMotion={reducedMotion} isMobile={isMobile} />
      <Clouds progress={progress} isMobile={isMobile} />
      <Atmosphere progress={progress} />
      <ParticleField count={isMobile ? 750 : 1500} />
      <SurfaceMarkers progress={progress} isMobile={isMobile} />
      <CameraRig progress={progress} />

      <AdaptiveDpr pixelated={false} />
      <AdaptiveEvents />

      <EffectComposer>
        <Bloom
          intensity={0.6}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.9}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  );
}
