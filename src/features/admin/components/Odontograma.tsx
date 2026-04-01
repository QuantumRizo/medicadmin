import { useState } from 'react';

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
  onToothClick?: (toothNumber: number) => void;
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

/** Mapping of adult tooth number → primary (baby) tooth number (FDI standard). */
const PRIMARY_TOOTH_MAP: Record<number, number> = {
  11: 51, 12: 52, 13: 53, 14: 54, 15: 55,
  21: 61, 22: 62, 23: 63, 24: 64, 25: 65,
  31: 71, 32: 72, 33: 73, 34: 74, 35: 75,
  41: 81, 42: 82, 43: 83, 44: 84, 45: 85,
};

const getFill = (status: FaceStatus) => {
  if (status === 'caries') return '#ef4444';
  if (status === 'resina') return '#3b82f6';
  return '#ffffff';
};

const Tooth = ({
  number,
  data = DEFAULT_TOOTH_DATA,
  onFaceClick,
  onStatusToggle,
  onToothClick,
  highlighted,
  readonly,
}: {
  number: number;
  data?: any;
  onFaceClick: (face: ToothFace, number: number) => void;
  onStatusToggle: (number: number) => void;
  onToothClick?: (n: number) => void;
  highlighted?: boolean;
  readonly?: boolean;
}) => {
  const isAbsent = data.status === 'ausente';
  const isEndo = data.status === 'endodoncia';
  const isImplante = data.status === 'implante';
  const primaryNum = PRIMARY_TOOTH_MAP[number];

  return (
    <div
      className={`flex flex-col items-center justify-center gap-0.5 group rounded-md transition-all ${highlighted ? 'ring-2 ring-[#1c334a] ring-offset-1 bg-blue-50/40' : ''}`}
      onClick={() => onToothClick?.(number)}
    >
      <span className="text-[11px] font-bold text-gray-600 leading-none">{number}</span>
      {primaryNum && (
        <span className="text-[9px] font-medium text-indigo-500 leading-none">{primaryNum}</span>
      )}
      <div
        className="relative cursor-pointer transition-transform hover:scale-110"
        onContextMenu={(e) => {
          e.preventDefault();
          if (!readonly) onStatusToggle(number);
        }}
        title="Clic izquierdo: cambiar cara. Clic derecho: estado del diente."
      >
        <svg fill="none" width="50" height="50" viewBox="0 0 40 40" className="drop-shadow-sm bg-white" style={{ borderRadius: 5 }}>
          <polygon points="0,0 40,0 28,12 12,12" fill={getFill(data.faces.top)} stroke="#9ca3af" strokeWidth="1"
            className="hover:stroke-[#1c334a] hover:stroke-2 transition-all duration-200"
            onClick={(e) => { e.stopPropagation(); !readonly && onFaceClick('top', number); }} />
          <polygon points="0,40 40,40 28,28 12,28" fill={getFill(data.faces.bottom)} stroke="#9ca3af" strokeWidth="1"
            className="hover:stroke-[#1c334a] hover:stroke-2 transition-all duration-200"
            onClick={(e) => { e.stopPropagation(); !readonly && onFaceClick('bottom', number); }} />
          <polygon points="0,0 12,12 12,28 0,40" fill={getFill(data.faces.left)} stroke="#9ca3af" strokeWidth="1"
            className="hover:stroke-[#1c334a] hover:stroke-2 transition-all duration-200"
            onClick={(e) => { e.stopPropagation(); !readonly && onFaceClick('left', number); }} />
          <polygon points="40,0 28,12 28,28 40,40" fill={getFill(data.faces.right)} stroke="#9ca3af" strokeWidth="1"
            className="hover:stroke-[#1c334a] hover:stroke-2 transition-all duration-200"
            onClick={(e) => { e.stopPropagation(); !readonly && onFaceClick('right', number); }} />
          <rect x="12" y="12" width="16" height="16" fill={getFill(data.faces.center)} stroke="#9ca3af" strokeWidth="1"
            className="hover:stroke-[#1c334a] hover:stroke-2 transition-all duration-200"
            onClick={(e) => { e.stopPropagation(); !readonly && onFaceClick('center', number); }} />

          {isEndo && <circle cx="20" cy="20" r="16" fill="none" stroke="#dc2626" strokeWidth="4" className="pointer-events-none opacity-90" />}
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

const ToothRow = ({
  numbers, value, onFaceClick, onStatusToggle, onToothClick, highlightedTooth, readonly,
}: {
  numbers: number[];
  value: OdontogramData;
  onFaceClick: (face: ToothFace, number: number) => void;
  onStatusToggle: (number: number) => void;
  onToothClick?: (n: number) => void;
  highlightedTooth?: number | null;
  readonly?: boolean;
}) => (
  <div className="flex gap-1.5">
    {numbers.map(n => (
      <Tooth
        key={n}
        number={n}
        data={value[n]}
        onFaceClick={onFaceClick}
        onStatusToggle={onStatusToggle}
        onToothClick={onToothClick}
        highlighted={highlightedTooth === n}
        readonly={readonly}
      />
    ))}
  </div>
);

export const Odontograma = ({ value = {}, onChange, onToothClick, readonly = false }: OdontogramaProps) => {
  const [activeFaceStatus, setActiveFaceStatus] = useState<FaceStatus>('caries');
  const [highlightedTooth, setHighlightedTooth] = useState<number | null>(null);

  const handleFaceClick = (face: ToothFace, number: number) => {
    if (readonly) return;
    const currentTooth = value[number] || DEFAULT_TOOTH_DATA;
    const currentFaceStatus = currentTooth.faces[face];
    const newStatus = currentFaceStatus === activeFaceStatus ? 'sano' : activeFaceStatus;
    onChange?.({ ...value, [number]: { ...currentTooth, faces: { ...currentTooth.faces, [face]: newStatus } } });
  };

  const handleStatusToggle = (number: number) => {
    if (readonly) return;
    const currentTooth = value[number] || DEFAULT_TOOTH_DATA;
    const statusCycle: Record<FullStatus, FullStatus> = {
      presente: 'ausente', ausente: 'endodoncia', endodoncia: 'implante', implante: 'presente'
    };
    onChange?.({ ...value, [number]: { ...currentTooth, status: statusCycle[currentTooth.status] } });
  };

  const handleToothClick = (n: number) => {
    setHighlightedTooth(prev => prev === n ? null : n);
    onToothClick?.(n);
  };

  const sharedProps = {
    value,
    onFaceClick: handleFaceClick,
    onStatusToggle: handleStatusToggle,
    onToothClick: handleToothClick,
    highlightedTooth,
    readonly,
  };

  return (
    <div className="flex flex-col gap-3 font-sans">

      {/* Toolbar */}
      {!readonly && (
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-gray-50 p-3 rounded-lg border border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Herramienta:</span>
            <div className="flex gap-1 bg-white p-1 rounded-lg border shadow-sm">
              <button
                onClick={() => setActiveFaceStatus('caries')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeFaceStatus === 'caries'
                    ? 'bg-gray-100 ring-2 ring-[#1c334a] text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-red-500 shrink-0" />
                Caries
              </button>
              <button
                onClick={() => setActiveFaceStatus('resina')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeFaceStatus === 'resina'
                    ? 'bg-gray-100 ring-2 ring-[#1c334a] text-gray-800 shadow-sm'
                    : 'text-gray-500 hover:bg-gray-50'
                }`}
              >
                <span className="w-3 h-3 rounded-full bg-blue-500 shrink-0" />
                Amalgama / Resina
              </button>
            </div>
          </div>
          <div className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
            <strong className="text-gray-600">Click der:</strong> Ausente / Endo / Implante
            {highlightedTooth && (
              <span className="ml-3 text-[#1c334a] font-bold">· Diente {highlightedTooth} seleccionado</span>
            )}
          </div>
        </div>
      )}

      {/* Odontogram Grid */}
      <div className="flex flex-col gap-3 items-center py-4 px-6 bg-[#f8fafc] rounded-xl border border-gray-200 shadow-inner overflow-x-auto">

        {/* ═══ SUPERIOR (Q1 + Q2) ═══ */}
        <div className="flex gap-6 sm:gap-14 items-end justify-center min-w-fit">
          {/* Q1 */}
          <div className="flex flex-col items-end gap-0.5">
            <span className="text-[10px] font-bold text-gray-400 self-start mb-0.5">1er Cuadrante</span>
            <ToothRow numbers={[18, 17, 16, 15]} {...sharedProps} />
            <div className="flex justify-end w-full">
              <ToothRow numbers={[14, 13, 12, 11]} {...sharedProps} />
            </div>
          </div>
          <div className="w-px h-24 bg-gray-400 rounded-full self-end mb-1" />
          {/* Q2 */}
          <div className="flex flex-col items-start gap-0.5">
            <span className="text-[10px] font-bold text-gray-400 self-end mb-0.5">2do Cuadrante</span>
            <ToothRow numbers={[25, 26, 27, 28]} {...sharedProps} />
            <div className="flex justify-start w-full">
              <ToothRow numbers={[21, 22, 23, 24]} {...sharedProps} />
            </div>
          </div>
        </div>

        {/* Horizontal midline */}
        <div className="w-full max-w-4xl h-px bg-gray-400 rounded-full mx-auto my-1" />

        {/* ═══ INFERIOR (Q4 + Q3) ═══ */}
        <div className="flex gap-6 sm:gap-14 items-start justify-center min-w-fit">
          {/* Q4 */}
          <div className="flex flex-col items-end gap-0.5">
            <div className="flex justify-end w-full">
              <ToothRow numbers={[44, 43, 42, 41]} {...sharedProps} />
            </div>
            <ToothRow numbers={[48, 47, 46, 45]} {...sharedProps} />
            <span className="text-[10px] font-bold text-gray-400 self-start mt-0.5">4to Cuadrante</span>
          </div>
          <div className="w-px h-24 bg-gray-400 rounded-full self-start mt-1" />
          {/* Q3 */}
          <div className="flex flex-col items-start gap-0.5">
            <div className="flex justify-start w-full">
              <ToothRow numbers={[31, 32, 33, 34]} {...sharedProps} />
            </div>
            <ToothRow numbers={[35, 36, 37, 38]} {...sharedProps} />
            <span className="text-[10px] font-bold text-gray-400 self-end mt-0.5">3er Cuadrante</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-5 mt-1 text-[10px] text-gray-400 font-medium">
          <span className="text-indigo-400 font-semibold">Núm. en índigo = diente temporal (niño)</span>
          <span>·</span>
          <span>Rojo = Caries</span>
          <span>·</span>
          <span>Azul = Resina</span>
        </div>

      </div>
    </div>
  );
};
