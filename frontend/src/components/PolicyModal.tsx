import React from 'react';
import { X, FileCode } from 'lucide-react';
import { CEDAR_POLICIES } from '../cedarPolicies';
import { CedarLogEntry } from '../types';

interface PolicyModalProps {
  entry: CedarLogEntry | null;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ entry, onClose }) => {
  if (!entry) return null;

  const ruleDef = CEDAR_POLICIES[entry.rule] || {
    id: entry.rule,
    name: entry.rule,
    policyDsl: `// Cedar Rule: @id("${entry.rule}")\n// Deterministically evaluated by cedarpy engine.`,
    explanation: entry.reason,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-[#111820] border border-[#1E2A36] rounded-[12px] p-6 shadow-2xl animate-in fade-in duration-200">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E2A36]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-[12px] bg-[#151E28] border border-[#1E2A36] text-[#4CC9F0]">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#E6EDF3] font-sans">
                Cedar Policy Inspection
              </h3>
              <p className="text-xs font-mono text-[#4CC9F0]">@id("{entry.rule}")</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8B98A5] hover:text-[#E6EDF3] hover:bg-[#151E28] rounded-[12px] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <span className="text-[10px] font-mono uppercase text-[#8B98A5] block mb-1">
              Rule Title & Rationale
            </span>
            <div className="text-xs text-[#E6EDF3] font-medium">{ruleDef.name}</div>
            <p className="text-xs text-[#8B98A5] mt-1 leading-relaxed">{ruleDef.explanation}</p>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase text-[#8B98A5] block mb-1">
              Evaluated Policy DSL (AWS Cedar Syntax)
            </span>
            <pre className="p-4 rounded-[12px] bg-[#0B0F14] border border-[#1E2A36] text-xs font-mono text-[#3DDC97] overflow-x-auto leading-relaxed whitespace-pre-wrap">
              {ruleDef.policyDsl}
            </pre>
          </div>

          <div className="p-3 rounded-[12px] bg-[#151E28] border border-[#1E2A36] text-xs text-[#8B98A5] flex items-center justify-between">
            <span className="font-mono">Authorization Decision:</span>
            <span
              className={`px-2 py-0.5 rounded font-mono font-bold text-xs ${
                entry.decision === 'DENY'
                  ? 'bg-[#F0616D]/15 text-[#F0616D] border border-[#F0616D]/30'
                  : 'bg-[#3DDC97]/15 text-[#3DDC97] border border-[#3DDC97]/30'
              }`}
            >
              {entry.decision}
            </span>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-[#1E2A36] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#151E28] hover:bg-[#1E2A36] border border-[#1E2A36] text-[#E6EDF3] text-xs font-mono rounded-[12px] transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
