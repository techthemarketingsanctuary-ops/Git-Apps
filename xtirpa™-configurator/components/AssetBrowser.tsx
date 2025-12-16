import React, { useState } from 'react';
import { Package, ExternalLink, Upload, Plus, ChevronDown, ChevronUp, Check, Box } from 'lucide-react';
import { DropboxFile, SceneObject } from '../types';

interface AssetBrowserProps {
  onAddObject: (obj: Partial<SceneObject>) => void;
}

const DROPBOX_FOLDER_URL = "https://www.dropbox.com/scl/fo/6xhr5w0n5ksyx8c2dpb1h/AK1Jzg9lykKaQyRRerfN1UI?rlkey=5ugjxd1a51wzvnviglr3wu39c&st=9zkvxwjg&dl=0";

// Mock data representing the 3D files in the shared Dropbox folder
const SYSTEM_PARTS: DropboxFile[] = [
  { id: 'p1', name: 'Aluminium Extrusion 40x40', type: 'file', geometryType: 'box', size: '2.1MB' },
  { id: 'p2', name: 'L-Bracket Joint', type: 'file', geometryType: 'box', size: '0.4MB' },
  { id: 'p3', name: 'Heavy Duty Caster', type: 'file', geometryType: 'sphere', size: '1.2MB' },
  { id: 'p4', name: 'Mounting Plate', type: 'file', geometryType: 'box', size: '0.8MB' },
  { id: 'p5', name: 'Hydraulic Piston', type: 'file', geometryType: 'cylinder', size: '1.5MB' },
  { id: 'p6', name: 'Control Panel Housing', type: 'file', geometryType: 'box', size: '3.2MB' },
  { id: 'p7', name: 'Safety Guard Panel', type: 'file', geometryType: 'box', size: '1.1MB' },
  { id: 'p8', name: 'M8 Fastener Kit', type: 'file', geometryType: 'sphere', size: '0.1MB' },
];

const AssetBrowser: React.FC<AssetBrowserProps> = ({ onAddObject }) => {
  const [selectedParts, setSelectedParts] = useState<Set<string>>(new Set());
  const [isListOpen, setIsListOpen] = useState(true);

  const togglePart = (id: string) => {
    const newSelected = new Set(selectedParts);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedParts(newSelected);
  };

  const handleAssemble = () => {
    let index = 0;
    selectedParts.forEach((id) => {
      const part = SYSTEM_PARTS.find(p => p.id === id);
      if (part) {
        // Offset objects slightly so they don't spawn directly inside each other
        const offset = index * 1.5; 
        onAddObject({
          name: part.name,
          type: 'primitive',
          geometryType: part.geometryType,
          color: '#e0e0e0',
          position: [offset, 0, 0]
        });
        index++;
      }
    });
    // Optional: Clear selection after assembly
    setSelectedParts(new Set());
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const url = URL.createObjectURL(file);
    onAddObject({
      name: file.name,
      type: 'uploaded',
      fileUrl: url,
      color: '#cccccc',
      position: [0, 2, 0]
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800">
      <div className="p-4 border-b border-gray-800 bg-gray-900 z-10">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Package className="w-5 h-5 text-blue-400" />
          Component Library
        </h2>
        <a 
          href={DROPBOX_FOLDER_URL} 
          target="_blank" 
          rel="noreferrer" 
          className="text-xs text-blue-500 hover:text-blue-400 flex items-center mt-2 transition-colors w-fit"
          title="Open source folder"
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          Source: Dropbox Shared
        </a>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {/* System Assembler Section */}
        <div>
          <button 
            onClick={() => setIsListOpen(!isListOpen)}
            className="flex items-center justify-between w-full text-sm font-semibold text-gray-300 hover:text-white mb-2"
          >
            <span>Select Components</span>
            {isListOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          
          {isListOpen && (
            <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
              <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600">
                {SYSTEM_PARTS.map((part) => (
                  <label 
                    key={part.id} 
                    className="flex items-center justify-between p-3 hover:bg-gray-750 cursor-pointer border-b border-gray-700/50 last:border-0 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${selectedParts.has(part.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-500'}`}>
                        {selectedParts.has(part.id) && <Check className="w-3 h-3 text-white" />}
                      </div>
                      <div className="flex flex-col">
                         <span className="text-sm text-gray-200 font-medium">{part.name}</span>
                         <span className="text-[10px] text-gray-500">{part.size}</span>
                      </div>
                    </div>
                    <Box className="w-4 h-4 text-gray-600" />
                    
                    <input 
                      type="checkbox" 
                      className="hidden" 
                      checked={selectedParts.has(part.id)}
                      onChange={() => togglePart(part.id)}
                    />
                  </label>
                ))}
              </div>
              <div className="p-3 bg-gray-800 border-t border-gray-700">
                 <button
                    onClick={handleAssemble}
                    disabled={selectedParts.size === 0}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded text-sm font-bold transition-colors flex items-center justify-center gap-2"
                 >
                    <Plus className="w-4 h-4" />
                    Assemble Selected ({selectedParts.size})
                 </button>
              </div>
            </div>
          )}
        </div>

        {/* Custom Upload Section */}
        <div>
           <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Custom Parts</h3>
           <label className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-gray-700 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors group">
              <div className="flex flex-col items-center text-gray-400 group-hover:text-gray-300">
                <Upload className="w-8 h-8 mb-2" />
                <span className="text-sm">Upload GLB/OBJ</span>
              </div>
              <input type="file" className="hidden" accept=".glb,.gltf,.obj" onChange={handleUpload} />
           </label>
        </div>

      </div>
    </div>
  );
};

export default AssetBrowser;