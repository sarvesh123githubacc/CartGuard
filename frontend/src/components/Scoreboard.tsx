import React from 'react';
import { ShieldAlert, ShieldCheck, Activity, Bot } from 'lucide-react';
import { Attack } from '../types';

interface ScoreboardProps {
  attacks: Attack[];
  unprotectedResults: Record<string, boolean>; // attack_id -> attack_succeeded (Live / Replay)
  protectedResults: Record<string, boolean>;   // attack_id -> attack_succeeded (Live / Replay)
  simulatedUnprotectedResults: Record<string, boolean>; // attack_id -> attack_succeeded (Simulated)
  simulatedProtectedResults: Record<string, boolean>;   // attack_id -> attack_succeeded (Simulated)
  onOpenStressDrawer: () => void;
}

export const Scoreboard: React.FC<ScoreboardProps> = ({
  attacks,
  unprotectedResults,
  protectedResults,
  simulatedUnprotectedResults,
  simulatedProtectedResults,
  onOpenStressDrawer,
}) => {
  // Live / Replay counts
  const unprotSucceededCount = Object.values(unprotectedResults).filter(Boolean).length;
  const protSucceededCount = Object.values(protectedResults).filter(Boolean).length;

  // Simulated compromised agent counts
  const simUnprotCount = Object.values(simulatedUnprotectedResults).filter(Boolean).length;
  const simProtCount = Object.values(simulatedProtectedResults).filter(Boolean).length;

  return (
    <div className="w-full flex flex-col gap-6">
      {/* SECTION 1: LIVE MODEL BENCHMARK */}
      <div className="w-full bg-[#111820] border border-[#1E2A36] rounded-[12px] p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#1E2A36]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-[#E6EDF3] font-sans">
                Live Model Benchmark — 10 Adversarial Scenarios
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#4CC9F0]/10 border border-[#4CC9F0]/30 text-[#4CC9F0]">
                Ollama / Replay
              </span>
            </div>
            <p className="text-xs text-[#8B98A5] mt-0.5">
              Live model reasoning under indirect prompt injection vs Quarantined Reader & Cedar
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
                    title={`#${index + 1}: ${atk.name} (${res === undefined ? 'Pending' : res ? 'Exploited' : 'Resisted'})`}
                  >
                    {index + 1}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#8B98A5] mt-2">
              <span>Red = Exploited</span>
              <span>Green = Resisted</span>
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
                    title={`#${index + 1}: ${atk.name} (${res === undefined ? 'Pending' : res ? 'Compromised' : 'Defended'})`}
                  >
                    {index + 1}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#8B98A5] mt-2">
              <span>Red = Compromised</span>
              <span>Green = Defended</span>
              <span>Grey = Pending</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: SIMULATED COMPROMISED AGENT (KEPT COMPLETELY SEPARATE) */}
      <div className="w-full bg-[#111820] border-2 border-[#F0616D]/30 rounded-[12px] p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 mb-4 border-b border-[#1E2A36]">
          <div>
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-[#F0616D]" />
              <h3 className="text-sm font-bold text-[#E6EDF3] font-sans">
                Simulated: worst case, agent fully compromised
              </h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#F0616D]/15 border border-[#F0616D]/40 text-[#F0616D] font-bold">
                Scripted Attacker Actions
              </span>
            </div>
            <p className="text-xs text-[#8B98A5] mt-0.5">
              Deterministic adversary executing malicious tool calls directly, testing whether Cedar policies block worst-case compromised agents.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Simulated Unprotected Card */}
          <div className="p-4 rounded-[12px] bg-[#151E28] border border-[#1E2A36] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-[#F0616D]" />
                <span className="text-xs font-mono font-bold text-[#E6EDF3]">
                  Simulated Unprotected Exploits
                </span>
              </div>
              <span className="text-2xl font-bold font-mono text-[#F0616D]">
                {simUnprotCount} <span className="text-xs text-[#8B98A5] font-normal">/ {attacks.length}</span>
              </span>
            </div>

            {/* 10-Cell Strip */}
            <div className="grid grid-cols-10 gap-1.5 pt-2">
              {attacks.map((atk, index) => {
                const res = simulatedUnprotectedResults[atk.id];
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
                    title={`#${index + 1}: ${atk.name} (${res === undefined ? 'Pending' : res ? 'Exploited' : 'Blocked'})`}
                  >
                    {index + 1}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#8B98A5] mt-2">
              <span>Red = Exploited</span>
              <span>Green = Blocked</span>
              <span>Grey = Pending</span>
            </div>
          </div>

          {/* Simulated CartGuard Protected Card */}
          <div className="p-4 rounded-[12px] bg-[#151E28] border border-[#1E2A36] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#3DDC97]" />
                <span className="text-xs font-mono font-bold text-[#E6EDF3]">
                  Simulated CartGuard Compromised
                </span>
              </div>
              <span className="text-2xl font-bold font-mono text-[#3DDC97]">
                {simProtCount} <span className="text-xs text-[#8B98A5] font-normal">/ {attacks.length}</span>
              </span>
            </div>

            {/* 10-Cell Strip */}
            <div className="grid grid-cols-10 gap-1.5 pt-2">
              {attacks.map((atk, index) => {
                const res = simulatedProtectedResults[atk.id];
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
                    title={`#${index + 1}: ${atk.name} (${res === undefined ? 'Pending' : res ? 'Compromised' : 'Defended by Cedar'})`}
                  >
                    {index + 1}
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[10px] font-mono text-[#8B98A5] mt-2">
              <span>Red = Compromised</span>
              <span>Green = Defended by Cedar</span>
              <span>Grey = Pending</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
