# CartGuard: Submission Writeup

### Problem
Autonomous AI shopping agents are vulnerable to **Indirect Prompt Injection (IPI)**. On e-commerce marketplaces, untrusted sellers author product descriptions, customer reviews, specs, and Q&As. Malicious sellers exploit this by hiding instructions inside listings—disguised as fake system prompts, HTML comments, polite assistant notes, or zero-width characters. When naive agents ingest this text, they get hijacked into ordering inflated quantities, rerouting deliveries to attacker addresses, adding bogus warranties, or bypassing checkout confirmations.

### Approach
CartGuard replaces probabilistic "LLM guards" with a defense-in-depth architecture combining architectural quarantine with deterministic policy evaluation:
1. **Quarantined Reader**: A specialized agent with **zero tools** that reads untrusted seller listings and outputs strictly typed JSON matching `ListingFacts`. Injected instructions are neutralized because the Reader lacks execution capabilities.
2. **Protected Shopper**: Equipped with purchasing tools, this agent operates exclusively on sanitized schema facts and never sees raw marketplace text.
3. **Cedar Policy Gatekeeper**: A mathematical policy backstop intercepting every tool call. Even if an LLM is hijacked or hallucinating, Cedar evaluates hard invariants before any mutation occurs.

### AWS Open-Source Usage
CartGuard runs 100% locally using two core open-source AWS technologies with zero AWS account or cloud dependencies:
- **AWS Strands Agents SDK** (`strands-agents[ollama]`): Orchestrates the multi-agent workflow, managing model bindings to local Ollama (`llama3.1:8b`), prompt isolation, and tool-call lifecycles for both the Quarantined Reader and Shopper agents.
- **AWS Cedar** (`cedarpy`): Evaluates declarative Cedar policies in microsecond Rust/C++ runtimes. Enforces `@id("forbid-excess-quantity")`, `@id("forbid-budget-overspend")`, `@id("forbid-address-mismatch")`, and `@id("forbid-unauthorized-checkout")` on every proposed action.

### What We Learned
1. **Prompt boundaries are illusions**: Models cannot reliably discern instructions from data within a shared prompt context. Relying on system prompts or LLM judges to filter attacks is fundamentally unsafe.
2. **Privilege separation works**: Stripping tools from the agent that reads untrusted text eliminates the confused-deputy vulnerability by design.
3. **Deterministic policy engines are essential for agentic commerce**: LLMs should propose intents, but formal policy engines like AWS Cedar must authorize actions. In our 200-call adversarial boundary stress test, Cedar permitted **zero safety invariant violations**, delivering a provable security firewall for autonomous agents.
