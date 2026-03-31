import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export type ToothFace = 'top' | 'bottom' | 'left' | 'right' | 'center';
export type FaceStatus = 'sano' | 'caries' | 'resina';
export type FullStatus = 'presente' | 'ausente' | 'endodoncia' | 'implante';

export interface OdontogramData {
  [toothNumber: number]: {
    faces: Record<ToothFace, FaceStatus>;
    status: FullStatus;
  };
}

interface OdontogramaProps {
  value?: OdontogramData;
  onChange?: (data: OdontogramData) => void;
  readonly?: boolean;
}

const DEFAULT_TOOTH_DATA = {
  faces: {
    top: 'sano' as FaceStatus,
    bottom: 'sano' as FaceStatus,
    left: 'sano' as FaceStatus,
    right: 'sano' as FaceStatus,
    center: 'sano' as FaceStatus,
  },
  status: 'presente' as FullStatus
};

const TOOTH_NUMBERS = {
  upperLeft: [18, 17, 16, 15, 14, 13, 12, 11],
  upperRight: [21, 22, 23, 24, 25, 26, 27, 28],
  lowerRight: [48, 47, 46, 45, 44, 43, 42, 41],
  lowerLeft: [31, 32, 33, 34, 35, 36, 37, 38],
};

const getFill = (status: FaceStatus) => {
  if (status === 'caries') return '#ef4444'; // red-500
  if (status === 'resina') return '#3b82f6'; // blue-500
  return '#ffffff';
};

const Tooth = ({ 
  number, 
  data = DEFAULT_TOOTH_DATA, 
  onFaceClick, 
  onStatusToggle,
  readonly 
}: { 
  number: number, 
  data?: any, 
  onFaceClick: (face: ToothFace, number: number) => void,
  onStatusToggle: (number: number) => void,
  readonly?: boolean
}) => {
  const isAbsent = data.status === 'ausente';
  const isEndo = data.status === 'endodoncia';
  const isImplante = data.status === 'implante';

  return (
    <div className="flex flex-col items-center justify-center gap-1 group">
      <span className="text-xs font-bold text-gray-500">{number}</span>
      <div 
        className="relative cursor-pointer transition-transform hover:scale-110"
        onContextMenu={(e) => {
          e.preventDefault();
          if (!readonly) onStatusToggle(number);
        }}
        title="Clic izquierdo para cambiar cara. Clic derecho para cambiar estado del diente."
      >
        <svg fill="none" width="40" height="40" viewBox="0 0 40 40" className="drop-shadow-sm bg-white" style={{borderRadius: 4}}>
          {/* Top Face */}
          <polygon 
            points="0,0 40,0 28,12 12,12" 
            fill={getFill(data.faces.top)} 
            stroke="#9ca3af" 
            strokeWidth="1"
            className="hover:stroke-[#1c334a] hover:stroke-2 transition-all duration-200"
            onClick={() => !readonly && onFaceClick('top', number)}
          />
          {/* Bottom Face */}
          <polygon 
            points="0,40 40,40 28,28 12,28" 
            fill={getFill(data.faces.bottom)} 
            stroke="#9ca3af" 
            strokeWidth="1"
            className="hover:stroke-[#1c334a] hover:stroke-2 transition-all duration-200"
            onClick={() => !readonly && onFaceClick('bottom', number)}
          />
          {/* Left Face */}
          <polygon 
            points="0,0 12,12 12,28 0,40" 
            fill={getFill(data.faces.left)} 
            stroke="#9ca3af" 
            strokeWidth="1"
            className="hover:stroke-[#1c334a] hover:stroke-2 transition-all duration-200"
            onClick={() => !readonly && onFaceClick('left', number)}
          />
          {/* Right Face */}
          <polygon 
            points="40,0 28,12 28,28 40,40" 
            fill={getFill(data.faces.right)} 
            stroke="#9ca3af" 
            strokeWidth="1"
            className="hover:stroke-[#1c334a] hover:stroke-2 transition-all duration-200"
            onClick={() => !readonly && onFaceClick('right', number)}
          />
          {/* Center Face */}
          <rect 
            x="12" y="12" width="16" height="16" 
            fill={getFill(data.faces.center)} 
            stroke="#9ca3af" 
            strokeWidth="1"
            className="hover:stroke-[#1c334a] hover:stroke-2 transition-all duration-200"
            onClick={() => !readonly && onFaceClick('center', number)}
          />
          
          {/* Overlays */}
          {isEndo && (
            <circle cx="20" cy="20" r="16" fill="none" stroke="#dc2626" strokeWidth="4" className="pointer-events-none opacity-90" />
          )}
          {isAbsent && (
            <>
              <line x1="0" y1="0" x2="40" y2="40" stroke="#1f2937" strokeWidth="4" className="pointer-events-none opacity-80" />
              <line x1="40" y1="0" x2="0" y2="40" stroke="#1f2937" strokeWidth="4" className="pointer-events-none opacity-80" />
            </>
          )}
          {isImplante && (
            <text x="20" y="27" fontSize="24" fontWeight="bold" fill="#047857" textAnchor="middle" className="pointer-events-none">I</text>
          )}
        </svg>
      </div>
    </div>
  );
};

