import { useEffect, useState } from 'react';
import { ShieldCheck, Cpu, Terminal, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface HealthStatus {
  status: string;
  service: string;
  model: string;
  ollama_host: string;
}

export default function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((data: HealthStatus) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err: Error) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-8">
      <header className="max-w-4xl w-full flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">CartGuard</h1>
            <p className="text-sm text-slate-400">Security Layer for AI Shopping Agents</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading ? (
            <span className="text-xs px-3 py-1 bg-slate-800 text-slate-400 rounded-full animate-pulse">
              Checking backend...
            </span>
          ) : error ? (
            <span className="flex items-center gap-1.5 text-xs px-3 py-1 bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full">
              <AlertTriangle className="w-3.5 h-3.5" /> Backend Offline ({error})
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" /> Backend Connected
            </span>
          )}
        </div>
      </header>

      <main className="max-w-4xl w-full mt-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 text-indigo-400 mb-2 font-semibold">
              <Cpu className="w-5 h-5" /> 1. Quarantined Reader
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Consumes untrusted seller listing text with zero tools enabled. Emits only typed facts.
            </p>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 text-amber-400 mb-2 font-semibold">
              <Terminal className="w-5 h-5" /> 2. Shopper Agent
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Equipped with shopping tools (cart, purchase) but never exposed to raw untrusted listing content.
            </p>
          </div>

          <div className="p-5 bg-slate-900/60 border border-slate-800 rounded-xl">
            <div className="flex items-center gap-2 text-emerald-400 mb-2 font-semibold">
              <ShieldCheck className="w-5 h-5" /> 3. Cedar Policy Engine
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Deterministic authorization backstop evaluating each tool invocation with cedarpy.
            </p>
          </div>
        </div>

        <section className="bg-slate-900/40 border border-slate-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4 text-slate-200">System Environment & Health</h2>
          {health ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
                <span className="text-xs text-slate-500 block">Service</span>
                <span className="font-mono font-medium text-emerald-400">{health.service}</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
                <span className="text-xs text-slate-500 block">Status</span>
                <span className="font-mono font-medium text-emerald-400">{health.status}</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
                <span className="text-xs text-slate-500 block">Model Target</span>
                <span className="font-mono font-medium text-slate-300">{health.model}</span>
              </div>
              <div className="bg-slate-950/80 p-3 rounded-lg border border-slate-800/80">
                <span className="text-xs text-slate-500 block">Ollama Host</span>
                <span className="font-mono font-medium text-slate-300">{health.ollama_host}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Awaiting status from /api/health...</p>
          )}
        </section>
      </main>
    </div>
  );
}
