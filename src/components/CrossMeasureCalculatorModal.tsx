import React, { useState } from 'react';
import {
  X,
  Compass,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  Info,
} from 'lucide-react';

interface CrossMeasureCalculatorModalProps {
  onClose: () => void;
  onInsertToNotes?: (text: string) => void;
  initialMeasurements?: {
    sideA?: number;
    sideB?: number;
    diagonal?: number;
  };
  onSaveMeasurements?: (measurements: { sideA: number; sideB: number; diagonal: number }) => void;
}

export const CrossMeasureCalculatorModal: React.FC<CrossMeasureCalculatorModalProps> = ({
  onClose,
  onInsertToNotes,
  initialMeasurements,
  onSaveMeasurements,
}) => {
  // Mode: 'PYTHAGORAS' | 'THREE_FOUR_FIVE'
  const [activeTab, setActiveTab] = useState<'PYTHAGORAS' | 'THREE_FOUR_FIVE'>('PYTHAGORAS');

  // Pythagoras states
  const [sideA, setSideA] = useState<string>(
    initialMeasurements?.sideA ? String(initialMeasurements.sideA) : '12.00'
  ); // Längd i meter
  const [sideB, setSideB] = useState<string>(
    initialMeasurements?.sideB ? String(initialMeasurements.sideB) : '8.00'
  ); // Bredd i meter
  const [measuredD1, setMeasuredD1] = useState<string>(
    initialMeasurements?.diagonal ? String(initialMeasurements.diagonal) : '14.42'
  ); // Uppmätt D1
  const [measuredD2, setMeasuredD2] = useState<string>(
    initialMeasurements?.diagonal ? String(initialMeasurements.diagonal) : '14.42'
  ); // Uppmätt D2
  const [copied, setCopied] = useState(false);
  const [savedToProject, setSavedToProject] = useState(false);

  // 3-4-5 states
  const [multiplier, setMultiplier] = useState<string>('1'); // 1 = 3-4-5m, 2 = 6-8-10m, 3 = 9-12-15m

  // Calculations
  const a = parseFloat(sideA) || 0;
  const b = parseFloat(sideB) || 0;
  const theoreticalDiagonal = a > 0 && b > 0 ? Math.sqrt(a * a + b * b) : 0;
  const theoreticalMm = Math.round(theoreticalDiagonal * 1000);

  const d1 = parseFloat(measuredD1) || 0;
  const d2 = parseFloat(measuredD2) || 0;
  const hasMeasured = d1 > 0 && d2 > 0;
  const diffMm = hasMeasured ? Math.round(Math.abs(d1 - d2) * 1000) : 0;
  const isWithinTolerance = hasMeasured && diffMm <= 5; // Max 5 mm tolerans enligt AMA Hus/Anläggning

  // 3-4-5 calculation
  const mult = parseFloat(multiplier) || 1;
  const side1_345 = (3 * mult).toFixed(2);
  const side2_345 = (4 * mult).toFixed(2);
  const hypotenuse_345 = (5 * mult).toFixed(2);

  const handleCopySummary = () => {
    let summary = '';
    if (activeTab === 'PYTHAGORAS') {
      summary = `Kryssmåttsberäkning (Pythagoras):
Längd (A): ${a.toFixed(2)} m | Bredd (B): ${b.toFixed(2)} m
Teoretisk diagonal: ${theoreticalDiagonal.toFixed(3)} m (${theoreticalMm} mm)
Uppmätt D1: ${d1.toFixed(3)} m | Uppmätt D2: ${d2.toFixed(3)} m
Differens: ${diffMm} mm -> ${isWithinTolerance ? 'GODKÄND (Tolerans max ±5 mm)' : 'JUSTERING KRÄVS'}`;
    } else {
      summary = `3-4-5 Rätvinkelmätning:
Bas 1: ${side1_345} m | Bas 2: ${side2_345} m | Kryssmått (hypotenusa): ${hypotenuse_345} m`;
    }

    if (onInsertToNotes) {
      onInsertToNotes(summary);
    }
    navigator.clipboard?.writeText(summary);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md overflow-y-auto"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-[#10131c] border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="bg-[#141824] border-b border-slate-800 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <Compass className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-tight">
                Kryssmåttsberäknare & 3-4-5
              </h3>
              <p className="text-xs text-slate-400">
                Säkerställ 90° vinkelräthet och kontrollmät diagonalerna enligt AMA
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
            title="Stäng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab selection */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950 border-b border-slate-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('PYTHAGORAS')}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'PYTHAGORAS'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1. Diagonal & Toleranskontroll (Pythagoras)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('THREE_FOUR_FIVE')}
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              activeTab === 'THREE_FOUR_FIVE'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2. 3-4-5-metoden i fält
          </button>
        </div>

        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'PYTHAGORAS' ? (
            <div className="space-y-4">
              {/* Dimension inputs */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Grundens eller schaktens mått:
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Längd A (meter)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={sideA}
                      onChange={(e) => setSideA(e.target.value)}
                      placeholder="t.ex. 12.00"
                      className="w-full min-h-[44px] px-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold text-base focus:border-amber-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Bredd B (meter)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={sideB}
                      onChange={(e) => setSideB(e.target.value)}
                      placeholder="t.ex. 8.00"
                      className="w-full min-h-[44px] px-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono font-bold text-base focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>

                {/* Theoretical Diagonal Output Box */}
                <div className="p-3 bg-amber-500/10 border border-amber-500/40 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-xs text-amber-300/90 font-medium block">
                      Teoretiskt kryssmått (diagonal):
                    </span>
                    <strong className="text-xl sm:text-2xl font-mono font-black text-amber-400">
                      {theoreticalDiagonal.toFixed(3)} m
                    </strong>
                  </div>
                  <div className="text-right font-mono text-xs text-amber-300">
                    <span className="block font-bold">{theoreticalMm} mm</span>
                    <span className="text-[11px] text-slate-400">√(A² + B²)</span>
                  </div>
                </div>
              </div>

              {/* Visual Diagram */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-center relative overflow-hidden">
                <svg className="w-full h-32 mx-auto max-w-sm" viewBox="0 0 300 120">
                  {/* Rectangle */}
                  <rect
                    x="30"
                    y="15"
                    width="240"
                    height="90"
                    fill="none"
                    stroke="#475569"
                    strokeWidth="2.5"
                    rx="4"
                  />
                  {/* Diagonal D1 */}
                  <line
                    x1="30"
                    y1="15"
                    x2="270"
                    y2="105"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  {/* Diagonal D2 */}
                  <line
                    x1="30"
                    y1="105"
                    x2="270"
                    y2="15"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeDasharray="4 3"
                  />
                  {/* Labels */}
                  <text x="150" y="10" fill="#94a3b8" fontSize="10" textAnchor="middle">
                    Längd A: {a} m
                  </text>
                  <text x="15" y="65" fill="#94a3b8" fontSize="10" textAnchor="middle">
                    B: {b} m
                  </text>
                  <text x="110" y="55" fill="#f59e0b" fontSize="11" fontWeight="bold">
                    D1
                  </text>
                  <text x="180" y="55" fill="#38bdf8" fontSize="11" fontWeight="bold">
                    D2
                  </text>
                  {/* 90 deg corner indicator */}
                  <path d="M 30 25 L 40 25 L 40 15" fill="none" stroke="#22c55e" strokeWidth="1.5" />
                </svg>
                <span className="text-[11px] text-slate-400 block mt-1">
                  Om D1 och D2 är lika långa är grunden exakt rätvinklig (90° i alla fyra hörn).
                </span>
              </div>

              {/* Field Verification Check (Uppmätta mått) */}
              <div className="bg-[#121622] p-4 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  Kontrollmätning i fält (Dina uppmätta mått med stålband):
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-amber-400 mb-1">
                      Uppmätt Diagonal 1 (meter)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={measuredD1}
                      onChange={(e) => setMeasuredD1(e.target.value)}
                      placeholder="t.ex. 14.425"
                      className="w-full min-h-[44px] px-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold text-base focus:border-amber-400 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-sky-400 mb-1">
                      Uppmätt Diagonal 2 (meter)
                    </label>
                    <input
                      type="number"
                      step="0.001"
                      value={measuredD2}
                      onChange={(e) => setMeasuredD2(e.target.value)}
                      placeholder="t.ex. 14.422"
                      className="w-full min-h-[44px] px-3 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono font-bold text-base focus:border-sky-400 outline-none"
                    />
                  </div>
                </div>

                {/* Tolerance Result */}
                {hasMeasured && (
                  <div
                    className={`p-3.5 rounded-xl border flex items-center justify-between ${
                      isWithinTolerance
                        ? 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200'
                        : 'bg-rose-950/60 border-rose-500/60 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {isWithinTolerance ? (
                        <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0" />
                      )}
                      <div>
                        <div className="font-bold text-sm">
                          Differens: {diffMm} mm
                        </div>
                        <div className="text-xs opacity-90">
                          {isWithinTolerance
                            ? 'GODKÄND rätvinklighet enligt AMA (Tolerans max ±5 mm)'
                            : `UNDERKÄND – diffar ${diffMm} mm. Justera hörnet för den längre diagonalen inåt med ${Math.round(diffMm / 2)} mm.`}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* 3-4-5 METODEN */
            <div className="space-y-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  3-4-5 Metoden för rät vinkel i fält
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  En rätvinklig triangel har alltid förhållandet 3 : 4 : 5. Mät 3 meter längs ena snöret, 4 meter längs andra snöret – då MÅSTE avståndet mellan märkena vara exakt 5 meter!
                </p>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Välj multiplikator för längre väggar:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setMultiplier('1')}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold cursor-pointer ${
                        multiplier === '1'
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      3 - 4 - 5 m
                    </button>
                    <button
                      type="button"
                      onClick={() => setMultiplier('2')}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold cursor-pointer ${
                        multiplier === '2'
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      6 - 8 - 10 m
                    </button>
                    <button
                      type="button"
                      onClick={() => setMultiplier('3')}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold cursor-pointer ${
                        multiplier === '3'
                          ? 'bg-amber-500 text-slate-950 border-amber-400'
                          : 'bg-slate-900 border-slate-800 text-slate-300'
                      }`}
                    >
                      9 - 12 - 15 m
                    </button>
                  </div>
                </div>

                {/* Values table */}
                <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Katet 1 (Längs bas):</span>
                    <strong className="text-lg font-mono text-white">{side1_345} m</strong>
                  </div>
                  <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                    <span className="text-[11px] text-slate-400 block">Katet 2 (Vinkelrät):</span>
                    <strong className="text-lg font-mono text-white">{side2_345} m</strong>
                  </div>
                  <div className="p-3 bg-amber-500/15 border border-amber-500/40 rounded-xl">
                    <span className="text-[11px] text-amber-300 block font-semibold">Hypotenusa:</span>
                    <strong className="text-lg font-mono text-amber-400 font-bold">{hypotenuse_345} m</strong>
                  </div>
                </div>
              </div>

              {/* Step-by-step instructions */}
              <div className="bg-[#121622] p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                <span className="font-bold text-amber-400 uppercase tracking-wider block">
                  Så gör du i praktiken:
                </span>
                <ol className="list-decimal pl-4 space-y-1.5 text-slate-300">
                  <li>Spänn upp ditt bas-profilsnöre (långsidan på huset).</li>
                  <li>Mät upp {side1_345} meter från hörnet och sätt en tejpbit på snöret.</li>
                  <li>Spänn upp kortsidans profilsnöre i ungefär 90 graders vinkel.</li>
                  <li>Mät upp {side2_345} meter på kortsidans snöre och sätt en tejpbit.</li>
                  <li>Dra stålbandet diagonalt mellan de två tejpbitarna. Justera kortsidans snöre tills måttet är exakt <strong>{hypotenuse_345} meter</strong>!</li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer with Save / Copy buttons */}
        <div className="bg-[#141824] border-t border-slate-800 p-3 sm:p-4 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {onSaveMeasurements && (
              <button
                type="button"
                onClick={() => {
                  const diag =
                    activeTab === 'PYTHAGORAS'
                      ? Math.round(theoreticalDiagonal * 100) / 100
                      : parseFloat(hypotenuse_345);
                  const sA = activeTab === 'PYTHAGORAS' ? a : parseFloat(side1_345);
                  const sB = activeTab === 'PYTHAGORAS' ? b : parseFloat(side2_345);
                  onSaveMeasurements({ sideA: sA, sideB: sB, diagonal: diag });
                  setSavedToProject(true);
                  setTimeout(() => setSavedToProject(false), 2500);
                }}
                className="px-4 py-2.5 bg-orange-500 hover:bg-orange-400 active:scale-95 text-black font-black text-xs sm:text-sm rounded-xl flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-orange-500/20"
              >
                {savedToProject ? <Check className="w-4 h-4 stroke-[3]" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{savedToProject ? 'Sparat till övningen!' : 'Spara kryssmått till övningen'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleCopySummary}
              className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl flex items-center gap-2 cursor-pointer transition-all border border-slate-700"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400 stroke-[3]" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Kopierat!' : 'Kopiera text'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl cursor-pointer"
          >
            Stäng
          </button>
        </div>
      </div>
    </div>
  );
};
