import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, TransformControls, Grid, Stage, useGLTF, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { SceneObject, ToolMode, Measurement } from '../types';

// Define the Three.js elements we are using
interface ThreeElementsImpl {
  mesh: any;
  group: any;
  sphereGeometry: any;
  cylinderGeometry: any;
  boxGeometry: any;
  meshStandardMaterial: any;
  bufferGeometry: any;
  float32BufferAttribute: any;
  lineBasicMaterial: any;
  meshBasicMaterial: any;
  sprite: any;
  color: any;
  line: any;
}

// Extend global JSX namespace
declare global {
  namespace JSX {
    interface IntrinsicElements extends ThreeElementsImpl {}
  }
}

// Extend React's JSX namespace (required for React 18+ strict types)
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements extends ThreeElementsImpl {}
  }
}

// Extend JSX.IntrinsicElements to include React Three Fiber elements
declare global {
  namespace JSX {
    interface IntrinsicElements {
      mesh: any;
      group: any;
      sphereGeometry: any;
      cylinderGeometry: any;
      boxGeometry: any;
      meshStandardMaterial: any;
      bufferGeometry: any;
      float32BufferAttribute: any;
      lineBasicMaterial: any;
      meshBasicMaterial: any;
      sprite: any;
      color: any;
      line: any;
    }
  }
}

interface Viewer3DProps {
  objects: SceneObject[];
  selectedId: string | null;
  mode: ToolMode;
  onSelect: (id: string | null) => void;
  onUpdateObject: (id: string, updates: Partial<SceneObject>) => void;
  background: string; // Color or URL
  measurements: Measurement[];
  onAddMeasurement: (m: Measurement) => void;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}

// Component to handle individual objects
const SceneItem: React.FC<{
  obj: SceneObject;
  isSelected: boolean;
  mode: ToolMode;
  onSelect: () => void;
  onTransform: (updates: Partial<SceneObject>) => void;
}> = ({ obj, isSelected, mode, onSelect, onTransform }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // If we had real URLs, we'd use useGLTF here. 
  // Since this is a demo without a backend proxy for Dropbox, we use primitives 
  // or a generic placeholder if type is 'uploaded' but no URL provided (or blob URL).
  
  let geometry;
  if (obj.type === 'primitive') {
    if (obj.geometryType === 'sphere') geometry = <sphereGeometry args={[0.5, 32, 32]} />;
    else if (obj.geometryType === 'cylinder') geometry = <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
    else geometry = <boxGeometry args={[1, 1, 1]} />;
  } else {
    // Basic fallback for uploaded files if we don't have a GLTF loader fully implemented for blobs in this snippet
    // In a full app, useGLTF(obj.fileUrl) would be here.
    geometry = <boxGeometry args={[1, 1, 1]} />;
  }

  return (
    <>
      {isSelected && mode !== ToolMode.SELECT && mode !== ToolMode.MEASURE && (
        <TransformControls
          object={meshRef}
          mode={mode === ToolMode.ROTATE ? 'rotate' : mode === ToolMode.SCALE ? 'scale' : 'translate'}
          onObjectChange={() => {
            if (meshRef.current) {
              onTransform({
                position: meshRef.current.position.toArray(),
                rotation: [meshRef.current.rotation.x, meshRef.current.rotation.y, meshRef.current.rotation.z],
                scale: meshRef.current.scale.toArray(),
              });
            }
          }}
        />
      )}

      <mesh
        ref={meshRef}
        position={obj.position}
        rotation={obj.rotation}
        scale={obj.scale}
        onClick={(e) => {
          e.stopPropagation();
          onSelect();
        }}
        castShadow
        receiveShadow
      >
        {geometry}
        <meshStandardMaterial 
          color={isSelected ? '#4f9aff' : obj.color} 
          roughness={0.4} 
          metalness={0.6}
        />
      </mesh>
    </>
  );
};

// Component to handle measurements interaction
const MeasurementController: React.FC<{
  active: boolean;
  onMeasureComplete: (start: [number, number, number], end: [number, number, number]) => void;
}> = ({ active, onMeasureComplete }) => {
  const [startPoint, setStartPoint] = useState<THREE.Vector3 | null>(null);
  const { scene, camera, gl } = useThree();

  useEffect(() => {
    if (!active) {
      setStartPoint(null);
    }
  }, [active]);

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    if (!active) return;
    e.stopPropagation(); // Prevent selecting objects underneath
    
    if (!startPoint) {
      setStartPoint(e.point.clone());
    } else {
      const endPoint = e.point.clone();
      onMeasureComplete(startPoint.toArray(), endPoint.toArray());
      setStartPoint(null);
    }
  };

  if (!active) return null;

  return (
    <mesh visible={false} onClick={handleClick}>
       {/* Invisible plane to catch clicks everywhere if needed, or rely on object clicks */}
       {/* Actually, for best UX, we often want to measure ON objects. 
           So we'll attach the onClick to a global handler or rely on the scene objects bubbling.
           However, R3F events bubble. Let's use a large invisible plane for "space" clicks?
           No, usually we measure parts. 
       */}
    </mesh>
  );
};

