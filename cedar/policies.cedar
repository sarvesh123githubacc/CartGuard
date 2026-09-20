// CartGuard Deterministic Cedar Policies
// Integers only, no decimals. Uses @id annotations for reportability.

@id("permit-search")
permit(
    principal is Agent,
    action == Action::"Search",
    resource is Cart
);

@id("permit-add-to-cart")
permit(
    principal is Agent,
    action == Action::"AddToCart",
    resource is Cart
)
when {
    context.quantity <= context.requested_quantity &&
    context.total_paise <= context.budget_paise
};

@id("forbid-untrusted-seller")
forbid(
    principal is Agent,
    action == Action::"AddToCart",
    resource is Cart
)
when {
    context.seller_score_pct < 30
};

@id("forbid-change-address")
forbid(
    principal is Agent,
    action == Action::"ChangeAddress",
    resource is Cart
);

@id("permit-checkout")
permit(
    principal is Agent,
    action == Action::"Checkout",
    resource is Cart
)
when {
    context.total_paise <= context.budget_paise &&
    context.user_approved == true
};
