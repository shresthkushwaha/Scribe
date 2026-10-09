# Scribe Design System & UI Suite ⚡

> **The Single Source of Truth for Scribe Product Design, Tokens, Components, and Engineering Handoff.**
> Built for seamless collaboration, developer handoff, pitch presentations, and long-term project transfer.

---

## 🏛️ System Overview

The **Scribe Design System** is an engineering-grade, spatial design system engineered for high-density intelligence, node-graph orchestration, and tactical AI workflows. It combines a **Tactical Noir** dark canvas aesthetic with high-chroma signal accents, glassmorphic HUD surfaces, and precise typography.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                             SCRIBE DESIGN SYSTEM                            │
├───────────────────────┬───────────────────────────┬─────────────────────────┤
│   1. TOKENS & ATOMS   │   2. DOMAIN COMPONENTS    │    3. HANDOFF & SPECS   │
│   • Color & Contrast  │   • Cartridge Dock        │    • Design Principles  │
│   • Typography Scales │   • Swamp Persona Matrix  │    • Component Anatomy  │
│   • Glass & Elevation │   • Micro/Macro Workbenches│   • Edge Case Bench    │
│   • Motion & Springs  │   • Live Pulse Cables     │    • Engineering Guide  │
└───────────────────────┴───────────────────────────┴─────────────────────────┘
```

---

## 📁 Repository Structure

```
my-design-systems-and-ui/
├── README.md                          # You are here: Design System Index & Guidelines
├── figma-make-prompts.md              # Ready-to-paste prompts for Figma Make / First Draft
│
├── tokens/                            # Single Source of Truth for Tokens
│   ├── color-variables.json           # Dedicated color variables for Figma Variables & Tokens Studio
│   ├── tokens.json                    # Machine-readable token dictionary (Figma/Style Dictionary ready)
│   ├── tokens.ts                      # Strict TypeScript types & constant objects for frontend dev
│   └── tokens.css                     # CSS Custom Properties supporting Dark, Light & OLED modes
│
├── specs/                             # In-Depth Product Design & Engineering Specifications
│   ├── 01-design-principles.md        # Aesthetic Manifesto, Spatial Canvas & Visual Hierarchy
│   ├── 02-token-architecture.md       # 3-Tier Token Architecture & WCAG Contrast Specs
│   ├── 03-component-anatomy.md        # Blueprints, Props, Layout & Micro-interactions
│   ├── 04-edge-cases-and-states.md    # 7-State Machine, Stress Tests, Truncation & Zero-States
│   └── 05-developer-handoff-guide.md  # Engineering Contracts, Performance Budgets & Transfer Runbook
│
└── showcase/                          # Standalone Living Showcase (Zero-dependency)
    └── index.html                     # Interactive Sandbox: Theme switcher, state forcer, token copy & live previews
```

---

## 🚀 Quick Start

### 1. For Product Designers & Stakeholders
Open `showcase/index.html` in any web browser to explore:
* **Interactive Living Showcase:** Inspect all components in live interactive mode.
* **Live Theme Switcher:** Toggle between **Tactical Dark** (default), **Light Blueprint**, and **OLED Void**.
* **State Forcer:** Force `Hover`, `Active`, `Disabled`, `Loading`, or `Error` across all components simultaneously.
* **Edge-Case Stress Tester:** Preview text overflow, multiline pills, and empty states.
* **1-Click Token Copy:** Click any color swatch or component snippet to copy CSS variables / Tailwind tokens.

### 2. For Frontend Engineers
Import design tokens directly into your CSS or TypeScript components:

```tsx
// Using TypeScript Token Constants
import { TOKENS } from './tokens/tokens';

export function ScribePill({ label }: { label: string }) {
  return (
    <div style={{
      backgroundColor: TOKENS.color.surface.card,
      borderColor: TOKENS.color.hairline.default,
      borderRadius: TOKENS.radius.md,
      color: TOKENS.color.text.primary,
    }}>
      {label}
    </div>
  );
}
```

Or via CSS Custom Properties:
```css
@import "./tokens/tokens.css";

.scribe-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-tactical-md);
  backdrop-filter: blur(var(--blur-md));
}
```

---

## 🏷️ Key Design Pillars

| Pillar | Principle | Implementation Rule |
| :--- | :--- | :--- |
| **Tactical Noir Canvas** | Deep inky canvas (`#07080a` → `#0d0d0d`) with subtle hairline hierarchy | Avoid generic `#000` or `#fff` solid cards. Use layered surface tiers with `1px` rgba borders. |
| **High-Chroma Signals** | Accents are functional signals (Orange `#ff4d00`, Mint `#32d74b`, Violet `#bf5af2`) | Accents signify live execution, active lens state, or critical warnings. Never use for neutral backgrounds. |
| **Spatial Intelligence** | Node graphs, micro/macro workbenches, and cable topologies | Every element has anchor coordinates, physical connection ports, and depth layers. |
| **Industrial Typography** | DM Sans / Inter for UI data; Playfair Display for editorial headers | Strict typographic scale with monospaced metadata pills (`[0.2em]` letter spacing). |

---

## 🔄 Project Transfer & Handoff Readiness Checklist

When transferring this project to a new designer or developer:
- [x] **Token Fidelity**: All CSS variables and TypeScript tokens are 100% matched to `theme/dark.css` and `theme/default.css`.
- [x] **Component Schemas**: Comprehensive prop schemas and event signatures documented in `specs/03-component-anatomy.md`.
- [x] **Edge-Case Resilience**: Truncation, character overflow, and missing data behavior documented in `specs/04-edge-cases-and-states.md`.
- [x] **Accessibility**: WCAG 2.1 AA / AAA contrast ratings documented for all primary pairs in `specs/02-token-architecture.md`.
- [x] **Standalone Showcase**: Zero-dependency `showcase/index.html` runs out-of-the-box in any browser with no build step.
