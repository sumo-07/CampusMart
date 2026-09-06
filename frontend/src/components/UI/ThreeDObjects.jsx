import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, Float, Sparkles, PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";

// ----------------------------------------------------
// 1. HELPERS & MATERIALS
// ----------------------------------------------------
const GlassMaterial = ({ color = "#ffffff", roughness = 0.1, metalness = 0.9 }) => (
  <meshPhysicalMaterial
    color={color}
    roughness={roughness}
    metalness={metalness}
    transparent
    opacity={0.6}
    transmission={0.6}
    ior={1.5}
    thickness={1.5}
    clearcoat={1}
  />
);

const NeonMaterial = ({ color = "#00d2ff", emissiveIntensity = 1.5 }) => (
  <meshStandardMaterial
    color={color}
    emissive={color}
    emissiveIntensity={emissiveIntensity}
    roughness={0.2}
  />
);

// ----------------------------------------------------
// 2. HERO COMPONENT: floating objects
// ----------------------------------------------------
const FloatingLaptop = () => {
  const meshRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    // Subtle rotation and float
    meshRef.current.rotation.y = Math.sin(t / 2) * 0.3 + Math.PI / 6;
    meshRef.current.rotation.x = Math.cos(t / 3) * 0.1;
  });

  return (
    <group ref={meshRef} position={[0, -0.2, 0]}>
      {/* Laptop Base */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[2.2, 0.08, 1.5]} />
        <GlassMaterial color="#94A3B8" roughness={0.1} />
      </mesh>
      
      {/* Trackpad */}
      <mesh position={[0, 0.001, 0.5]}>
        <boxGeometry args={[0.5, 0.001, 0.3]} />
        <meshStandardMaterial color="#0984e3" roughness={0.5} />
      </mesh>

      {/* Laptop Screen Lid */}
      <group position={[0, 0, -0.7]} rotation={[1.2, 0, 0]}>
        <mesh position={[0, 0.7, 0]}>
          <boxGeometry args={[2.2, 1.4, 0.06]} />
          <GlassMaterial color="#0D0D11" roughness={0.2} />
        </mesh>
        
        {/* Glow Screen */}
        <mesh position={[0, 0.7, 0.035]}>
          <planeGeometry args={[2.0, 1.2]} />
          <meshStandardMaterial 
            color="#a259ff" 
            emissive="#a259ff" 
            emissiveIntensity={1.2} 
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
};

const FloatingEssentials = () => {
  const groupRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = t * 0.05;
  });

  return (
    <group ref={groupRef}>
      {/* Floating Headphone left-ish */}
      <Float speed={2} rotationIntensity={1.5} floatIntensity={1.5}>
        <group position={[-2.2, 1.0, 0.5]} scale={0.6}>
          {/* Headband */}
          <mesh>
            <torusGeometry args={[0.8, 0.08, 16, 100, Math.PI]} />
            <NeonMaterial color="#00d2ff" />
          </mesh>
          {/* Earcups */}
          <mesh position={[-0.8, 0, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.3, 32]} />
            <meshStandardMaterial color="#0B0F19" roughness={0.2} />
          </mesh>
          <mesh position={[0.8, 0, 0]}>
            <cylinderGeometry args={[0.25, 0.25, 0.3, 32]} />
            <meshStandardMaterial color="#0B0F19" roughness={0.2} />
          </mesh>
        </group>
      </Float>

      {/* Floating Book right-ish */}
      <Float speed={1.5} rotationIntensity={1.2} floatIntensity={1.2}>
        <group position={[2.2, -0.6, -0.5]} scale={0.7} rotation={[0.5, 0.8, -0.3]}>
          {/* Cover */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[0.9, 1.3, 0.25]} />
            <NeonMaterial color="#a259ff" />
          </mesh>
          {/* Pages */}
          <mesh position={[0.02, 0, 0]}>
            <boxGeometry args={[0.85, 1.25, 0.22]} />
            <meshStandardMaterial color="#ffffff" roughness={0.9} />
          </mesh>
        </group>
      </Float>

      {/* Floating Smart Globe top-right */}
      <Float speed={3} rotationIntensity={2} floatIntensity={1}>
        <mesh position={[1.8, 1.2, -1.0]} scale={0.45}>
          <dodecahedronGeometry args={[1, 1]} />
          <GlassMaterial color="#00d2ff" roughness={0.1} />
        </mesh>
      </Float>
    </group>
  );
};

