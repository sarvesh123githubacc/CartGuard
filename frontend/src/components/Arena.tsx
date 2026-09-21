import React from 'react';
import {
  AlertTriangle,
  ShieldCheck,
  XCircle,
  Clock,
  ShoppingCart,
  Truck,
  Search,
  FileText,
  CreditCard,
  Check,
} from 'lucide-react';
import { AgentStatus, CartState, TimelineStep } from '../types';

interface ArenaProps {
  // Unprotected Agent State
  unprotectedStatus: AgentStatus;
  unprotectedSteps: TimelineStep[];
  unprotectedCart: CartState;
  unprotectedModelText?: string;

  // CartGuard Agent State
  protectedStatus: AgentStatus;
  protectedSteps: TimelineStep[];
  protectedCart: CartState;
  protectedModelText?: string;
  isAwaitingApproval: boolean;
  onApprovePurchase: () => void;

  // User Intent for Deviation Highlighting
  targetQuantity: number;
  targetBudgetRupees: number;
  savedAddress: string;
}

const getToolIcon = (tool: string) => {
  switch (tool) {
    case 'search_products':
      return <Search className="w-3.5 h-3.5" />;
    case 'get_listing_raw':
    case 'get_listing_facts':
      return <FileText className="w-3.5 h-3.5" />;
    case 'add_to_cart':
      return <ShoppingCart className="w-3.5 h-3.5" />;
    case 'change_address':
      return <Truck className="w-3.5 h-3.5" />;
    case 'checkout':
      return <CreditCard className="w-3.5 h-3.5" />;
    default:
      return <Clock className="w-3.5 h-3.5" />;
  }
};

const getStatusBadge = (status: AgentStatus) => {
  switch (status) {
    case 'Running':
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-[12px] bg-[#4CC9F0]/15 text-[#4CC9F0] border border-[#4CC9F0]/30 font-mono text-xs animate-pulse">
          <Clock className="w-3 h-3 animate-spin" /> RUNNING
        </span>
      );
    case 'Hijacked':
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-[12px] bg-[#F0616D]/15 text-[#F0616D] border border-[#F0616D]/30 font-mono text-xs font-bold">
          <XCircle className="w-3.5 h-3.5" /> HIJACKED
        </span>
      );
    case 'Resisted':
    case 'Safe':
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-[12px] bg-[#151E28] text-[#8B98A5] border border-[#1E2A36] font-mono text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-[#3DDC97]" /> RESISTED INJECTION
        </span>
      );
    case 'Idle':
    default:
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-[12px] bg-[#151E28] text-[#8B98A5] border border-[#1E2A36] font-mono text-xs">
          IDLE
        </span>
      );
  }
};

