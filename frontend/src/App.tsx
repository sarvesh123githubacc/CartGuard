import { useCallback, useEffect, useRef, useState } from 'react';
import { Header } from './components/Header';
import { TaskBar } from './components/TaskBar';
import { ListingInspector } from './components/ListingInspector';
import { Arena } from './components/Arena';
import { CedarLog } from './components/CedarLog';
import { Scoreboard } from './components/Scoreboard';
import { PolicyModal } from './components/PolicyModal';
import { StressDrawer } from './components/StressDrawer';
import {
  AgentStatus,
  Attack,
  CartState,
  CedarLogEntry,
  ListingFacts,
  Product,
  TimelineStep,
} from './types';

const INITIAL_CART: CartState = {
  items: [],
  ship_to: '42 Palm Grove, Indiranagar, Bengaluru, KA 560038',
  checked_out: false,
  user_approved: false,
};

export default function App() {
  // System Health & Configuration
  const [modelName, setModelName] = useState<string>('llama3.1:8b');
  const [policyCount] = useState<number>(5);
  const [isReplay, setIsReplay] = useState<boolean>(true);

  // Scenarios and Catalog Data
  const [attacks, setAttacks] = useState<Attack[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [selectedAttackId, setSelectedAttackId] = useState<string>('atk_fake_system_qty');

  // Task Input Controls
  const [itemQuery, setItemQuery] = useState<string>('wireless earbuds');
  const [quantity, setQuantity] = useState<number>(1);
  const [budgetRupees, setBudgetRupees] = useState<number>(3000);
  const savedAddress = '42 Palm Grove, Indiranagar, Bengaluru, KA 560038';

  // Execution Running State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Unprotected Agent State
  const [unprotectedStatus, setUnprotectedStatus] = useState<AgentStatus>('Idle');
  const [unprotectedSteps, setUnprotectedSteps] = useState<TimelineStep[]>([]);
  const [unprotectedCart, setUnprotectedCart] = useState<CartState>(INITIAL_CART);

  // CartGuard Protected Agent State
  const [protectedStatus, setProtectedStatus] = useState<AgentStatus>('Idle');
  const [protectedSteps, setProtectedSteps] = useState<TimelineStep[]>([]);
  const [protectedCart, setProtectedCart] = useState<CartState>(INITIAL_CART);
  const [readerFacts, setReaderFacts] = useState<ListingFacts | null>(null);
  const [isAwaitingApproval, setIsAwaitingApproval] = useState<boolean>(false);

  // Cedar Decision Log & Inspection Modal
  const [cedarEntries, setCedarEntries] = useState<CedarLogEntry[]>([]);
  const [selectedCedarEntry, setSelectedCedarEntry] = useState<CedarLogEntry | null>(null);

  // Scoreboard 10-Attack Benchmark Results
  const [unprotectedResults, setUnprotectedResults] = useState<Record<string, boolean>>({});
  const [protectedResults, setProtectedResults] = useState<Record<string, boolean>>({});

  // Stress Test Drawer
  const [isStressDrawerOpen, setIsStressDrawerOpen] = useState<boolean>(false);

  // Active Attack & Product Object
  const selectedAttack = attacks.find((a) => a.id === selectedAttackId) || null;
  const targetProduct = products['prod_eb_01'] || Object.values(products)[0] || null;

  // Refs for aborting ongoing streams
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initial Fetch: Health, Attacks, Catalog
  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.model) setModelName(data.model);
      })
      .catch((err) => console.warn('Health check failed:', err));

    fetch('/api/attacks')
      .then((res) => res.json())
      .then((data: Attack[]) => {
        setAttacks(data);
        if (data.length > 0) {
          setSelectedAttackId(data[0].id);
        }
      })
      .catch((err) => console.error('Failed to load attacks:', err));

    fetch('/api/catalog')
      .then((res) => res.json())
      .then((data: Product[]) => {
        const map: Record<string, Product> = {};
        data.forEach((p) => {
          map[p.id] = p;
        });
        setProducts(map);
      })
      .catch((err) => console.error('Failed to load catalog:', err));
  }, []);

  // Helper to reset execution state for a single attack run
  const resetRunState = () => {
    setUnprotectedStatus('Running');
    setProtectedStatus('Running');
    setUnprotectedSteps([]);
    setProtectedSteps([]);
    setUnprotectedCart(INITIAL_CART);
    setProtectedCart(INITIAL_CART);
    setReaderFacts(null);
    setCedarEntries([]);
    setIsAwaitingApproval(false);
  };

  // Process a stream of SSE events for a specific mode
  const streamScenario = async (
    attackId: string,
    mode: 'unprotected' | 'protected',
    replay: boolean,
    signal: AbortSignal
  ) => {
    const response = await fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        attack_id: attackId,
        mode: mode,
        replay: replay,
      }),
      signal,
    });

    if (!response.ok) {
      throw new Error(`Failed to stream scenario: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const rawData = line.slice(6).trim();
          if (!rawData) continue;
          try {
            const event = JSON.parse(rawData);
            handleScenarioEvent(event, mode, attackId);
          } catch (e) {
            console.warn('Error parsing SSE event JSON:', e, rawData);
          }
        }
      }
    }
  };

  // Handle an individual event from the backend stream
  const handleScenarioEvent = (
    event: any,
    mode: 'unprotected' | 'protected',
    attackId: string
  ) => {
    const isProt = mode === 'protected';

    if (event.session_id) {
      setActiveSessionId(event.session_id);
    }

    // 1. Quarantined Reader Facts
    if ((event.type === 'reader' || event.type === 'reader_facts') && (event.facts || event.event?.facts)) {
      setReaderFacts(event.facts || event.event?.facts);
    }

    // 2. Tool Call
    if (event.type === 'tool_call') {
      const decision = event.decision || event.event?.decision;
      const rule = event.rule || event.event?.rule;
      const reason = event.reason || event.event?.reason;

      const step: TimelineStep = {
        id: `${mode}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        tool: event.tool,
        args: event.args || {},
        decision: decision,
        rule: rule,
        reason: reason,
        timestamp: event.timestamp || Date.now() / 1000,
      };

      if (isProt) {
        setProtectedSteps((prev) => [...prev, step]);

        // If this protected tool call has a Cedar authorization verdict, record in Cedar Decision Log
        if (decision) {
          const cedarEntry: CedarLogEntry = {
            id: `cedar-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            timestamp: event.timestamp || Date.now() / 1000,
            tool: event.tool,
            args: event.args || {},
            decision: decision,
            rule: rule || 'permit-legitimate-actions',
            reason: reason || 'Evaluated under Cedar policies',
          };
          setCedarEntries((prev) => [cedarEntry, ...prev]);
        }
      } else {
        setUnprotectedSteps((prev) => [...prev, step]);
      }

      if (event.tool === 'checkout' && isProt) {
        setIsAwaitingApproval(true);
      }
    }

    // 3. Cedar Authorization Decision (Protected mode explicit event)
    if (event.type === 'cedar_decision') {
      const entry: CedarLogEntry = {
        id: `cedar-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        timestamp: event.timestamp || Date.now() / 1000,
        tool: event.tool,
        args: event.args || {},
        decision: event.decision,
        rule: event.rule || 'default-deny',
        reason: event.reason || '',
      };

      setCedarEntries((prev) => [entry, ...prev]);

      // Update the last step with the Cedar decision info
      setProtectedSteps((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const lastIdx = updated.length - 1;
        updated[lastIdx] = {
          ...updated[lastIdx],
          decision: event.decision,
          rule: event.rule,
          reason: event.reason,
        };
        return updated;
      });
    }

    // 4. Cart Update
    if (event.type === 'cart_update' && event.cart) {
      if (isProt) {
        setProtectedCart(event.cart);
      } else {
        setUnprotectedCart(event.cart);
      }
    }

    // 5. Outcome Evaluation Result
    if (event.type === 'evaluation') {
      const succeeded = !!event.attack_succeeded;
      if (isProt) {
        setProtectedResults((prev) => ({ ...prev, [attackId]: succeeded }));
        setProtectedStatus(succeeded ? 'Hijacked' : 'Safe');
      } else {
        setUnprotectedResults((prev) => ({ ...prev, [attackId]: succeeded }));
        setUnprotectedStatus(succeeded ? 'Hijacked' : 'Safe');
      }
    }

    // 6. Run Complete / Done
    if (event.type === 'done') {
      if (isProt) {
        setProtectedStatus((prev) => (prev === 'Running' ? 'Safe' : prev));
      } else {
        setUnprotectedStatus((prev) => (prev === 'Running' ? 'Hijacked' : prev));
      }
    }
  };

  // Run the currently selected attack across both agents
  const handleRunAttack = useCallback(async () => {
    if (isRunning || !selectedAttackId) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsRunning(true);
    resetRunState();

    try {
      if (isReplay) {
        // Run Unprotected and Protected runs in parallel for instant replay streaming
        await Promise.allSettled([
          streamScenario(selectedAttackId, 'unprotected', true, controller.signal),
          streamScenario(selectedAttackId, 'protected', true, controller.signal),
        ]);
      } else {
        // In Live mode, execute sequentially so local Ollama CPU inference is not starved
        await streamScenario(selectedAttackId, 'unprotected', false, controller.signal);
        await streamScenario(selectedAttackId, 'protected', false, controller.signal);
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Scenario run error:', err);
      }
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, selectedAttackId, isReplay]);

  // Run all 10 attacks sequentially across both modes
  const handleRunAll = useCallback(async () => {
    if (isRunning || attacks.length === 0) return;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsRunning(true);

    try {
      for (const atk of attacks) {
        if (controller.signal.aborted) break;
        setSelectedAttackId(atk.id);
        resetRunState();

        if (isReplay) {
          await Promise.allSettled([
            streamScenario(atk.id, 'unprotected', true, controller.signal),
            streamScenario(atk.id, 'protected', true, controller.signal),
          ]);
        } else {
          await streamScenario(atk.id, 'unprotected', false, controller.signal);
          await streamScenario(atk.id, 'protected', false, controller.signal);
        }

        // Brief delay between scenarios for smooth UI rendering
        await new Promise((r) => setTimeout(r, 600));
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Run all error:', err);
      }
    } finally {
      setIsRunning(false);
    }
  }, [isRunning, attacks, isReplay]);

  // Handle User Approval for Pending Checkout
  const handleApprovePurchase = async () => {
    try {
      const res = await fetch('/api/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: activeSessionId }),
      });
      if (res.ok) {
        setIsAwaitingApproval(false);
        setProtectedCart((prev) => ({
          ...prev,
          user_approved: true,
          checked_out: true,
        }));
      }
    } catch (err) {
      console.error('Failed to approve checkout:', err);
    }
  };

  // Global Keyboard Shortcut: 'R' to run attack
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === 'r' || e.key === 'R') &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        handleRunAttack();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRunAttack]);

  return (
    <div className="min-h-screen bg-[#0B0F14] text-[#E6EDF3] flex flex-col items-center py-6 px-4 sm:px-6 font-sans antialiased selection:bg-[#4CC9F0]/30 selection:text-[#4CC9F0]">
      <div className="w-full max-w-[1200px] flex flex-col gap-5">
        {/* 1. Top Header */}
        <Header
          modelName={modelName}
          policyCount={policyCount}
          isReplay={isReplay}
          onToggleReplay={() => setIsReplay((prev) => !prev)}
        />

        {/* 2. Task Configuration & 10-Attack Selector Bar */}
        <TaskBar
          itemQuery={itemQuery}
          setItemQuery={setItemQuery}
          quantity={quantity}
          setQuantity={setQuantity}
          budgetRupees={budgetRupees}
          setBudgetRupees={setBudgetRupees}
          attacks={attacks}
          selectedAttackId={selectedAttackId}
          onSelectAttack={(id) => {
            if (!isRunning) {
              setSelectedAttackId(id);
              // Reset steps when choosing a different attack
              setUnprotectedSteps([]);
              setProtectedSteps([]);
              setUnprotectedStatus('Idle');
              setProtectedStatus('Idle');
              setUnprotectedCart(INITIAL_CART);
              setProtectedCart(INITIAL_CART);
              setReaderFacts(null);
            }
          }}
          onRunAttack={handleRunAttack}
          onRunAll={handleRunAll}
          isRunning={isRunning}
        />

        {/* 3. Listing Inspector (Raw Untrusted Listing vs Quarantined Reader Output) */}
        <ListingInspector
          attack={selectedAttack}
          product={targetProduct}
          readerFacts={readerFacts}
        />

        {/* 4. Agent Arena (Side-by-Side: Unprotected vs CartGuard) */}
        <Arena
          unprotectedStatus={unprotectedStatus}
          unprotectedSteps={unprotectedSteps}
          unprotectedCart={unprotectedCart}
          protectedStatus={protectedStatus}
          protectedSteps={protectedSteps}
          protectedCart={protectedCart}
          isAwaitingApproval={isAwaitingApproval}
          onApprovePurchase={handleApprovePurchase}
          targetQuantity={quantity}
          targetBudgetRupees={budgetRupees}
          savedAddress={savedAddress}
        />

        {/* 5. Cedar Authorization Decision Log */}
        <CedarLog
          entries={cedarEntries}
          onSelectRow={(entry) => setSelectedCedarEntry(entry)}
        />

        {/* 6. Benchmark Scoreboard (10 Attacks & Stress Trigger) */}
        <Scoreboard
          attacks={attacks}
          unprotectedResults={unprotectedResults}
          protectedResults={protectedResults}
          onOpenStressDrawer={() => setIsStressDrawerOpen(true)}
        />
      </div>

      {/* Inspection Modal for Fired Cedar Policy */}
      <PolicyModal
        entry={selectedCedarEntry}
        onClose={() => setSelectedCedarEntry(null)}
      />

      {/* Cedar Policy 200-Call Adversarial Stress Drawer */}
      <StressDrawer
        isOpen={isStressDrawerOpen}
        onClose={() => setIsStressDrawerOpen(false)}
      />
    </div>
  );
}
