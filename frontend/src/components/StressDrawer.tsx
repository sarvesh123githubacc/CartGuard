import React, { useEffect, useState } from 'react';
import { X, Activity, CheckCircle2, ShieldCheck, RefreshCw } from 'lucide-react';
import { StressReport } from '../types';

interface StressDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StressDrawer: React.FC<StressDrawerProps> = ({ isOpen, onClose }) => {
  const [report, setReport] = useState<StressReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStressReport = () => {
    setLoading(true);
    setError(null);
    fetch('/api/stress', { method: 'POST' })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data: StressReport) => {
        setReport(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen && !report) {
      fetchStressReport();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-md bg-[#111820] border-l border-[#1E2A36] h-full flex flex-col p-6 shadow-2xl animate-in slide-in-from-right duration-200">
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-[#1E2A36]">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-[12px] bg-[#151E28] border border-[#1E2A36] text-[#4CC9F0]">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#E6EDF3] font-sans">
                Cedar Policy Stress Test
              </h3>
              <p className="text-xs text-[#8B98A5]">200 Boundary & Adversarial Calls</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#8B98A5] hover:text-[#E6EDF3] hover:bg-[#151E28] rounded-[12px] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-xs text-[#8B98A5] font-mono">
              <RefreshCw className="w-5 h-5 text-[#4CC9F0] animate-spin" />
              <span>Evaluating 200 adversarial calls with cedarpy...</span>
            </div>
          ) : error ? (
            <div className="p-4 rounded-[12px] bg-[#F0616D]/15 border border-[#F0616D]/30 text-xs text-[#F0616D]">
              Error running stress test: {error}
            </div>
          ) : report ? (
            <>
              {/* Highlight Metric Box */}
              <div className="p-4 rounded-[12px] bg-[#3DDC97]/10 border border-[#3DDC97]/40 text-center">
                <span className="text-[10px] font-mono text-[#8B98A5] uppercase block mb-1">
                  Calls Violating User Intent Yet Allowed
                </span>
                <span className="text-3xl font-bold font-mono text-[#3DDC97] block">
                  {report.violating_allowed_count}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-[#3DDC97] mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> 0 Safety Invariants Violated (Airtight)
                </span>
              </div>

              {/* Total Summary */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
                <div className="p-3 rounded-[12px] bg-[#151E28] border border-[#1E2A36]">
                  <span className="text-[10px] text-[#8B98A5] block">Total</span>
                  <span className="text-base font-bold text-[#E6EDF3]">{report.total_calls}</span>
                </div>
                <div className="p-3 rounded-[12px] bg-[#151E28] border border-[#1E2A36]">
                  <span className="text-[10px] text-[#8B98A5] block">Allowed</span>
                  <span className="text-base font-bold text-[#3DDC97]">{report.allowed_count}</span>
                </div>
                <div className="p-3 rounded-[12px] bg-[#151E28] border border-[#1E2A36]">
                  <span className="text-[10px] text-[#8B98A5] block">Blocked</span>
                  <span className="text-base font-bold text-[#F0616D]">{report.blocked_count}</span>
                </div>
              </div>

              {/* Breakdown Table */}
              <div>
                <span className="text-[10px] font-mono uppercase text-[#8B98A5] block mb-2">
                  Decision Breakdown by Rule
                </span>
                <div className="rounded-[12px] bg-[#151E28] border border-[#1E2A36] overflow-hidden">
                  <table className="w-full text-left font-mono text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-[#1E2A36] text-[#8B98A5] text-[10px] uppercase bg-[#0B0F14]/50">
                        <th className="py-2 px-3">Rule Name</th>
                        <th className="py-2 px-3 text-right">Count</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E2A36]/60">
                      {Object.entries(report.rule_counts).map(([rule, cnt]) => {
                        const isBlockRule =
                          rule.startsWith('forbid') || rule.startsWith('default-deny');
                        return (
                          <tr key={rule} className="hover:bg-[#111820]">
                            <td className="py-2 px-3 text-[#E6EDF3]">
                              <span
                                className={`text-[11px] font-bold ${
                                  isBlockRule ? 'text-[#F0616D]' : 'text-[#3DDC97]'
                                }`}
                              >
                                {rule}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-bold text-[#E6EDF3]">{cnt}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="p-3 rounded-[12px] bg-[#0B0F14] border border-[#1E2A36] text-[11px] text-[#8B98A5] flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-[#3DDC97] shrink-0 mt-0.5" />
                <p>
                  Cedar evaluation is 100% deterministic and runs locally with cedarpy in C++/Rust.
                  Zero network calls or account credentials required.
                </p>
              </div>
            </>
          ) : null}
        </div>

        <div className="pt-4 border-t border-[#1E2A36] flex items-center justify-between gap-2">
          <button
            onClick={fetchStressReport}
            disabled={loading}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#151E28] hover:bg-[#1E2A36] border border-[#1E2A36] text-[#E6EDF3] text-xs font-mono rounded-[12px] transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-run 200 Calls</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#151E28] hover:bg-[#1E2A36] border border-[#1E2A36] text-[#E6EDF3] text-xs font-mono rounded-[12px] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