// Visualizer for existing measurements
const MeasurementLines: React.FC<{ measurements: Measurement[] }> = ({ measurements }) => {
  return (
    <>
      {measurements.map((m) => {
        const start = new THREE.Vector3(...m.startPoint);
        const end = new THREE.Vector3(...m.endPoint);
        const mid = start.clone().add(end).multiplyScalar(0.5);
        
        return (
          <group key={m.id}>
             {/* The Line */}
            <line>
              <bufferGeometry>
                <float32BufferAttribute
                  attach="attributes-position"
                  args={[new Float32Array([...m.startPoint, ...m.endPoint]), 3]}
                />
              </bufferGeometry>
              <lineBasicMaterial color="yellow" linewidth={2} depthTest={false} />
            </line>
            
            {/* Endpoints */}
            <mesh position={start}>
              <sphereGeometry args={[0.05]} />
              <meshBasicMaterial color="yellow" depthTest={false} />
            </mesh>
            <mesh position={end}>
              <sphereGeometry args={[0.05]} />
              <meshBasicMaterial color="yellow" depthTest={false} />
            </mesh>

            {/* Label */}
            <sprite position={mid} scale={[1, 0.5, 1]}>
               {/* Note: In a real app we'd use @react-three/drei Text component. 
                   For simplicity here, we assume standard geometry or leave it purely visual line.
                   Let's try to use Html from drei for the label.
               */}
            </sprite>
          </group>
        );
      })}
    </>
  );
};

const Viewer3D: React.FC<Viewer3DProps> = ({
  objects,
  selectedId,
  mode,
  onSelect,
  onUpdateObject,
  background,
  measurements,
  onAddMeasurement,
  canvasRef
}) => {
  const [measuringStart, setMeasuringStart] = useState<THREE.Vector3 | null>(null);

  const handleCanvasClick = (e: ThreeEvent<MouseEvent>) => {
    if (mode === ToolMode.MEASURE) {
      // Logic to capture points on objects
      e.stopPropagation();
      const p = e.point;
      if (!measuringStart) {
        setMeasuringStart(p.clone());
      } else {
        const newMeasure: Measurement = {
          id: Date.now().toString(),
          startPoint: measuringStart.toArray(),
          endPoint: p.toArray(),
          distance: measuringStart.distanceTo(p)
        };
        onAddMeasurement(newMeasure);
        setMeasuringStart(null);
      }
    } else if (mode === ToolMode.SELECT) {
        // Deselect if clicked on empty space
        onSelect(null);
    }
  };

  return (
    <div className="w-full h-full relative bg-gray-900">
      {/* Background Image handling */}
      {background.startsWith('http') || background.startsWith('blob') ? (
         <div 
           className="absolute inset-0 bg-cover bg-center z-0 opacity-50 pointer-events-none"
           style={{ backgroundImage: `url(${background})` }}
         />
      ) : null}

      <Canvas
        ref={canvasRef}
        shadows
        className="z-10"
        camera={{ position: [5, 5, 5], fov: 50 }}
        gl={{ preserveDrawingBuffer: true }} // Important for screenshot
        onClick={(e) => {
            // This is the global click handler. 
            // R3F events bubble up. If an object didn't stop propagation, we land here.
            if(mode === ToolMode.SELECT) onSelect(null);
        }}
      >
        <color attach="background" args={[background.startsWith('#') ? background : '#1a1a1d']} />
        
        <Stage environment="city" intensity={0.6}>
            {objects.map((obj) => (
            <SceneItem
                key={obj.id}
                obj={obj}
                isSelected={obj.id === selectedId}
                mode={mode}
                onSelect={() => {
                  if (mode !== ToolMode.MEASURE) onSelect(obj.id);
                  // If measuring, we let the click pass through to the mesh handler for point extraction if we merged logic
                  // But actually we need the event data.
                }}
                onTransform={(updates) => onUpdateObject(obj.id, updates)}
            />
            ))}
             {/* Invisible plane for catching measurement clicks on objects */}
            <mesh visible={false} 
                onClick={(e) => {
                    if(mode === ToolMode.MEASURE) {
                        e.stopPropagation();
                        handleCanvasClick(e);
                    }
                }}
            >
               {/* This approach is tricky because we need to click ON objects. 
                   The SceneItem onClick handles selection. 
                   Let's inject measurement logic into SceneItem onClick.
               */}
            </mesh>
        </Stage>

        {/* Global event handler for measuring on objects */}
        <group onClick={(e) => {
            if (mode === ToolMode.MEASURE) {
                e.stopPropagation();
                handleCanvasClick(e);
            }
        }}>
             {/* This group wraps nothing, just captures events if attached to objects? No.
                 We rely on SceneItem propogating or handling it.
                 Let's simplify: Measurement logic is handled inside SceneItem's onClick by checking mode.
             */}
        </group>

        <MeasurementLines measurements={measurements} />
        
        {/* Helper for measurement Start point */}
        {measuringStart && (
           <mesh position={measuringStart}>
             <sphereGeometry args={[0.1]} />
             <meshBasicMaterial color="red" />
           </mesh>
        )}

        <Grid infiniteGrid fadeDistance={50} sectionColor="#4a4a4a" cellColor="#2a2a2a" />
        <OrbitControls makeDefault />
      </Canvas>
    </div>
  );
};

export default Viewer3D;