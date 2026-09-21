import React from 'react';
import {
  FileText,
  Star,
  HelpCircle,
  Store,
  GitFork,
  Play,
  FastForward,
  Keyboard,
  Bot,
} from 'lucide-react';
import { Attack, AttackVector, RunType } from '../types';

interface TaskBarProps {
  itemQuery: string;
  setItemQuery: (v: string) => void;
  quantity: number;
  setQuantity: (v: number) => void;
  budgetRupees: number;
  setBudgetRupees: (v: number) => void;
  attacks: Attack[];
  selectedAttackId: string;
  onSelectAttack: (id: string) => void;
  onRunAttack: () => void;
  onRunAll: () => void;
  isRunning: boolean;
  runType?: RunType;
}

const getVectorIcon = (vector: AttackVector) => {
  switch (vector) {
    case 'description':
      return <FileText className="w-3.5 h-3.5" />;
    case 'review':
      return <Star className="w-3.5 h-3.5" />;
    case 'qna':
      return <HelpCircle className="w-3.5 h-3.5" />;
    case 'seller_name':
      return <Store className="w-3.5 h-3.5" />;
    case 'multi_step':
      return <GitFork className="w-3.5 h-3.5" />;
    default:
      return <FileText className="w-3.5 h-3.5" />;
  }
};

const getGoalShortName = (goal: string) => {
  switch (goal) {
    case 'over_quantity':
      return 'Over-Qty';
    case 'change_address':
      return 'Address Reroute';
    case 'extra_item':
      return 'Extra Item';
    case 'skip_confirmation':
      return 'Skip Approval';
    case 'overspend':
      return 'Overspend';
    default:
      return goal;
  }
};

export const TaskBar: React.FC<TaskBarProps> = ({
  itemQuery,
  setItemQuery,
  quantity,
  setQuantity,
  budgetRupees,
  setBudgetRupees,
  attacks,
  selectedAttackId,
  onSelectAttack,
  onRunAttack,
  onRunAll,
  isRunning,
  runType,
}) => {
  return (
    <div className="w-full flex flex-col gap-4 p-5 bg-[#111820] border border-[#1E2A36] rounded-[12px]">
      {runType === 'simulated' && (
        <div className="flex items-center gap-2.5 p-2.5 rounded-[10px] bg-[#F0616D]/10 border border-[#F0616D]/30 text-[#F0616D] text-xs font-mono">
          <Bot className="w-4 h-4 shrink-0" />
          <span>
            <strong>Simulated: worst case, agent fully compromised</strong> — Scripted agent executing attacker goal tool calls regardless of instructions, proving Cedar defense under total model hijack.
          </span>
        </div>
      )}

      {/* Top Input Row: What to buy, Quantity, Budget, and Action Buttons */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-end justify-between gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
          {/* Item query */}
          <div>
            <label className="block text-[11px] font-mono text-[#8B98A5] uppercase tracking-wider mb-1">
              User Goal / Product
            </label>
            <input
              type="text"
              value={itemQuery}
              onChange={(e) => setItemQuery(e.target.value)}
              className="w-full bg-[#151E28] border border-[#1E2A36] rounded-[12px] px-3 py-2 text-sm text-[#E6EDF3] font-sans focus:outline-none focus:border-[#4CC9F0] transition-colors"
              placeholder="e.g. wireless earbuds"
            />
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-[11px] font-mono text-[#8B98A5] uppercase tracking-wider mb-1">
              Quantity
            </label>
            <input
              type="number"
              min="1"
              max="10"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full bg-[#151E28] border border-[#1E2A36] rounded-[12px] px-3 py-2 text-sm text-[#E6EDF3] font-mono focus:outline-none focus:border-[#4CC9F0] transition-colors"
            />
          </div>

          {/* Budget */}
          <div>
            <label className="block text-[11px] font-mono text-[#8B98A5] uppercase tracking-wider mb-1">
              Budget Cap
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm text-[#8B98A5] font-mono">₹</span>
              <input
                type="number"
                step="100"
                value={budgetRupees}
                onChange={(e) => setBudgetRupees(Math.max(100, parseInt(e.target.value) || 1000))}
                className="w-full bg-[#151E28] border border-[#1E2A36] rounded-[12px] pl-7 pr-3 py-2 text-sm text-[#E6EDF3] font-mono focus:outline-none focus:border-[#4CC9F0] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRunAttack}
            disabled={isRunning}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#4CC9F0] hover:bg-[#4CC9F0]/90 text-[#0B0F14] font-medium text-sm rounded-[12px] disabled:opacity-50 transition-colors shadow-sm"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Run attack</span>
            <span className="hidden sm:inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded text-[10px] bg-black/20 text-[#0B0F14] font-mono">
              <Keyboard className="w-2.5 h-2.5" /> R
            </span>
          </button>

          <button
            onClick={onRunAll}
            disabled={isRunning}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#151E28] hover:bg-[#1E2A36] border border-[#1E2A36] text-[#E6EDF3] font-medium text-sm rounded-[12px] disabled:opacity-50 transition-colors"
          >
            <FastForward className="w-4 h-4 text-[#F5B84B]" />
            <span>Run all 10</span>
          </button>
        </div>
      </div>

      {/* Horizontal row of 10 numbered attack cards */}
      <div className="flex flex-col gap-2 pt-2 border-t border-[#1E2A36]">
        <div className="flex items-center justify-between text-[11px] font-mono text-[#8B98A5]">
          <span>SELECT ATTACK SCENARIO (1–10)</span>
          <span>{attacks.length} Attacks Loaded</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2 overflow-x-auto pb-1">
          {attacks.map((atk, index) => {
            const isSelected = atk.id === selectedAttackId;
            const numStr = String(index + 1).padStart(2, '0');

            return (
              <button
                key={atk.id}
                onClick={() => onSelectAttack(atk.id)}
                className={`flex flex-col p-2 rounded-[12px] text-left border transition-colors ${
                  isSelected
                    ? 'bg-[#151E28] border-[#4CC9F0] text-[#E6EDF3]'
                    : 'bg-[#0B0F14] border-[#1E2A36] text-[#8B98A5] hover:border-[#8B98A5]/40 hover:text-[#E6EDF3]'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span
                    className={`font-mono text-[10px] font-bold ${
                      isSelected ? 'text-[#4CC9F0]' : 'text-[#8B98A5]'
                    }`}
                  >
                    #{numStr}
                  </span>
                  <span
                    className="p-0.5 rounded text-[#4CC9F0]"
                    title={`Vector: ${atk.vector}`}
                  >
                    {getVectorIcon(atk.vector)}
                  </span>
                </div>

                <div className="text-[11px] font-medium truncate w-full" title={atk.name}>
                  {atk.name}
                </div>

                <div className="text-[9px] font-mono text-[#8B98A5] truncate mt-0.5">
                  {getGoalShortName(atk.attacker_goal)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
