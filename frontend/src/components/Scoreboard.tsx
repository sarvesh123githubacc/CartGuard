import React from 'react';
import { ShieldAlert, ShieldCheck, Activity } from 'lucide-react';
import { Attack } from '../types';

interface ScoreboardProps {
  attacks: Attack[];
  unprotectedResults: Record<string, boolean>; // attack_id -> attack_succeeded
  protectedResults: Record<string, boolean>;   // attack_id -> attack_succeeded
  onOpenStressDrawer: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  attacks,
  unprotectedResults,
  protectedResults,
  onOpenStressDrawer,
}) => {
  // Count succeeded attacks
  const unprotSucceededCount = Object.values(unprotectedResults).filter(Boolean).length;
  const protSucceededCount = Object.values(protectedResults).filter(Boolean).length;

  return (
    <div className="w-full bg-[#111820] border border-[#1E2A36] rounded-[12px] p-5">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#1E2A36]">
        <div>
          <h3 className="text-sm font-bold text-[#E6EDF3] font-sans">
            Benchmark Scoreboard — 10 Attack Defense Rates
          </h3>
          <p className="text-xs text-[#8B98A5]">
            Comparing indirect prompt injection exploit rates side by side
          </p>
        </div>

        <button
          onClick={onOpenStressDrawer}
          className="flex items-center gap-2 px-3.5 py-2 bg-[#151E28] hover:bg-[#1E2A36] border border-[#1E2A36] text-[#4CC9F0] text-xs font-mono font-medium rounded-[12px] transition-colors"
        >
          <Activity className="w-3.5 h-3.5 text-[#4CC9F0]" />
          <span>Policy Stress Test (200 Calls)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Unprotected Score Card */}
        <div className="p-4 rounded-[12px] bg-[#151E28] border border-[#1E2A36] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-[#F0616D]" />
              <span className="text-xs font-mono font-bold text-[#E6EDF3]">
                Unprotected Agent Exploits
              </span>
            </div>
            <span className="text-2xl font-bold font-mono text-[#F0616D]">
              {unprotSucceededCount} <span className="text-xs text-[#8B98A5] font-normal">/ {attacks.length}</span>
            </span>
          </div>

          {/* 10-Cell Strip */}
          <div className="grid grid-cols-10 gap-1.5 pt-2">
            {attacks.map((atk, index) => {
              const res = unprotectedResults[atk.id];
              // red = attack succeeded, green = defended/blocked, grey = pending
              let bg = 'bg-[#0B0F14] border-[#1E2A36] text-[#8B98A5]';
              if (res === true) {
                bg = 'bg-[#F0616D] border-[#F0616D] text-black font-bold';
              } else if (res === false) {
                bg = 'bg-[#3DDC97] border-[#3DDC97] text-black font-bold';
              }

              return (
                <div
                  key={atk.id}
                  className={`h-7 rounded flex items-center justify-center font-mono text-[10px] border transition-colors ${bg}`}
                  title={`#${index + 1}: ${atk.name} (${res === undefined ? 'Pending' : res ? 'Exploited' : 'Defended'})`}
                >
                  {index + 1}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#8B98A5] mt-2">
            <span>Red = Exploited</span>
            <span>Green = Defended</span>
            <span>Grey = Pending</span>
          </div>
        </div>

        {/* CartGuard Score Card */}
        <div className="p-4 rounded-[12px] bg-[#151E28] border border-[#1E2A36] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#3DDC97]" />
              <span className="text-xs font-mono font-bold text-[#E6EDF3]">
                CartGuard Compromised
              </span>
            </div>
            <span className="text-2xl font-bold font-mono text-[#3DDC97]">
              {protSucceededCount} <span className="text-xs text-[#8B98A5] font-normal">/ {attacks.length}</span>
            </span>
          </div>

          {/* 10-Cell Strip */}
          <div className="grid grid-cols-10 gap-1.5 pt-2">
            {attacks.map((atk, index) => {
              const res = protectedResults[atk.id];
              let bg = 'bg-[#0B0F14] border-[#1E2A36] text-[#8B98A5]';
              if (res === true) {
                bg = 'bg-[#F0616D] border-[#F0616D] text-black font-bold';
              } else if (res === false) {
                bg = 'bg-[#3DDC97] border-[#3DDC97] text-black font-bold';
              }

              return (
                <div
                  key={atk.id}
                  className={`h-7 rounded flex items-center justify-center font-mono text-[10px] border transition-colors ${bg}`}
                  title={`#${index + 1}: ${atk.name} (${res === undefined ? 'Pending' : res ? 'Exploited' : 'Defended'})`}
                >
                  {index + 1}
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono text-[#8B98A5] mt-2">
            <span>Red = Exploited</span>
            <span>Green = Defended</span>
            <span>Grey = Pending</span>
          </div>
        </div>
      </div>
    </div>
  );
};