// Interactive Mouse Follower Wrapper
const InteractiveScene = () => {
  const sceneRef = useRef();
  const { size, viewport } = useThree();

  useFrame((state) => {
    const mouseX = (state.pointer.x * viewport.width) / 6;
    const mouseY = (state.pointer.y * viewport.height) / 6;
    
    sceneRef.current.rotation.y = THREE.MathUtils.lerp(
      sceneRef.current.rotation.y,
      mouseX * 0.15,
      0.05
    );
    sceneRef.current.rotation.x = THREE.MathUtils.lerp(
      sceneRef.current.rotation.x,
      -mouseY * 0.15,
      0.05
    );
  });

  return (
    <group ref={sceneRef}>
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1.5} />
      <pointLight position={[-5, -5, -5]} intensity={0.8} color="#00d2ff" />
      <pointLight position={[5, 5, 5]} intensity={1.2} color="#a259ff" />
      
      <Sparkles count={50} scale={5} size={2.5} speed={0.4} color="#00d2ff" />
      
      <FloatingLaptop />
      <FloatingEssentials />
    </group>
  );
};

export const HeroCanvas = () => {
  return (
    <div style={{ width: "100%", height: "450px", position: "relative", cursor: "grab" }}>
      <Canvas eventSource={document.getElementById("root")} eventPrefix="client">
        <PerspectiveCamera makeDefault position={[0, 0, 5]} fov={50} />
        <InteractiveScene />
      </Canvas>
    </div>
  );
};

