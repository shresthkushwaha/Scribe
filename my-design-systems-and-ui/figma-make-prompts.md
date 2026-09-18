# Scribe Design System — Figma Make Prompts & UI Kit Generator

Use these prompts directly in **Figma Make** (or Figma AI / First Draft) to automatically generate the complete Scribe "Tactical Noir" UI Kit with auto-layouts, components, states, and compliance artifacts.

---

## 🚀 Prompt 1: Master UI Kit Sticker Sheet (Recommended)

> **Instructions**: Copy and paste the block below into Figma Make's prompt bar.

```text
Design a complete, production-grade Dark Mode Design System and UI Component Kit named "Scribe Tactical Noir UI Kit".

1. THEME & VISUAL IDENTITY:
- Style: Tactical Noir, futuristic telemetry, refined glassmorphism, crisp hairline borders.
- Background Canvas: #07080a with subtle dark cards #141414, borders rgba(255, 255, 255, 0.08).
- Accent Signal Colors:
  * Primary Flame / Action: #ff4d00 (Signal Orange)
  * Verified / Success: #32d74b (Bauhaus Mint)
  * Critical Risk / Adversarial: #ff453a (Signal Red)
  * Data Integration: #0a84ff (Electric Blue)
  * AI / Neural Lens: #bf5af2 (Signal Violet)
  * Heuristic / Advisory: #fbbf24 (Signal Amber)
- Typography: Clean modern grotesque sans-serif (DM Sans) for UI, monospaced (JetBrains Mono) for telemetry badges/pills, elegant serif (Playfair Display) for editorial titles.
- Corner Radii: 8px (small controls), 14px (cards/buttons), 20px (modals), 9999px (pills/badges).

2. COMPONENT LIBRARY (Create components with Auto-Layout & Variants):
A. BUTTONS & CONTROLS:
  - Primary Action Button: Flame orange fill (#ff4d00), text #000000 font-bold, radius 14px, with hover glow.
  - Secondary / Ghost Button: Dark card fill (#141414), border 1px rgba(255,255,255,0.12), text #f2f2f7.
  - Danger Button: Deep red border with 10% red fill, text #ff453a.
  - Interactive States Matrix: Idle, Hover, Pressed, Focus (orange ring), Disabled (30% opacity), Loading (spinner).

B. STATUS & TELEMETRY PILLS:
  - 9px uppercase bold monospace pills with glowing 6px status dots:
  - Variants: "ONLINE" (mint dot), "SYNTHESIZING" (orange pulse dot), "OFFLINE MODE" (amber dot), "API FAILED" (red dot), "Art. 14 VERIFIED" (mint check), "Art. 50 SYNTHETIC" (violet dot).

C. SCRIBE DOMAIN CARDS & NODES:
  - Cartridge Dock: Floating glass pill dock holding tactical tool icons, active cartridge highlighted with orange hairline border and neon indicator.
  - Swamp Package Card: 320px wide dark card (#141414), package category pill at top, bold title, descriptive copy, version tag, and "Install Package" button.
  - Canvas Step Nodes: Flow graph nodes with category color bar (orange, mint, or violet), input/output connector dots, node title, execution timestamp, and status pill.

D. RESILIENCE & EDGE CASE MODALS:
  - BYOK (Bring Your Own Key) Modal: 440px wide modal with provider tabs (OpenAI, Anthropic, Gemini, Local Ollama), password input for API key, masked state, and a test connection status badge.
  - Offline Fallback HUD: Amber warning banner with broken cloud icon, message "Network connection interrupted — Local cached session active", and "Retry Connection" action pill.
  - Art. 14 Human Oversight Step-Gate: Verification dialogue card with step checklist, risk score badge ("HIGH RISK / Art. 14"), and dual-step "Approve Pipeline" vs "Abort Execution" buttons.

3. CANVAS LAYOUT:
- Layout everything neatly on a 1920x1080 canvas frame with organized section headers, labeled component categories, and clean auto-layout spacing (16px and 24px gaps).
```

---

## 🧩 Prompt 2: Core Atoms, Controls & Interactive States

> **Instructions**: Use this prompt if you want a dedicated sheet strictly for buttons, form inputs, toggles, badges, and the 7-state interaction matrix.

