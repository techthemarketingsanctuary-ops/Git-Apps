import React from 'react';
import { 
  Move, RotateCw, Scaling, MousePointer2, Ruler, 
  Image as ImageIcon, Camera, type LucideIcon 
} from 'lucide-react';
import { ToolMode, WatermarkConfig } from '../types';

interface ToolbarProps {
  mode: ToolMode;
  setMode: (m: ToolMode) => void;
  onBackgroundUpload: (file: File) => void;
  onRender: () => void;
  watermark: WatermarkConfig;
  setWatermark: (w: WatermarkConfig) => void;
}

const ToolButton: React.FC<{
  icon: LucideIcon;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon: Icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    title={label}
    className={`p-3 rounded-lg transition-all flex flex-col items-center gap-1 ${
      isActive 
        ? 'bg-[#FDB913] text-black shadow-lg shadow-yellow-500/20' 
        : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

const Toolbar: React.FC<ToolbarProps> = ({ 
  mode, setMode, onBackgroundUpload, onRender, watermark, setWatermark 
}) => {
  return (
    <div className="h-20 border-b border-gray-800 bg-gray-900 px-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {/* Xtirpa Logo / Branding */}
        <div className="flex items-baseline mr-8 select-none">
            <h1 className="text-3xl font-black italic tracking-tighter text-[#FDB913]" style={{ fontFamily: 'Arial, sans-serif' }}>
            XTIRPA<sup className="text-sm not-italic align-super">TM</sup>
            </h1>
            <span className="ml-2 text-white font-light text-lg tracking-wide opacity-80">Configurator</span>
        </div>
        
        <div className="flex items-center gap-2 pr-6 border-r border-gray-800">
          <ToolButton 
            icon={MousePointer2} 
            label="Select" 
            isActive={mode === ToolMode.SELECT} 
            onClick={() => setMode(ToolMode.SELECT)} 
          />
          <ToolButton 
            icon={Move} 
            label="Move" 
            isActive={mode === ToolMode.MOVE} 
            onClick={() => setMode(ToolMode.MOVE)} 
          />
          <ToolButton 
            icon={RotateCw} 
            label="Rotate" 
            isActive={mode === ToolMode.ROTATE} 
            onClick={() => setMode(ToolMode.ROTATE)} 
          />
          <ToolButton 
            icon={Scaling} 
            label="Scale" 
            isActive={mode === ToolMode.SCALE} 
            onClick={() => setMode(ToolMode.SCALE)} 
          />
        </div>

        <div className="flex items-center gap-2 pl-2">
          <ToolButton 
            icon={Ruler} 
            label="Measure" 
            isActive={mode === ToolMode.MEASURE} 
            onClick={() => setMode(ToolMode.MEASURE)} 
          />
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex flex-col gap-1 mr-4">
            <label className="text-xs text-gray-500 font-medium uppercase tracking-wider">Watermark</label>
            <div className="flex items-center gap-2 bg-gray-800 p-1 rounded">
                <input 
                    type="checkbox" 
                    checked={watermark.enabled}
                    onChange={(e) => setWatermark({...watermark, enabled: e.target.checked})}
                    className="ml-2 accent-yellow-500"
                />
                <input 
                    type="text" 
                    value={watermark.text}
                    onChange={(e) => setWatermark({...watermark, text: e.target.value})}
                    placeholder="Enter text..."
                    className="bg-transparent border-none text-sm text-white focus:ring-0 px-2 w-24"
                    disabled={!watermark.enabled}
                />
            </div>
        </div>

        <label className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg cursor-pointer transition-colors text-sm font-medium text-gray-300">
          <ImageIcon className="w-4 h-4" />
          Set BG
          <input 
            type="file" 
            className="hidden" 
            accept="image/*" 
            onChange={(e) => e.target.files?.[0] && onBackgroundUpload(e.target.files[0])} 
          />
        </label>

        <button 
          onClick={onRender}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#FDB913] hover:bg-yellow-400 text-black rounded-lg font-bold shadow-lg shadow-yellow-500/20 transition-all hover:scale-105 active:scale-95"
        >
          <Camera className="w-4 h-4" />
          Generate Render
        </button>
      </div>
    </div>
  );
};

export default Toolbar;