export const Arena: React.FC<ArenaProps> = ({
  unprotectedStatus,
  unprotectedSteps,
  unprotectedCart,
  protectedStatus,
  protectedSteps,
  protectedCart,
  isAwaitingApproval,
  onApprovePurchase,
  targetQuantity,
  targetBudgetRupees,
  savedAddress,
}) => {
  // Check deviations for unprotected cart
  const unprotQty = unprotectedCart.total_quantity ?? unprotectedCart.items.reduce((s, i) => s + i.quantity, 0);
  const unprotTotal = (unprotectedCart.total_paise ?? unprotectedCart.items.reduce((s, i) => s + i.price_paise * i.quantity, 0)) / 100;
  const isUnprotQtyDeviated = unprotQty > targetQuantity;
  const isUnprotBudgetDeviated = unprotTotal > targetBudgetRupees;
  const isUnprotAddressDeviated = unprotectedCart.ship_to !== savedAddress;

  // Check deviations for protected cart
  const protQty = protectedCart.total_quantity ?? protectedCart.items.reduce((s, i) => s + i.quantity, 0);
  const protTotal = (protectedCart.total_paise ?? protectedCart.items.reduce((s, i) => s + i.price_paise * i.quantity, 0)) / 100;
  const isProtQtyDeviated = protQty > targetQuantity;
  const isProtBudgetDeviated = protTotal > targetBudgetRupees;
  const isProtAddressDeviated = protectedCart.ship_to !== savedAddress;
  const isProtApprovalDeviated = protectedCart.checked_out && !protectedCart.user_approved;
  const isProtAnyDeviated =
    isProtQtyDeviated ||
    isProtBudgetDeviated ||
    isProtAddressDeviated ||
    isProtApprovalDeviated;

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* LEFT COLUMN: Unprotected Agent */}
      <div className="flex flex-col bg-[#111820] border border-[#1E2A36] rounded-[12px] p-5 border-t-2 border-t-[#F0616D]">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E2A36]">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-[12px] bg-[#F0616D]/15 text-[#F0616D]">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#E6EDF3] font-sans">Unprotected Agent</h3>
              <p className="text-[11px] text-[#8B98A5]">Raw listing text • No Cedar authorization</p>
            </div>
          </div>
          {getStatusBadge(unprotectedStatus)}
        </div>

        {/* Step Timeline */}
        <div className="flex-1 flex flex-col gap-2 mb-4 min-h-[160px] max-h-[260px] overflow-y-auto pr-1">
          <div className="text-[10px] uppercase font-mono text-[#8B98A5] mb-1">
            Execution Step Timeline ({unprotectedSteps.length} steps)
          </div>

          {unprotectedSteps.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6 border border-dashed border-[#1E2A36] rounded-[12px] text-xs text-[#8B98A5] font-mono">
              Awaiting attack run...
            </div>
          ) : (
            unprotectedSteps.map((st) => (
              <div
                key={st.id}
                className="flex items-start gap-2.5 p-2.5 rounded-[12px] bg-[#151E28] border border-[#1E2A36] text-xs transition-colors duration-200"
              >
                <div className="p-1 rounded bg-[#0B0F14] text-[#F0616D] shrink-0 mt-0.5">
                  {getToolIcon(st.tool)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono font-medium text-[#E6EDF3]">{st.tool}</span>
                    <span className="text-[10px] font-mono text-[#F0616D] bg-[#F0616D]/10 px-1.5 py-0.5 rounded">
                      UNGUARDED
                    </span>
                  </div>
                  <pre className="text-[11px] font-mono text-[#8B98A5] overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(st.args)}
                  </pre>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Tile */}
        <div
          className={`p-4 rounded-[12px] border transition-colors duration-200 ${
            unprotectedSteps.length > 0 && unprotectedStatus === 'Hijacked'
              ? 'bg-[#F0616D]/10 border-[#F0616D]/40 text-[#F0616D]'
              : unprotectedSteps.length > 0
              ? 'bg-[#151E28] border-[#1E2A36] text-[#8B98A5]'
              : 'bg-[#151E28] border-[#1E2A36] text-[#8B98A5]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              Shopping Cart State
            </span>
            {unprotectedSteps.length > 0 && (
              <span className="text-[11px] font-mono font-bold">
                {unprotectedStatus === 'Hijacked' ? '⚠ HIJACKED' : '✓ RESISTED INJECTION'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-[#8B98A5] block">Quantity</span>
              <span className={`text-sm font-bold ${isUnprotQtyDeviated ? 'text-[#F0616D]' : 'text-[#E6EDF3]'}`}>
                {unprotQty} units {isUnprotQtyDeviated && `(Target: ${targetQuantity})`}
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[#8B98A5] block">Total Amount</span>
              <span className={`text-sm font-bold ${isUnprotBudgetDeviated ? 'text-[#F0616D]' : 'text-[#E6EDF3]'}`}>
                ₹{unprotTotal.toLocaleString('en-IN')}{' '}
                {isUnprotBudgetDeviated && `(Budget: ₹${targetBudgetRupees})`}
              </span>
            </div>

            <div className="col-span-2 pt-1 border-t border-[#1E2A36]/60">
              <span className="text-[10px] text-[#8B98A5] block">Ship To</span>
              <span
                className={`truncate block text-xs ${
                  isUnprotAddressDeviated ? 'text-[#F0616D] font-bold' : 'text-[#E6EDF3]'
                }`}
              >
                {unprotectedCart.ship_to || savedAddress}
              </span>
            </div>

            <div className="col-span-2 pt-1 border-t border-[#1E2A36]/60 flex items-center justify-between">
              <span className="text-[10px] text-[#8B98A5]">Checkout Status:</span>
              <span className={`text-[11px] font-bold ${unprotectedCart.checked_out ? 'text-[#F0616D]' : 'text-[#8B98A5]'}`}>
                {unprotectedCart.checked_out
                  ? 'Checked Out (Bypassed Approval)'
                  : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: CartGuard Agent */}
      <div className="flex flex-col bg-[#111820] border border-[#1E2A36] rounded-[12px] p-5 border-t-2 border-t-[#3DDC97]">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#1E2A36]">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded-[12px] bg-[#3DDC97]/15 text-[#3DDC97]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#E6EDF3] font-sans">CartGuard Agent</h3>
              <p className="text-[11px] text-[#8B98A5]">Quarantined Reader • Cedar Policy Gatekeeper</p>
            </div>
          </div>
          {getStatusBadge(protectedStatus)}
        </div>

        {/* Step Timeline */}
        <div className="flex-1 flex flex-col gap-2 mb-4 min-h-[160px] max-h-[260px] overflow-y-auto pr-1">
          <div className="text-[10px] uppercase font-mono text-[#8B98A5] mb-1">
            Execution Step Timeline ({protectedSteps.length} steps)
          </div>

          {protectedSteps.length === 0 ? (
            <div className="flex-1 flex items-center justify-center p-6 border border-dashed border-[#1E2A36] rounded-[12px] text-xs text-[#8B98A5] font-mono">
              Awaiting attack run...
            </div>
          ) : (
            protectedSteps.map((st) => (
              <div
                key={st.id}
                className="flex items-start gap-2.5 p-2.5 rounded-[12px] bg-[#151E28] border border-[#1E2A36] text-xs transition-colors duration-200"
              >
                <div
                  className={`p-1 rounded bg-[#0B0F14] shrink-0 mt-0.5 ${
                    st.decision === 'DENY' ? 'text-[#F0616D]' : 'text-[#3DDC97]'
                  }`}
                >
                  {getToolIcon(st.tool)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="font-mono font-medium text-[#E6EDF3]">{st.tool}</span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
                        st.decision === 'DENY'
                          ? 'bg-[#F0616D]/15 text-[#F0616D] border border-[#F0616D]/30'
                          : 'bg-[#3DDC97]/15 text-[#3DDC97] border border-[#3DDC97]/30'
                      }`}
                    >
                      {st.decision || 'PERMIT'}
                    </span>
                  </div>
                  <pre className="text-[11px] font-mono text-[#8B98A5] overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(st.args)}
                  </pre>
                  {st.rule && (
                    <div className="text-[10px] font-mono text-[#4CC9F0] mt-1">
                      Rule: @id("{st.rule}")
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Tile */}
        <div
          className={`p-4 rounded-[12px] border transition-colors duration-200 ${
            protectedSteps.length > 0 && isProtAnyDeviated
              ? 'bg-[#F0616D]/10 border-[#F0616D]/40 text-[#F0616D]'
              : protectedSteps.length > 0
              ? 'bg-[#3DDC97]/10 border-[#3DDC97]/40 text-[#3DDC97]'
              : 'bg-[#151E28] border-[#1E2A36] text-[#8B98A5]'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              Shopping Cart State
            </span>
            {protectedSteps.length > 0 && (
              <span className="text-[11px] font-mono font-bold">
                {isProtAnyDeviated ? '⚠ INTENT VIOLATED' : '✓ DEFENDED & VERIFIED'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div>
              <span className="text-[10px] text-[#8B98A5] block">Quantity</span>
              <span className="text-sm font-bold text-[#E6EDF3]">
                {protQty} units
              </span>
            </div>

            <div>
              <span className="text-[10px] text-[#8B98A5] block">Total Amount</span>
              <span className="text-sm font-bold text-[#E6EDF3]">
                ₹{protTotal.toLocaleString('en-IN')}
              </span>
            </div>

            <div className="col-span-2 pt-1 border-t border-[#1E2A36]/60">
              <span className="text-[10px] text-[#8B98A5] block">Ship To</span>
              <span className="truncate block text-xs text-[#E6EDF3]">
                {protectedCart.ship_to || savedAddress}
              </span>
            </div>

            <div className="col-span-2 pt-1 border-t border-[#1E2A36]/60 flex items-center justify-between">
              <span className="text-[10px] text-[#8B98A5]">Checkout Status:</span>
              <span
                className={`text-[11px] font-bold ${
                  protectedCart.checked_out ? 'text-[#3DDC97]' : 'text-[#F5B84B]'
                }`}
              >
                {protectedCart.checked_out
                  ? 'Checked Out (User Approved)'
                  : 'Awaiting User Approval'}
              </span>
            </div>
          </div>

          {/* Approve Purchase Button */}
          {(isAwaitingApproval || (protectedSteps.length > 0 && protectedCart.items.length > 0 && !protectedCart.checked_out)) && (
            <div className="mt-3 pt-2 border-t border-[#1E2A36]">
              <button
                onClick={onApprovePurchase}
                className="w-full py-2 px-3 bg-[#3DDC97] hover:bg-[#3DDC97]/90 text-[#0B0F14] text-xs font-bold font-mono rounded-[12px] flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Check className="w-3.5 h-3.5" />
                Approve Purchase (/api/approve)
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