```text
Design a high-density "Atoms & Component States Sticker Sheet" for a dark mode intelligence tool:
- Canvas: #07080a. Card Surfaces: #141414. Hairlines: rgba(255,255,255,0.08).
- Typography: DM Sans + JetBrains Mono.
- Include:
  1. Buttons: Primary (#ff4d00 fill), Secondary (bordered), Danger (#ff453a), Subtle Ghost.
  2. 7-State Component Matrix showing: Idle, Hover, Pressed, Focused (orange border), Disabled, Loading (with animated indicator), and Error (red border + message).
  3. Form Inputs: Dark input fields with label, helper text, focus state (#ff4d00 halo), and error state (#ff453a hairline with error micro-copy).
  4. Status Badges: Monospace 9px uppercase pills with 6px dot indicators in Mint (#32d74b), Flame Orange (#ff4d00), Amber (#fbbf24), and Red (#ff453a).
  5. Segmented Controls / Tabs: Dark pill container with active sliding tab (#1e1e1e with white text) and inactive tabs (#71717a text).
```

---

## ⚡ Prompt 3: Domain Components (Cartridge Dock, Swamp Cards, Flow Nodes)

> **Instructions**: Use this prompt for Scribe's proprietary workbench elements.

```text
Design a Tactical Noir UX workbench component kit for an AI-assisted knowledge platform:
- Style: Ultra-dark #07080a background, sharp precision, neon signal colors.
- Component 1: Floating Cartridge Dock — A frosted glass dock (rgba(26,26,26,0.85), blur 24px, border 1px rgba(255,255,255,0.1)) containing 5 cartridge slots with icons (Graph, Swarm, Code, Telemetry, Settings). Active slot has an orange neon top bar and orange icon.
- Component 2: Swamp Module Cards — Dark #141414 cards displaying AI agent modules. Each card contains a category tag (e.g., "NEURAL SYNTHESIS" in violet, "RED TEAM" in red), title, parameter badges (Latency: 140ms, Tokens: 2.4k), and action button.
- Component 3: Graph Canvas Step Nodes — Interactive workflow nodes with port connector circles on left/right edges, status banner, expandable details accordion, and step execution progress bar.
- Component 4: Oracle GigaMap Telemetry HUD — Floating top-right overlay with mini map, zoom controls (+ / - / 100%), node counter pill (1,248 nodes), and live FPS/sync indicator.
```

---

## 🛡️ Prompt 4: Resilience, Edge Cases & EU AI Act Compliance

> **Instructions**: Use this prompt to generate the portfolio-grade governance, edge cases, and resilience UI.

```text
Design an EU AI Act & System Resilience UI Kit for a mission-critical AI platform:
- Theme: Tactical Noir, dark slate #07080a, high-visibility signal accents.
- Frame 1: BYOK (Bring Your Own Key) & API Recovery Modal
  * Provider selector chips (Gemini 1.5 Pro, Claude 3.5 Sonnet, GPT-4o, Local Ollama).
  * API Key input field with secure masking and visibility toggle.
  * Live status indicator: "Validating Key with Provider..." transitioning to "Rate Limit Exceeded (HTTP 429) — Switching to fallback cache".
  * Action row: "Test Connection", "Apply & Encrypt".
- Frame 2: Offline Resilience Banner & Circuit Breaker HUD
  * Amber warning banner: "Network Connection Dropped — System operating in local cached state (Read-Only)".
  * Circuit Breaker HUD: Red indicator showing trip threshold (5/5 failed attempts) with manual reset switch.
- Frame 3: EU AI Act Article 13 & 14 Compliance Panel
  * Article 13 Transparency card: Model card badge, confidence interval score (94.2%), and synthetic output declaration.
  * Article 14 Human-in-the-Loop Step-Gate: Intercept modal blocking automated execution until a human operator checks 3 safety checkboxes and clicks "Confirm Authorisation".
  * Article 50 Synthetic Media Pill: Monospace tag "AI GENERATED CONTENT • ART. 50 VERIFIED" with purple indicator dot.
```

---

## 📋 How to Use in Figma

1. Open **Figma**.
2. Press `Cmd + K` (Mac) or `Ctrl + K` (Windows) or open the **Figma AI / Make Designs** toolbar.
3. Paste **Prompt 1 (Master UI Kit Sticker Sheet)** into the input box.
4. Hit **Enter / Generate**.
5. Once generated:
   - Use **Prompt 2, 3, or 4** to expand individual component libraries or deeper variant states.
   - You can also import the exact token file from `my-design-systems-and-ui/tokens/tokens.json` directly into the **Tokens Studio** or **Figma Variables** plugin for automatic token syncing.
