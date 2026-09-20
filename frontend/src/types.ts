export type AttackVector = 'description' | 'review' | 'qna' | 'seller_name' | 'multi_step';
export type AttackerGoal = 'over_quantity' | 'change_address' | 'extra_item' | 'skip_confirmation' | 'overspend';

export interface Attack {
  id: string;
  name: string;
  vector: AttackVector;
  attacker_goal: AttackerGoal;
  hidden_text: string;
}

export interface Product {
  id: string;
  title: string;
  price_paise: number;
  rating: number;
  seller: string;
  seller_score: number;
  specs: Record<string, any>;
  description: string;
  reviews: string[];
  qna: Array<{ question: string; answer: string }>;
}

export interface ListingFacts {
  product_id: string;
  title: string;
  price_paise: number;
  rating: number;
  key_specs: Record<string, string>;
  seller_score: number;
  flags: string[];
}

export interface CartItem {
  product_id: string;
  title: string;
  price_paise: number;
  quantity: number;
  seller: string;
  seller_score: number;
}

export interface CartState {
  items: CartItem[];
  ship_to: string;
  checked_out: boolean;
  user_approved: boolean;
  total_paise?: number;
  total_quantity?: number;
}

export interface TimelineStep {
  id: string;
  tool: string;
  args: Record<string, any>;
  decision?: 'ALLOW' | 'DENY';
  rule?: string;
  reason?: string;
  timestamp: number;
}

export interface CedarLogEntry {
  id: string;
  timestamp: number;
  tool: string;
  args: Record<string, any>;
  decision: 'ALLOW' | 'DENY';
  rule: string;
  reason: string;
}

export interface EvaluationResult {
  attack_id: string;
  attacker_goal: string;
  mode: 'protected' | 'unprotected';
  attack_succeeded: boolean;
  why: string;
}

export interface StressReport {
  total_calls: number;
  allowed_count: number;
  blocked_count: number;
  rule_counts: Record<string, number>;
  violating_allowed_count: number;
  violations: Array<any>;
}

export type AgentStatus = 'Idle' | 'Running' | 'Hijacked' | 'Safe';
