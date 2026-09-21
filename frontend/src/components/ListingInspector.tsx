import React from 'react';
import { AlertTriangle, ShieldCheck, Lock } from 'lucide-react';
import { Attack, ListingFacts, Product } from '../types';

interface ListingInspectorProps {
  attack: Attack | null;
  product: Product | null;
  readerFacts: ListingFacts | null;
}

export const ListingInspector: React.FC<ListingInspectorProps> = ({
  attack,
  product,
  readerFacts,
}) => {
  if (!attack || !product) {
    return null;
  }

  // Render raw description or text with visible zero-width characters and danger highlighting
  const renderUntrustedText = (text: string, injection: string) => {
    // If text contains zero-width characters, represent them visually
    const cleanZWSP = (str: string) => {
      const parts = str.split('\u200b');
      if (parts.length === 1) return str;
      return parts.flatMap((part, i) =>
        i === 0
          ? [part]
          : [
              <span
                key={i}
                className="px-1 py-0.5 mx-0.5 text-[9px] font-mono bg-[#F0616D]/30 text-[#F0616D] border border-[#F0616D]/50 rounded"
              >
                [ZWSP]
              </span>,
              part,
            ]
      );
    };

    if (!injection || !text.includes(injection)) {
      return (
        <div className="space-y-2">
          <p className="text-xs text-[#8B98A5] leading-relaxed">{cleanZWSP(text)}</p>
          {injection && (
            <div className="p-2.5 rounded-[12px] bg-[#F0616D]/15 border border-[#F0616D]/40 text-xs text-[#F0616D] font-mono">
              <span className="font-bold block text-[10px] uppercase mb-0.5 text-[#F0616D]">
                [INJECTED PAYLOAD — VECTOR: {attack.vector.toUpperCase()}]
              </span>
              {cleanZWSP(injection)}
            </div>
          )}
        </div>
      );
    }

    const index = text.indexOf(injection);
    const before = text.substring(0, index);
    const after = text.substring(index + injection.length);

    return (
      <p className="text-xs text-[#8B98A5] leading-relaxed">
        {cleanZWSP(before)}
        <span className="inline-block px-1.5 py-0.5 my-0.5 rounded bg-[#F0616D]/15 border border-[#F0616D]/40 text-[#F0616D] font-mono font-medium">
          {cleanZWSP(injection)}
        </span>
        {cleanZWSP(after)}
      </p>
    );
  };

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Left Card: Raw Untrusted Listing */}
      <div className="flex flex-col bg-[#111820] border border-[#1E2A36] rounded-[12px] p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1E2A36]">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-[#F0616D]" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E6EDF3]">
              Raw Untrusted Seller Listing
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#F0616D]/10 border border-[#F0616D]/30 text-[#F0616D]">
            UNVERIFIED SELLER TEXT
          </span>
        </div>

        <div className="space-y-3 text-xs flex-1">
          <div>
            <span className="text-[#8B98A5] text-[10px] uppercase font-mono block">Product</span>
            <div className="font-medium text-[#E6EDF3] text-sm">{product.title}</div>
            <div className="text-[#8B98A5] font-mono text-[11px]">
              ID: {product.id} • ₹{(product.price_paise / 100).toLocaleString('en-IN')} (
              {product.price_paise} paise) • Rating: {product.rating}★
            </div>
          </div>

          <div>
            <span className="text-[#8B98A5] text-[10px] uppercase font-mono block">Seller Info</span>
            <div className="text-[#E6EDF3] font-mono text-xs">
              {product.seller}{' '}
              <span
                className={`ml-1 font-bold ${
                  product.seller_score < 0.3 ? 'text-[#F0616D]' : 'text-[#3DDC97]'
                }`}
              >
                (Score: {Math.round(product.seller_score * 100)}%)
              </span>
            </div>
          </div>

          <div>
            <span className="text-[#8B98A5] text-[10px] uppercase font-mono block mb-1">
              Description & Injected Vector ({attack.vector})
            </span>
            <div className="p-3 rounded-[12px] bg-[#151E28] border border-[#1E2A36]">
              {renderUntrustedText(product.description, attack.hidden_text)}
            </div>
          </div>

          {product.reviews && product.reviews.length > 0 && (
            <div>
              <span className="text-[#8B98A5] text-[10px] uppercase font-mono block mb-1">
                Seller Reviews
              </span>
              <div className="p-2.5 rounded-[12px] bg-[#151E28] border border-[#1E2A36] text-[11px] text-[#8B98A5]">
                "{product.reviews[0]}"
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Card: Quarantined Reader Output */}
      <div className="flex flex-col bg-[#111820] border border-[#1E2A36] rounded-[12px] p-5">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#1E2A36]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#3DDC97]" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E6EDF3]">
              Quarantined Reader Facts
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#3DDC97]/10 border border-[#3DDC97]/30 text-[#3DDC97]">
            TYPED SCHEMA OUTPUT
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-between">
          <div className="bg-[#151E28] border border-[#1E2A36] rounded-[12px] p-3 font-mono text-xs text-[#E6EDF3] space-y-1.5 overflow-x-auto">
            <div className="text-[#8B98A5] text-[11px]">// ListingFacts (sanitized schema-typed facts)</div>
            <div>
              <span className="text-[#4CC9F0]">product_id</span>: <span className="text-[#3DDC97]">"{readerFacts?.product_id || product.id}"</span>
            </div>
            <div>
              <span className="text-[#4CC9F0]">title</span>: <span className="text-[#3DDC97]">"{readerFacts?.title || product.title.slice(0, 80)}"</span>
            </div>
            <div>
              <span className="text-[#4CC9F0]">price_paise</span>: <span className="text-[#F5B84B]">{readerFacts?.price_paise || product.price_paise}</span>
            </div>
            <div>
              <span className="text-[#4CC9F0]">rating</span>: <span className="text-[#F5B84B]">{readerFacts?.rating || product.rating}</span>
            </div>
            <div>
              <span className="text-[#4CC9F0]">seller_score</span>: <span className="text-[#F5B84B]">{readerFacts?.seller_score || product.seller_score}</span>
            </div>
            <div>
              <span className="text-[#4CC9F0]">key_specs</span>:{' '}
              <span className="text-[#8B98A5]">{JSON.stringify(readerFacts?.key_specs || { anc: "true", battery_hours: "32" }, null, 2)}</span>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[#4CC9F0]">flags</span>:
              {(!readerFacts?.flags || readerFacts.flags.length === 0) ? (
                <span className="text-[#8B98A5]">[]</span>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {readerFacts.flags.map((fl, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-[#F5B84B]/15 border border-[#F5B84B]/40 text-[#F5B84B]"
                    >
                      {fl}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-3 p-3 rounded-[12px] bg-[#0B0F14] border border-[#1E2A36] text-[11px] text-[#8B98A5] flex items-start gap-2">
            <Lock className="w-4 h-4 text-[#3DDC97] shrink-0 mt-0.5" />
            <p>
              No free text from a listing reaches the Shopper. Descriptions, reviews, Q&A, and seller comments
              are discarded by the Quarantined Reader. The Shopper receives only schema-typed fields and
              fixed enum flags (instruction_like_text, urgency_language, promo_language, hidden_text, price_pressure).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
