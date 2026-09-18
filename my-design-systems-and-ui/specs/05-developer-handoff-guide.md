# 05 — Developer Handoff & Project Transfer Guide

> **Engineering Contracts, Implementation Standards, and Repository Handover Runbook.**
> Authored for Frontend Engineers, Tech Leads, and Incoming Maintainers.

---

## 1. Frontend Tech Stack & Dependencies

The Scribe design system is implemented on top of the following core stack:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND TECH STACK                                │
├─────────────────────────────────────────────────────────────────────────────┤
│ • Framework:      Next.js 15+ (App Router) + React 19                        │
│ • Styling:        Tailwind CSS v4 + Vanilla CSS Custom Properties           │
│ • Animation:      Framer Motion (Spring physics & layout animations)        │
│ • Icons:          @phosphor-icons/react (Consistent 16px/20px weights)      │
│ • Physics/Canvas: D3.js (Force-directed graph layout & SVG cable curves)    │
│ • State Mgmt:     Zustand (`scribeV2Store.ts`, `byokStore.ts`)              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Component Implementation Contract

Every new UI component created for Scribe MUST follow these 5 golden rules:

### Rule 1: Use Semantic Tokens, Never Hardcode Colors
* ❌ Bad: `className="bg-[#141414] text-[#fff] border-[#333]"`
* ✅ Good: `className="bg-[var(--bg-card)] text-[var(--ink)] border border-[var(--border)]"` or import `TOKENS` from `tokens/tokens.ts`.

### Rule 2: Strict Framer Motion Spring Parameters
When animating modals, toolbars, or dock items, use calibrated spring constants:
```typescript
export const TACTICAL_SPRING = {
  type: "spring",
  stiffness: 300,
  damping: 24,
  mass: 0.8
};
```

### Rule 3: Support Controlled and Uncontrolled Props
All interactive components must expose standard callbacks:
```typescript
interface ScribeButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'signal';
  signalColor?: 'orange' | 'mint' | 'red' | 'blue' | 'violet';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}
```

### Rule 4: Performance Budget on Spatial Canvas
* **60 FPS Rule:** Canvas panning and node dragging must never trigger full React component tree re-renders. Use `useRef`, D3 simulation transforms, or Canvas2D/WebGL layers.
* **Backdrop Blur Throttling:** On low-power devices, reduce `backdrop-blur-xl` to `backdrop-blur-sm` to maintain smooth 60fps frame rates.

---

## 3. Project Transfer & Maintenance Runbook

If this project is transferred to a new engineering team or company:

### Step 1: Token Synchronization
Verify that all Figma variables match `tokens/tokens.json`. Any updates in Figma should be exported using Figma Tokens Studio and replaced in `tokens/tokens.json`.

### Step 2: Component Regression Testing
Open `showcase/index.html` to run visual sanity checks across all component states (`Idle`, `Hover`, `Active`, `Disabled`, `Loading`, `Error`).

### Step 3: Accessibility & Contrast Audit
Run an automated axe-core / Lighthouse audit against the living showcase to confirm zero contrast violations on dark mode surfaces.

### Step 4: Adding New Domain Components
When introducing new lenses or cartridges:
1. Define the lens metadata in `lib/v2/lenses.config.ts`.
2. Add its signal color and icon mapping to `CartridgeDock.tsx`.
3. Add the component preview and edge-case tests to `my-design-systems-and-ui/showcase/index.html`.
4. Update `specs/03-component-anatomy.md`.
