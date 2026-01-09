import React, { useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html } from "@react-three/drei";
import LoadingSpinner from "./LoadingSpinner";

function CarModel({ url }: { url: string }) {
  try {
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
  } catch (error) {
    return <Html center><div style={{ color: 'white' }}>Model failed to load</div></Html>;
  }
}

const CarModelViewer: React.FC<{ url: string; autoRotate?: boolean }> = ({ url, autoRotate }) => {
  const controls = useRef<any>();
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Canvas camera={{ position: [0, 0, 5], fov: 50 }} style={{ background: "transparent" }}>
        <ambientLight intensity={0.7} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <CarModel url={url} />
        <OrbitControls
          ref={controls}
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          autoRotate={autoRotate}
          autoRotateSpeed={0.5}
        />
        <Html center style={{ pointerEvents: "none" }}>
          {/* Optionally, loading spinner or overlay */}
        </Html>
      </Canvas>
    </Suspense>
  );
};

export default CarModelViewer; 