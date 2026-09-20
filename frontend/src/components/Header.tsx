import React from 'react';
import { Shield, Cpu, FileCode, Play, RotateCcw } from 'lucide-react';

interface HeaderProps {
  modelName: string;
  policyCount: number;
  isReplay: boolean;
  onToggleReplay: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  modelName,
  policyCount,
  isReplay,
  onToggleReplay,
}) => {
  return (
    <header className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 px-6 bg-[#111820] border border-[#1E2A36] rounded-[12px] shadow-sm">
      <div className="flex items-center gap-3.5">
        <div className="w-10 h-10 rounded-[12px] bg-[#151E28] border border-[#1E2A36] flex items-center justify-center text-[#4CC9F0]">
          <Shield className="w-5 h-5 text-[#4CC9F0]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-[#E6EDF3] font-sans">
              CartGuard
            </h1>
            <span className="text-[10px] uppercase font-mono font-medium px-2 py-0.5 rounded-[12px] bg-[#151E28] border border-[#1E2A36] text-[#4CC9F0]">
              v1.0 Local
            </span>
          </div>
          <p className="text-xs text-[#8B98A5]">A firewall for shopping agents</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        {/* Model Chip */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-[#151E28] border border-[#1E2A36] text-xs font-mono text-[#E6EDF3]">
          <Cpu className="w-3.5 h-3.5 text-[#4CC9F0]" />
          <span>{modelName || 'llama3.1:8b'}</span>
        </div>

        {/* Cedar Policy Count Chip */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] bg-[#151E28] border border-[#1E2A36] text-xs font-mono text-[#E6EDF3]">
          <FileCode className="w-3.5 h-3.5 text-[#3DDC97]" />
          <span>{policyCount} Cedar Policies</span>
        </div>

        {/* Live / Replay Toggle */}
        <button
          onClick={onToggleReplay}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-[12px] border text-xs font-medium transition-colors duration-200 ${
            isReplay
              ? 'bg-[#F5B84B]/10 border-[#F5B84B]/40 text-[#F5B84B]'
              : 'bg-[#3DDC97]/10 border-[#3DDC97]/40 text-[#3DDC97]'
          }`}
          title={isReplay ? "Switch to Live Inference Mode" : "Switch to Replay Mode"}
        >
          {isReplay ? (
            <>
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="font-mono">REPLAY MODE</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span className="font-mono">LIVE MODE</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
