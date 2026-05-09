# GreenBlock — Design TODOs

Items surfaced by `/plan-design-review` on 2026-05-09.

---

## Design Debt

### 1. Create DESIGN.md
**What:** Document the GreenBlock design system: typography (Bebas Neue / Syne / JetBrains Mono / DM Sans), color tokens (--void, --phosphor, --amber, --cobalt), radius (3px), spacing scale, and component patterns.
**Why:** All design decisions currently live only in `index.css`. New components default to system fonts and arbitrary colors instead of the established system.
**Context:** Without a DESIGN.md, every new component built (by humans or AI) re-invents the design system instead of inheriting it. This becomes visible as visual inconsistency over time.
**Depends on:** Nothing.

---

### 2. Audit `--text-mid` Contrast Ratio
**What:** `--text-mid: rgba(220, 242, 225, 0.65)` on `--void: #020705` may fail WCAG AA (4.5:1) at small font sizes. Used in `.actor-role`, `.feature-item p`, `.hero-sub`, `.step-desc`.
**Why:** Inaccessible to users with low vision; technically non-compliant.
**Context:** Fix is bumping opacity from `0.65` to `~0.75`. Use a contrast checker (e.g. webaim.org/resources/contrastchecker/) to verify exact value needed.
**Depends on:** Nothing.

---

### 3. Define ChainSelector UI Pattern
**What:** Specify whether the chain selector (Ethereum / Solana / Algorand) is rendered as tabs, a dropdown, or inline radio buttons. Also define how the wallet connection prompt changes per chain (MetaMask vs Phantom vs Pera Wallet).
**Why:** Without a defined pattern the component may look inconsistent with the dashboard, and users may be confused about which wallet extension to open.
**Context:** The decision depends on the demo flow: if evaluators are expected to switch chains during the demo, tabs are better (visible options). If the chain is set once per session, a compact dropdown is fine.
**Depends on:** Intended demo flow clarification.

---