// ----------------------------------------------------
// 3. CATEGORY COMPONENT: individual models
// ----------------------------------------------------
const SneakerModel = () => {
  const groupRef = useRef();
  useFrame((state) => {
    groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.8;
  });
  return (
    <group ref={groupRef} scale={1.2}>
      {/* Sole */}
      <mesh position={[0, -0.3, 0]}>
        <boxGeometry args={[1.5, 0.2, 0.6]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      {/* Main shoe body */}
      <mesh position={[-0.1, -0.05, 0]}>
        <boxGeometry args={[1.2, 0.4, 0.55]} />
        <GlassMaterial color="#00d2ff" roughness={0.1} />
      </mesh>
      {/* Ankle pad */}
      <mesh position={[0.3, 0.25, 0]}>
        <boxGeometry args={[0.5, 0.4, 0.5]} />
        <meshStandardMaterial color="#0B0F19" roughness={0.5} />
      </mesh>
      {/* Neon laces or accent strap */}
      <mesh position={[-0.2, 0.16, 0]}>
        <boxGeometry args={[0.4, 0.06, 0.6]} />
        <NeonMaterial color="#a259ff" />
      </mesh>
    </group>
  );
};

const DeskLampModel = () => {
  const groupRef = useRef();
  useFrame((state) => {
    groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.5;
  });
  return (
    <group ref={groupRef} position={[0, -0.4, 0]} scale={1.1}>
      {/* Base */}
      <mesh position={[0, 0.05, 0]}>
        <cylinderGeometry args={[0.5, 0.5, 0.08, 32]} />
        <meshStandardMaterial color="#0D0D11" roughness={0.2} />
      </mesh>
      {/* Pole */}
      <mesh position={[-0.2, 0.6, 0]} rotation={[0, 0, -0.25]}>
        <cylinderGeometry args={[0.04, 0.04, 1.1, 16]} />
        <GlassMaterial color="#94A3B8" />
      </mesh>
      {/* Shade */}
      <group position={[0, 1.1, 0]} rotation={[0, 0, 0.5]}>
        <mesh>
          <coneGeometry args={[0.4, 0.5, 32]} />
          <GlassMaterial color="#a259ff" />
        </mesh>
        {/* Glow inner bulb */}
        <mesh position={[0, -0.15, 0]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <NeonMaterial color="#00d2ff" />
        </mesh>
      </group>
    </group>
  );
};

const GadgetModel = () => {
  const groupRef = useRef();
  useFrame((state) => {
    groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.6;
    groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.4) * 0.2;
  });
  return (
    <group ref={groupRef} scale={1.1}>
      {/* Rounded console body */}
      <mesh>
        <boxGeometry args={[1.3, 0.8, 0.35]} />
        <GlassMaterial color="#0D0D11" roughness={0.1} />
      </mesh>
      {/* Glowing Screen */}
      <mesh position={[0, 0, 0.18]}>
        <planeGeometry args={[1.0, 0.6]} />
        <meshStandardMaterial 
          color="#00d2ff" 
          emissive="#00d2ff" 
          emissiveIntensity={1.5}
        />
      </mesh>
      {/* Side Controllers */}
      <mesh position={[-0.75, 0, 0]}>
        <boxGeometry args={[0.2, 0.7, 0.3]} />
        <meshStandardMaterial color="#a259ff" />
      </mesh>
      <mesh position={[0.75, 0, 0]}>
        <boxGeometry args={[0.2, 0.7, 0.3]} />
        <meshStandardMaterial color="#a259ff" />
      </mesh>
      {/* Floating Holographic Ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]} scale={1.4}>
        <torusGeometry args={[0.7, 0.03, 8, 48]} />
        <NeonMaterial color="#00d2ff" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
};

export const CategoryModel = ({ type }) => {
  const renderModel = () => {
    switch (type.toLowerCase()) {
      case "fashion":
      case "womens-shoes":
      case "mens-shoes":
      case "womens-bags":
        return <SneakerModel />;
      case "dorm-decor":
      case "furniture":
      case "home-decoration":
      case "kitchen-accessories":
        return <DeskLampModel />;
      case "tech-essentials":
      case "smartphones":
      case "laptops":
      case "tablets":
      case "mobile-accessories":
      default:
        return <GadgetModel />;
    }
  };

  return (
    <div style={{ width: "100%", height: "180px", cursor: "pointer" }}>
      <Canvas camera={{ position: [0, 0, 3.2], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[3, 5, 2]} intensity={1.5} />
        <pointLight position={[-3, -3, -3]} intensity={0.5} color="#00d2ff" />
        <pointLight position={[3, 3, 3]} intensity={0.8} color="#a259ff" />
        
        {renderModel()}
      </Canvas>
    </div>
  );
};

// ----------------------------------------------------
// 4. TESTIMONIALS COMPONENT: glass globe / network
// ----------------------------------------------------
const RotatingGlobe = () => {
  const globeRef = useRef();
  const ringRef = useRef();

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    globeRef.current.rotation.y = t * 0.15;
    globeRef.current.rotation.x = Math.sin(t * 0.1) * 0.1;
    ringRef.current.rotation.y = -t * 0.25;
    ringRef.current.rotation.z = Math.cos(t * 0.1) * 0.2;
  });

  return (
    <group>
      {/* Central Glass Globe */}
      <mesh ref={globeRef}>
        <sphereGeometry args={[1.5, 32, 32]} />
        <GlassMaterial color="#94A3B8" roughness={0.1} metalness={0.9} />
        {/* Wireframe overlay */}
        <mesh scale={1.01}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshBasicMaterial color="#00d2ff" wireframe transparent opacity={0.15} />
        </mesh>
      </mesh>

      {/* Holographic Ring */}
      <mesh ref={ringRef} rotation={[1.1, 0.4, 0]}>
        <torusGeometry args={[2.2, 0.05, 12, 100]} />
        <NeonMaterial color="#a259ff" emissiveIntensity={1} />
      </mesh>
    </group>
  );
};

export const GlassGlobe = () => {
  return (
    <div style={{ width: "100%", height: "400px", position: "relative" }}>
      <Canvas camera={{ position: [0, 0, 5.5], fov: 45 }}>
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 10, 5]} intensity={1.5} />
        <pointLight position={[-5, -5, -5]} intensity={0.5} color="#00d2ff" />
        <pointLight position={[5, 5, 5]} intensity={1} color="#a259ff" />
        
        <Sparkles count={80} scale={4.5} size={2} speed={0.3} color="#a259ff" />
        
        <RotatingGlobe />
      </Canvas>
    </div>
  );
};

