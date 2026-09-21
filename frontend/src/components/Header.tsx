import { Shield, Cpu, FileCode, Play, RotateCcw, Bot } from 'lucide-react';
import { RunType } from '../types';

interface HeaderProps {
  modelName: string;
  policyCount: number;
  runType: RunType;
  onSelectRunType: (rt: RunType) => void;
}

export const Header: React.FC<HeaderProps> = ({
  modelName,
  policyCount,
  runType,
  onSelectRunType,
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

        {/* 3 Run Types Selector */}
        <div className="flex items-center rounded-[12px] bg-[#0B0F14] border border-[#1E2A36] p-0.5">
          <button
            onClick={() => onSelectRunType('simulated')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-xs font-mono transition-colors ${
              runType === 'simulated'
                ? 'bg-[#F0616D]/20 text-[#F0616D] border border-[#F0616D]/50 font-bold'
                : 'text-[#8B98A5] hover:text-[#E6EDF3]'
            }`}
            title="Simulated: worst case, agent fully compromised (scripted tool execution)"
          >
            <Bot className="w-3 h-3" />
            <span>Simulated Compromised</span>
          </button>

          <button
            onClick={() => onSelectRunType('replay')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-xs font-mono transition-colors ${
              runType === 'replay'
                ? 'bg-[#F5B84B]/20 text-[#F5B84B] border border-[#F5B84B]/50 font-bold'
                : 'text-[#8B98A5] hover:text-[#E6EDF3]'
            }`}
            title="Replay recorded demo dataset"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Replay</span>
          </button>

          <button
            onClick={() => onSelectRunType('live')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] text-xs font-mono transition-colors ${
              runType === 'live'
                ? 'bg-[#3DDC97]/20 text-[#3DDC97] border border-[#3DDC97]/50 font-bold'
                : 'text-[#8B98A5] hover:text-[#E6EDF3]'
            }`}
            title="Live Ollama model inference"
          >
            <Play className="w-3 h-3 fill-current" />
            <span>Live Model</span>
          </button>
        </div>
      </div>
    </header>
  );
};
