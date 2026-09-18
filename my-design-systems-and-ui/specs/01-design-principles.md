# 01 — Design Principles & Aesthetic Manifesto

> **Scribe: The Tactical Noir Spatial Intelligence Environment**
> Authored for Product Designers, Creative Directors, and System Architects.

---

## 1. The Core Design Thesis

Scribe is not a generic SaaS productivity dashboard. It is an **industrial-grade spatial workbench for strategic intelligence, adversarial simulation, and high-dimensional thinking**. 

Standard productivity software relies on flat white boxes, low contrast grey borders, and cluttered toolbars. Scribe replaces this with **Tactical Noir**:
- **Continuous Inky Canvas:** Backgrounds are deep obsidian and near-black surfaces (`#07080a` → `#0d0d0d`).
- **Precision Hairline Chrome:** 1px translucent borders (`rgba(255, 255, 255, 0.08)`) outline modular instruments rather than thick cards.
- **High-Chroma Functional Signals:** Vibrant accents (Scribe Flame `#ff4d00`, Bauhaus Mint `#32d74b`, Red Team Red `#ff453a`) are reserved exclusively for live execution, system states, and critical warnings.
- **Tactile Spatial Depth:** Glassmorphic HUD elements float above node canvases with calibrated backdrop blurs (`12px` - `24px`) and multi-tier ambient shadows.

---

## 2. Four Core Pillars

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             FOUR CORE PILLARS                               │
├─────────────────────┬─────────────────────┬─────────────────────────────────┤
│ 1. TACTICAL NOIR    │ 2. SPATIAL TOPOLOGY │ 3. HIGH-SIGNAL CHROMATICS       │
│ Inky dark surfaces, │ Physical nodes, D3  │ Strict color discipline:        │
│ calibrated contrast,│ cable connectors &  │ Accents signify state, active   │
│ hairline glass HUDs.│ fluid canvas space. │ execution or warnings.          │
└─────────────────────┴─────────────────────┴─────────────────────────────────┘
```

### Pillar 1: Tactical Noir & Surface Hierarchy
Surfaces must adhere to a strict 4-step surface ladder:
1. **Level 0 (Canvas Base - `#07080a`):** Infinite spatial graph background.
2. **Level 1 (Dock / Muted Panel - `#0a0b0d` / `rgba(18,20,23,0.72)`):** Background for floating toolbars and docked cartridges.
3. **Level 2 (Workbench Cards - `#141414`):** Micro and Macro node workbenches.
4. **Level 3 (Interactive Hover / Overlays - `#1a1a1a`):** Active selections, modals, and context menus.

### Pillar 2: Spatial Topology & Physicality
- Information in Scribe is **spatial**, not linear. Concepts exist as **Nodes**, datasets exist as **Cartridges**, and relationships exist as **Live Cables**.
- Every block has explicit input/output terminal ports with micro-glows indicating data throughput.
- Physical spring damping (`cubic-bezier(0.2, 0.8, 0.2, 1)`) is applied to all drag, zoom, and dock movements.

### Pillar 3: High-Signal Chromatics (No Decorative Accent Spam)
- Every color in Scribe conveys meaning:
  - **Scribe Flame (`#ff4d00`):** System operations, primary CTA, active dock insertion.
  - **Mint Signal (`#32d74b`):** The Bauhaus Council, verified logic paths, healthy data transfer.
  - **Red Team (`#ff453a`):** Adversarial attacks, critical risk, system resistance points.
  - **Violet Signal (`#bf5af2`):** Deep Thinkers, ethical & cognitive sovereignty simulations.
  - **Blue Signal (`#0a84ff`):** Market Movers, external data ingest, API hooks.
  - **Amber (`#fbbf24`):** Oracle recommendations and cautionary heuristics.

### Pillar 4: Industrial Typographic Hierarchy
- **Editorial Headings:** `Playfair Display` serif (bold, elegant, humanistic contrast).
- **Tactical UI & Data:** `DM Sans` / `Inter` with tabular figures for numbers and labels.
- **System Badges & Telemetry:** `JetBrains Mono` / Monospaced uppercase with `[0.2em]` letter spacing (e.g. `SYSTEM // DOCK`, `STATUS: ARMED`).

---

## 3. Product Designer "Do's and Don'ts"

| Rule | ✅ DO | ❌ NEVER |
| :--- | :--- | :--- |
| **Card Borders** | Use `1px solid rgba(255,255,255,0.08)` for clean tactical edge definition | Do not use solid opaque white/grey borders (`#ccc` or `#fff`) |
| **Accents** | Use saturated accents on tiny badges, cable pulses, and focus outlines | Do not flood entire background panels with neon colors |
| **Spacing** | Use strict 4px / 8px incremental rhythm (`gap-2`, `p-4`, `py-3`) | Do not use arbitrary padding like `p-[13px]` |
| **Card Corners** | Use `14px` for cards, `20px` for dialogs/docks, `9999px` for pills | Do not mix sharp `0px` and `30px` bubbles arbitrarily |
| **Icons** | Use `@phosphor-icons` with consistent `16px` (sm) or `20px` (md) stroke | Do not mix icon sets or stroke weights |
