import React, { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, useGLTF, Center } from '@react-three/drei';
import { Loader } from 'lucide-react';

function Model({ url }) {
    const { scene } = useGLTF(url);
    return <primitive object={scene} />;
}

export const ThreeDViewer = ({ modelUrl }) => {
    if (!modelUrl) {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-gray-50 text-gray-400">
                <Loader className="animate-spin mb-2" size={32} />
                <p className="text-sm">No 3D model available</p>
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-gradient-to-br from-gray-900 to-gray-800">
            <Canvas
                camera={{ position: [0, 0, 100], fov: 50 }}
                shadows
                dpr={[1, 2]}
            >
                <Suspense fallback={null}>
                    <ambientLight intensity={0.5} />
                    <directionalLight
                        position={[10, 10, 5]}
                        intensity={1}
                        castShadow
                    />
                    <directionalLight
                        position={[-10, -10, -5]}
                        intensity={0.3}
                    />
                    <Center>
                        <Model url={modelUrl} />
                    </Center>
                    <OrbitControls
                        makeDefault
                        minDistance={5}
                        maxDistance={500}
                        enablePan={true}
                        enableZoom={true}
                        enableRotate={true}
                    />
                    <Environment preset="studio" />
                    <gridHelper args={[200, 20]} position={[0, -50, 0]} />
                </Suspense>
            </Canvas>
            <div className="absolute bottom-4 left-4 bg-black/50 text-white text-xs px-3 py-2 rounded backdrop-blur-sm font-mono">
                <div>Left Click + Drag: Rotate</div>
                <div>Right Click + Drag: Pan</div>
                <div>Scroll: Zoom</div>
            </div>
        </div>
    );
};
