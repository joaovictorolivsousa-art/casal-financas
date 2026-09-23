"use client";
import { useState } from "react";

interface DistributionSliderProps {
  savePercentage: number;
  onChange: (savePct: number, leisurePct: number) => void;
  readOnly?: boolean;
}

const PRESETS = [
  { label: "60/40", save: 60 },
  { label: "50/50", save: 50 },
  { label: "70/30", save: 70 },
  { label: "80/20", save: 80 },
];

/**
 * Slider + presets para configurar a distribuição Guardar/Lazer.
 * Garante matematicamente que a soma sempre seja 100%.
 */
export function DistributionSlider({ savePercentage, onChange, readOnly }: DistributionSliderProps) {
  const [localSave, setLocalSave] = useState(savePercentage);

  function handleChange(value: number) {
    setLocalSave(value);
    onChange(value, 100 - value);
  }

  return (
    <div className={readOnly ? "opacity-70 pointer-events-none" : ""}>
      <div className="flex justify-between text-sm font-medium mb-2">
        <span className="text-emerald-700">Guardar/Investir: {localSave}%</span>
        <span className="text-amber-700">Lazer/Livre: {100 - localSave}%</span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={localSave}
        disabled={readOnly}
        onChange={(e) => handleChange(Number(e.target.value))}
        className="w-full accent-emerald-600"
      />

      {!readOnly && (
        <div className="flex flex-wrap gap-2 mt-3">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => handleChange(p.save)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                localSave === p.save
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
