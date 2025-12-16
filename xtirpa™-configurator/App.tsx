import React, { useState, useRef, useCallback } from 'react';
import Viewer3D from './components/Viewer3D';
import Toolbar from './components/Toolbar';
import AssetBrowser from './components/AssetBrowser';
import { SceneObject, ToolMode, Measurement, WatermarkConfig } from './types';
import { generateRendering } from './services/geminiService';
import { Loader2, X, Download } from 'lucide-react';

export default function App() {
  const [objects, setObjects] = useState<SceneObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<ToolMode>(ToolMode.SELECT);
  const [background, setBackground] = useState<string>('#1a1a1d');
  const [measurements, setMeasurements] = useState<Measurement[]>([]);
  const [watermark, setWatermark] = useState<WatermarkConfig>({ enabled: true, text: 'DRAFT', opacity: 0.5 });
  
  // Rendering State
  const [isRendering, setIsRendering] = useState(false);
  const [renderResult, setRenderResult] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleAddObject = (objData: Partial<SceneObject>) => {
    // Generate a robust unique ID, especially useful when adding multiple objects rapidly
    const uniqueId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const newObj: SceneObject = {
      id: uniqueId,
      name: objData.name || 'New Object',
      type: objData.type || 'primitive',
      geometryType: objData.geometryType,
      fileUrl: objData.fileUrl,
      position: objData.position || [0, 0, 0], // Use provided position or default to center
      rotation: objData.rotation || [0, 0, 0],
      scale: objData.scale || [1, 1, 1],
      color: objData.color || '#ffffff',
    };
    
    setObjects((prev) => [...prev, newObj]);
    setSelectedId(newObj.id);
    setMode(ToolMode.MOVE);
  };

  const handleUpdateObject = (id: string, updates: Partial<SceneObject>) => {
    setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, ...updates } : o)));
  };

  const handleBackgroundUpload = (file: File) => {
    const url = URL.createObjectURL(file);
    setBackground(url);
  };

  const handleGenerateRender = async () => {
    if (!canvasRef.current) return;
    
    setIsRendering(true);
    try {
      // 1. Capture the current WebGL canvas as an image
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/png');

      // 2. Send to Gemini for enhancement
      const wmText = watermark.enabled ? watermark.text : '';
      const result = await generateRendering(dataUrl, "A high quality studio rendering of this assembly.", wmText);
      
      setRenderResult(result);
    } catch (e) {
      alert("Rendering failed. Please try again.");
      console.error(e);
    } finally {
      setIsRendering(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans selection:bg-blue-500/30">
      <Toolbar
        mode={mode}
        setMode={setMode}
        onBackgroundUpload={handleBackgroundUpload}
        onRender={handleGenerateRender}
        watermark={watermark}
        setWatermark={setWatermark}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar - Asset Library */}
        <div className="w-80 flex-shrink-0 z-20 shadow-xl">
          <AssetBrowser onAddObject={handleAddObject} />
        </div>

        {/* Main Viewport */}
        <div className="flex-1 relative">
          <Viewer3D
            canvasRef={canvasRef}
            objects={objects}
            selectedId={selectedId}
            mode={mode}
            onSelect={setSelectedId}
            onUpdateObject={handleUpdateObject}
            background={background}
            measurements={measurements}
            onAddMeasurement={(m) => setMeasurements(prev => [...prev, m])}
          />

          {/* Overlay Watermark (Preview) */}
          {watermark.enabled && !renderResult && (
            <div className="absolute bottom-4 right-4 pointer-events-none opacity-50 text-4xl font-black text-white/20 select-none">
              {watermark.text}
            </div>
          )}

          {/* Measurements Overlay List */}
          {measurements.length > 0 && (
             <div className="absolute top-4 right-4 bg-gray-900/80 p-4 rounded-lg backdrop-blur text-xs w-48">
                <h3 className="font-bold mb-2 text-gray-400 uppercase tracking-wider">Measurements</h3>
                <ul className="space-y-1">
                    {measurements.map((m, idx) => (
                        <li key={m.id} className="flex justify-between border-b border-gray-700 pb-1 last:border-0">
                            <span>#{idx + 1}</span>
                            <span className="font-mono text-blue-400">{m.distance.toFixed(2)} units</span>
                        </li>
                    ))}
                </ul>
                <button 
                    onClick={() => setMeasurements([])}
                    className="mt-3 w-full text-center text-red-400 hover:text-red-300 py-1 hover:bg-red-900/20 rounded transition-colors"
                >
                    Clear All
                </button>
             </div>
          )}
        </div>
      </div>

      {/* Rendering Modal */}
      {(isRendering || renderResult) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
          <div className="bg-gray-800 p-6 rounded-xl shadow-2xl max-w-4xl w-full mx-4 border border-gray-700 flex flex-col items-center">
            {isRendering ? (
              <div className="flex flex-col items-center py-12">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                <h2 className="text-xl font-bold text-white">Rendering...</h2>
                <p className="text-gray-400 mt-2">Gemini AI is generating your photorealistic studio shot.</p>
              </div>
            ) : (
              <>
                <div className="w-full flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-white">Render Result</h2>
                  <button onClick={() => setRenderResult(null)} className="p-2 hover:bg-gray-700 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {renderResult && (
                  <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden border border-gray-700 mb-6">
                    <img src={renderResult} alt="Final Render" className="w-full h-full object-contain" />
                  </div>
                )}

                <div className="flex gap-3 w-full justify-end">
                   <button 
                      onClick={() => setRenderResult(null)}
                      className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700 rounded transition-colors"
                   >
                     Close
                   </button>
                   <a 
                     href={renderResult || '#'} 
                     download="studio-render.png"
                     className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded font-medium flex items-center gap-2 transition-colors"
                   >
                     <Download className="w-4 h-4" />
                     Download Image
                   </a>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}