// ----------------------------------------------------
// 5. PRODUCT 3D ROTATABLE PREVIEW
// ----------------------------------------------------
const DisplayProductModel = ({ category, thumbnail }) => {
  const meshRef = useRef();

  useFrame((state) => {
    // Idle rotation
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
    }
  });

  // Depending on category, render different premium display shapes
  const isElectronics = ["smartphones", "laptops", "tablets", "mobile-accessories"].includes(category);
  const isFurniture = ["furniture", "home-decoration", "kitchen-accessories"].includes(category);

  if (isElectronics) {
    return (
      <group ref={meshRef}>
        {/* Futuristic Glass Tablet/Display Screen */}
        <mesh>
          <boxGeometry args={[2.2, 1.4, 0.15]} />
          <GlassMaterial color="#94A3B8" roughness={0.1} />
        </mesh>
        
        {/* Core metallic frame */}
        <mesh scale={0.98}>
          <boxGeometry args={[2.22, 1.42, 0.1]} />
          <meshStandardMaterial color="#0B0F19" metalness={0.9} roughness={0.2} />
        </mesh>

        {/* Emissive glow screen */}
        <mesh position={[0, 0, 0.08]}>
          <planeGeometry args={[2.0, 1.2]} />
          <meshStandardMaterial 
            color="#00d2ff" 
            emissive="#00d2ff" 
            emissiveIntensity={0.6}
          />
        </mesh>
        
        {/* Holographic glowing ring orbiting */}
        <mesh rotation={[Math.PI / 3, 0, 0]} scale={1.8}>
          <torusGeometry args={[1.0, 0.02, 8, 64]} />
          <NeonMaterial color="#a259ff" emissiveIntensity={0.5} />
        </mesh>
      </group>
    );
  }

  if (isFurniture) {
    return (
      <group ref={meshRef}>
        {/* Futuristic Pedestal / Seat shape */}
        <mesh position={[0, -0.6, 0]}>
          <cylinderGeometry args={[1.2, 1.4, 0.4, 32]} />
          <GlassMaterial color="#a259ff" roughness={0.2} />
        </mesh>
        {/* Holographic light cylinder projecting upward */}
        <mesh position={[0, 0.3, 0]} transparent>
          <cylinderGeometry args={[0.9, 0.9, 1.4, 32, 1, true]} />
          <meshPhysicalMaterial 
            color="#00d2ff" 
            emissive="#00d2ff" 
            emissiveIntensity={1.2} 
            transparent 
            opacity={0.18}
            side={THREE.DoubleSide}
          />
        </mesh>
        {/* Floating display crystal */}
        <mesh position={[0, 0.4, 0]}>
          <octahedronGeometry args={[0.6]} />
          <GlassMaterial color="#00d2ff" roughness={0.05} />
        </mesh>
      </group>
    );
  }

  // Default: A premium floating crystal display box
  return (
    <group ref={meshRef}>
      <mesh>
        <boxGeometry args={[1.4, 1.4, 1.4]} />
        <GlassMaterial color="#a259ff" roughness={0.1} />
      </mesh>
      {/* Wireframe outer shell */}
      <mesh scale={1.2}>
        <boxGeometry args={[1.4, 1.4, 1.4]} />
        <meshBasicMaterial color="#00d2ff" wireframe transparent opacity={0.2} />
      </mesh>
      {/* Core glowing sphere */}
      <mesh>
        <sphereGeometry args={[0.4, 32, 32]} />
        <NeonMaterial color="#00d2ff" emissiveIntensity={1} />
      </mesh>
    </group>
  );
};

export const ProductPreview3D = ({ category, thumbnail }) => {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: "350px", position: "relative", cursor: "grab" }}>
      <Canvas camera={{ position: [0, 0, 4.5], fov: 40 }}>
        <ambientLight intensity={0.4} />
        <directionalLight position={[5, 8, 5]} intensity={1.5} />
        <pointLight position={[-5, -5, -5]} intensity={0.6} color="#00d2ff" />
        <pointLight position={[5, 5, 5]} intensity={1} color="#a259ff" />
        
        <Sparkles count={40} scale={3.5} size={2} speed={0.4} color="#00d2ff" />
        
        <DisplayProductModel category={category} thumbnail={thumbnail} />
        
        <OrbitControls enableZoom={false} autoRotate={false} maxPolarAngle={Math.PI / 1.8} minPolarAngle={Math.PI / 3} />
      </Canvas>
    </div>
  );
};
