import React from 'react';
import { ShieldCheck, Info, FileCode } from 'lucide-react';
import { CedarLogEntry } from '../types';

interface CedarLogProps {
  entries: CedarLogEntry[];
  onSelectRow: (entry: CedarLogEntry) => void;
}

export const CedarLog: React.FC<CedarLogProps> = ({ entries, onSelectRow }) => {
  const formatTime = (ts: number) => {
    const millis = ts > 1e11 ? ts : ts * 1000;
    const d = new Date(millis);
    return isNaN(d.getTime())
      ? '00:00:00'
      : d.toLocaleTimeString('en-US', {
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        });
  };

  return (
    <div className="w-full flex flex-col bg-[#111820] border border-[#1E2A36] rounded-[12px] p-5">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1E2A36]">
        <div className="flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 text-[#4CC9F0]" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E6EDF3]">
            Cedar Authorization Decision Log
          </h3>
          <span className="text-[10px] font-mono text-[#8B98A5] px-2 py-0.5 rounded bg-[#151E28] border border-[#1E2A36]">
            {entries.length} Events Evaluated
          </span>
        </div>
        <div className="text-[11px] text-[#8B98A5] flex items-center gap-1">
          <Info className="w-3.5 h-3.5 text-[#4CC9F0]" />
          <span>Click any row to inspect fired Cedar policy DSL</span>
        </div>
      </div>

      <div className="overflow-x-auto min-h-[140px] max-h-[280px] overflow-y-auto">
        {entries.length === 0 ? (
          <div className="flex items-center justify-center p-8 border border-dashed border-[#1E2A36] rounded-[12px] text-xs font-mono text-[#8B98A5]">
            No tool authorization decisions logged yet. Run an attack to view Cedar evaluations.
          </div>
        ) : (
          <table className="w-full text-left font-mono text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#1E2A36] text-[#8B98A5] text-[10px] uppercase">
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Action / Tool</th>
                <th className="py-2 px-3">Key Arguments</th>
                <th className="py-2 px-3">Decision</th>
                <th className="py-2 px-3">Rule @id</th>
                <th className="py-2 px-3">Deterministic Rationale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1E2A36]/60">
              {entries.map((entry) => {
                const isDenied = entry.decision === 'DENY';
                return (
                  <tr
                    key={entry.id}
                    onClick={() => onSelectRow(entry)}
                    className={`cursor-pointer transition-colors duration-200 hover:bg-[#151E28] ${
                      isDenied ? 'bg-[#F0616D]/5 animate-pulse' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 text-[#8B98A5] whitespace-nowrap text-[11px]">
                      {formatTime(entry.timestamp)}
                    </td>

                    <td className="py-2.5 px-3 font-medium text-[#E6EDF3] whitespace-nowrap">
                      {entry.tool}
                    </td>

                    <td className="py-2.5 px-3 text-[#8B98A5] max-w-[200px] truncate text-[11px]" title={JSON.stringify(entry.args)}>
                      {JSON.stringify(entry.args)}
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${
                          isDenied
                            ? 'bg-[#F0616D]/15 text-[#F0616D] border border-[#F0616D]/30'
                            : 'bg-[#3DDC97]/15 text-[#3DDC97] border border-[#3DDC97]/30'
                        }`}
                      >
                        {entry.decision}
                      </span>
                    </td>

                    <td className="py-2.5 px-3 whitespace-nowrap text-[#4CC9F0] text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <FileCode className="w-3 h-3 text-[#4CC9F0]" />
                        <span>@{entry.rule}</span>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-[#E6EDF3] text-[11px] max-w-[340px] truncate" title={entry.reason}>
                      {entry.reason}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