export const Odontograma = ({ value = {}, onChange, readonly = false }: OdontogramaProps) => {
  // Current active tool mode
  const [activeFaceStatus, setActiveFaceStatus] = useState<FaceStatus>('caries');
  
  const handleFaceClick = (face: ToothFace, number: number) => {
    if (readonly) return;
    
    const currentTooth = value[number] || DEFAULT_TOOTH_DATA;
    // Check if we are resetting the tool
    const currentFaceStatus = currentTooth.faces[face];
    const newStatus = currentFaceStatus === activeFaceStatus ? 'sano' : activeFaceStatus;

    const newValue = {
      ...value,
      [number]: {
        ...currentTooth,
        faces: {
          ...currentTooth.faces,
          [face]: newStatus
        }
      }
    };
    onChange?.(newValue);
  };

  const handleStatusToggle = (number: number) => {
    if (readonly) return;
    const currentTooth = value[number] || DEFAULT_TOOTH_DATA;
    
    const statusCycle: Record<FullStatus, FullStatus> = {
      presente: 'ausente',
      ausente: 'endodoncia',
      endodoncia: 'implante',
      implante: 'presente'
    };

    const newValue = {
      ...value,
      [number]: {
        ...currentTooth,
        status: statusCycle[currentTooth.status]
      }
    };
    onChange?.(newValue);
  };

  const renderQuadrant = (numbers: number[]) => (
    <div className="flex gap-1.5 flex-wrap justify-center">
      {numbers.map(n => (
        <Tooth 
          key={n} 
          number={n} 
          data={value[n]} 
          onFaceClick={handleFaceClick}
          onStatusToggle={handleStatusToggle}
          readonly={readonly}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 font-sans">
      
      {!readonly && (
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-blue-50/50 p-4 rounded-xl border border-[#1c334a]/10 shadow-sm">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-[#1c334a] uppercase tracking-wider">Herramienta Actual:</span>
            <div className="flex gap-2 bg-white p-1 rounded-lg border shadow-sm">
              <Button 
                variant={activeFaceStatus === 'caries' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setActiveFaceStatus('caries')}
                className={`h-8 px-3 text-xs font-bold ${activeFaceStatus === 'caries' ? 'bg-red-500 hover:bg-red-600 text-white shadow-md' : 'text-gray-600 hover:text-red-500'}`}
              >
                <div className="w-3.5 h-3.5 rounded-sm bg-red-500 mr-2 border border-red-700 shadow-inner" />
                Caries
              </Button>
              <Button 
                variant={activeFaceStatus === 'resina' ? 'default' : 'ghost'} 
                size="sm" 
                onClick={() => setActiveFaceStatus('resina')}
                className={`h-8 px-3 text-xs font-bold ${activeFaceStatus === 'resina' ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:text-blue-500'}`}
              >
                <div className="w-3.5 h-3.5 rounded-sm bg-blue-500 mr-2 border border-blue-700 shadow-inner" />
                Amalgama / Resina
              </Button>
            </div>
          </div>

          <div className="flex gap-4 text-[11px] font-bold text-gray-500 uppercase tracking-wide bg-white p-2 rounded-lg border shadow-sm">
            <div className="flex items-center gap-1.5"><strong className="text-black text-xs">CLICK DER:</strong> Cambia Ausente / Endo / Implante</div>
          </div>
        </div>
      )}

      {/* Odontogram Grid */}
      <div className="flex flex-col gap-6 justify-center items-center py-8 px-4 bg-[#f8fafc] rounded-xl border border-gray-200 shadow-inner overflow-x-auto min-w-full">
        
        {/* Superior */}
        <div className="flex gap-6 sm:gap-10 items-center justify-center min-w-fit pr-4">
          <div className="flex flex-col items-end gap-1">
            <span className="text-xs font-bold text-gray-400">1er Cuadrante</span>
            {renderQuadrant(TOOTH_NUMBERS.upperLeft)}
          </div>
          <div className="w-1 h-20 bg-gray-300 rounded-full"></div>
          <div className="flex flex-col items-start gap-1">
            <span className="text-xs font-bold text-gray-400">2do Cuadrante</span>
            {renderQuadrant(TOOTH_NUMBERS.upperRight)}
          </div>
        </div>

        {/* Horizontal Divider */}
        <div className="w-full max-w-3xl h-1 bg-gray-300 rounded-full mx-auto my-1"></div>

        {/* Inferior */}
        <div className="flex gap-6 sm:gap-10 items-center justify-center min-w-fit pr-4">
          <div className="flex flex-col items-end gap-1">
            {renderQuadrant(TOOTH_NUMBERS.lowerRight)}
            <span className="text-xs font-bold text-gray-400 mt-1">4to Cuadrante</span>
          </div>
          <div className="w-1 h-20 bg-gray-300 rounded-full"></div>
          <div className="flex flex-col items-start gap-1">
            {renderQuadrant(TOOTH_NUMBERS.lowerLeft)}
            <span className="text-xs font-bold text-gray-400 mt-1">3er Cuadrante</span>
          </div>
        </div>

      </div>

    </div>
  );
};
