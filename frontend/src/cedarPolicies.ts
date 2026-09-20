export interface CedarRuleDef {
  id: string;
  name: string;
  policyDsl: string;
  explanation: string;
}

export const CEDAR_POLICIES: Record<string, CedarRuleDef> = {
  'permit-search': {
    id: 'permit-search',
    name: 'Permit Search',
    policyDsl: `@id("permit-search")
permit(
    principal is Agent,
    action == Action::"Search",
    resource is Cart
);`,
    explanation: 'Unconditionally allows agents to search the product catalog for candidate shopping items.',
  },
  'permit-add-to-cart': {
    id: 'permit-add-to-cart',
    name: 'Permit Add To Cart',
    policyDsl: `@id("permit-add-to-cart")
permit(
    principal is Agent,
    action == Action::"AddToCart",
    resource is Cart
)
when {
    context.quantity <= context.requested_quantity &&
    context.total_paise <= context.budget_paise
};`,
    explanation: 'Allows adding items only if the quantity does not exceed user intent and total cart cost remains strictly within the authorized budget.',
  },
  'forbid-untrusted-seller': {
    id: 'forbid-untrusted-seller',
    name: 'Forbid Untrusted Seller',
    policyDsl: `@id("forbid-untrusted-seller")
forbid(
    principal is Agent,
    action == Action::"AddToCart",
    resource is Cart
)
when {
    context.seller_score_pct < 30
};`,
    explanation: 'Deterministic forbid backstop blocking items from sellers whose trust score is below the 30% safety threshold.',
  },
  'forbid-change-address': {
    id: 'forbid-change-address',
    name: 'Forbid Change Address',
    policyDsl: `@id("forbid-change-address")
forbid(
    principal is Agent,
    action == Action::"ChangeAddress",
    resource is Cart
);`,
    explanation: 'Strictly forbids automated agents from modifying shipping destinations. Destination changes can only be initiated directly by the human user.',
  },
  'permit-checkout': {
    id: 'permit-checkout',
    name: 'Permit Checkout',
    policyDsl: `@id("permit-checkout")
permit(
    principal is Agent,
    action == Action::"Checkout",
    resource is Cart
)
when {
    context.total_paise <= context.budget_paise &&
    context.user_approved == true
};`,
    explanation: 'Authorizes payment checkout only when the user has explicitly confirmed approval and the total is within the stated budget.',
  },
  'default-deny': {
    id: 'default-deny',
    name: 'Cedar Closed-World Default Deny',
    policyDsl: `// Cedar Closed-World Principle (RFC 001)
// Any request that is not explicitly permitted by a matching permit policy
// evaluates deterministically to Deny.`,
    explanation: 'Enforces least-privilege security: unpermitted actions or requests exceeding numerical boundaries fail closed automatically.',
  },
};
