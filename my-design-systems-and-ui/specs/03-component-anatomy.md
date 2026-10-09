# 03 — Component Anatomy & Interface Blueprints

> **Detailed Blueprints, Layout Rules, and Prop Interfaces for Core Scribe Components.**
> Authored for Full-Stack Engineers & Product Designers during feature handoff.

---

## 1. System Cartridge Dock (`CartridgeDock.tsx`)

### Visual Blueprint
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ ┌───────────────┐ [⤓] │
│ │ SYSTEM // DOCK│ │ ⚡ Oracle Lens │ │ 👻 Swamp Lens │ │ 🤖 Strategist │ Ex. │
│ └───────────────┘ └───────────────┘ └───────────────┘ └───────────────┘     │
└─────────────────────────────────────────────────────────────────────────────┘
  ▲                   ▲                                                   ▲
  Header / Brand      Cartridge Item (Icon + Name + Signal Glow)          Export Action
```

### Layout & Micro-Interactions
* **Position:** Fixed at viewport bottom center (`bottom: 2.5rem`, `left: 50%`, `transform: translateX(-50%)`).
* **Z-Index:** `z-100` (above canvas nodes and cables).
* **Glass Surface:** `bg-[#1a1a1a]/80`, `backdrop-blur-xl`, `border: 1px solid rgba(255,255,255,0.1)`, `rounded-2xl`.
* **Dock Spring Animation:** Framer Motion initial `{ y: 100 }` → animate `{ y: 0 }`, transition `{ type: "spring", stiffness: 260, damping: 20 }`.
* **Hover Interaction:** Cartridge scales to `1.04`, background shifts from `rgba(255,255,255,0.04)` to `rgba(255,255,255,0.09)`.
* **Click Trigger:** Instantiates new block in workspace via UUID, plays ripple feedback.

---

## 2. Swarm Mode Selector (`SwampSelector.tsx`)

### Package Matrix
The Swarm simulation exposes four distinct adversarial AI packages:

```
┌───────────────────────────────────┬───────────────────────────────────┐
│ ✨ The Bauhaus Council            │ 💀 The Red Team (Adversarial)     │
│ Utility, Essentialism, Logic      │ Critical Analysis & Friction      │
│ Signal: Mint (#32d74b)            │ Signal: Red (#ff453a)             │
├───────────────────────────────────┼───────────────────────────────────┤
│ 💼 The Market Movers              │ ⚖️ The Deep Thinkers              │
│ Business Strategy & Virality      │ Ethics & Cognitive Sovereignty    │
│ Signal: Blue (#0a84ff)            │ Signal: Violet (#bf5af2)          │
└───────────────────────────────────┴───────────────────────────────────┘
```

### Component Props Schema
```typescript
interface SwampSelectorProps {
  notes: Array<{ id: string; name: string }>;
  onStart: (noteId: string, packageId: string, options?: { stepGate: boolean }) => void;
  loading: boolean;
  preSelectedNoteId?: string;
}
```

### Statutory & Cognitive Controls
* **EU AI Act Transparency Badge:** Header includes `EU AI Act Art. 50 // Synthetic Simulation` statutory notice.
* **Step-Gate Mode Toggle ([SOT-COMP-2026]):** Allows users to enforce deep pre-synthesis inspection of dissenting persona conflict points to prevent cognitive atrophy.
* **Selected Card State:**
  * **Active Border:** `2px solid var(--signal-orange)` with `box-shadow: 0 0 20px rgba(255,77,0,0.2)`.
  * **Badge Fill:** Package-specific signal background (`bg-[var(--signal-color)]/15` + `text-[var(--signal-color)]`).
  * **Personas Pill:** Monospaced badge displaying exact AI agent count (`10 AI AGENTS`).

---

## 3. Spatial Node Workbenches (`MacroBlock.tsx` & `MicroWorkbench.tsx`)

### Layout Blueprint
```
┌────────────────────────────────────────────────────────────┐
│ 🎛️ MICRO WORKBENCH: "Data Transformation Pipeline"     [✕] │ ← Header Chrome
├────────────────────────────────────────────────────────────┤
│ ● IN_PORT_1 (Vector Store)          OUT_PORT_1 (Result) ●  │ ← Terminal Cables
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Query: "Filter by high-confidence clusters"            │ │ ← Embedded Controls
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ [ ⚡ Run Pipeline ]              Status: 🟢 42 Nodes Sync   │ ← Footer Telemetry
└────────────────────────────────────────────────────────────┘
```

### Cable Terminal Port Coordinates
* **Input Anchors:** Left edge center (`x: 0`, `y: height / 2`).
* **Output Anchors:** Right edge center (`x: width`, `y: height / 2`).
* **Port Diameter:** `10px` circle with `2px` white border and inner signal fill.
* **Dynamic Pulse Cable ([SOT-COMP-3012]):** High-visibility animated pulse flows along active SVG paths (`animation: cablePulse 12s linear infinite`).

---

## 4. Scribe Strategist AI Feed (`ScribeStrategist.tsx`)

### Layout Blueprint & Cognitive Controls
* **Container:** Right/Left sliding HUD (`w-[370px]`, `h-full`, `bg-[#0a0b0c]/94`, `border border-white/8`, `backdrop-blur-2xl`).
* **Statutory Transparency:** Persistent `EU Art. 14 // Verified` and `AI Generated` indicators on assistant messages.
* **Empirical Rationale Inspector ([SOT-D3AUX3]):** Expandable drawer revealing underlying logic, confidence level (e.g. `94% Confidence`), and persona dissent status.
* **2-Step Verified Canvas Mutation ([SOT-COMP-3012]):** Replaces blind 1-click execution with an explicit confirmation step (`[ Confirm & Mutate Canvas ]`) ensuring human agency over spatial graph state.

---

## 5. BYOK API Key Modal (`BYOKModal.tsx`)

### Layout Blueprint
* **Backdrop:** `fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center`.
* **Dialog Card:** `w-full max-w-lg bg-[#121417] border border-white/10 rounded-3xl p-8 shadow-2xl`.
* **Security Notice:** Shield icon + "Keys are stored strictly in client localStorage; never transmitted to third parties."
* **Input Field:** Monospaced password input with reveal toggle button.
* **Validation States:** Real-time regex test (`sk-ant-...` or `AIza...`), green checkmark or red format error indicator.

---

## 6. Video Demonstration Paired Showcase (`DemoVideoBento.tsx`)

### Visual Blueprint
```
┌───────────────────────────────────────┬───────────────────────────────────────┐
│ ┌───────────────────────────────────┐ │ ┌───────────────────────────────────┐ │
│ │ ● ● ●  01 / Set API Key           │ │ │ ● ● ●  02 / Upload Files          │ │
│ ├───────────────────────────────────┤ │ ├───────────────────────────────────┤ │
│ │                                   │ │ │                                   │ │
│ │     [ Looping Video 16:9 ]        │ │ │     [ Looping Video 16:9 ]        │ │
│ │                                   │ │ │                                   │ │
│ ├───────────────────────────────────┤ │ ├───────────────────────────────────┤ │
│ │ Stored locally in your browser  ● │ │ │ Markdown, PDFs, and raw text    ● │ │
│ └───────────────────────────────────┘ │ └───────────────────────────────────┘ │
└───────────────────────────────────────┴───────────────────────────────────────┘
```

### Layout & Micro-Interactions
* **Grid Architecture:** 2-column paired layout (`grid-cols-1 md:grid-cols-2 gap-8`) for maximum video legible dimensions.
* **Video Dimensions:** Uncropped native 16:9 aspect ratio (`aspect-video`), `object-contain`, `autoPlay loop muted playsInline`.
* **Window Frame Header:** Subtle macOS-style traffic light dots (`● ● ●`), step number badge (`01`, `02`, etc.), and title.
* **Footer:** Crisp 1-line subtitle + accent color indicator pip.
* **Optimization Specs:** Transcoded with `libx264 -crf 25 -preset medium -pix_fmt yuv420p -movflags +faststart` with companion instant-paint poster JPGs.

---

## 7. Latest Node Highlight & Radar Beacon System

### Visual Blueprint
```
      ╔═══════════════════════════════════╗
      ║  INSIGHT              ● NEW       ║ ← Radiant Pill Chip
      ║  Autonomous Agent Conflict        ║
      ╚═══════════════════════════════════╝
         ▲                               ▲
      Animated Border Pulse       Glow Filter Halo (#latest-glow)
```

### Motion & Filter Architecture
* **SVG Drop Shadow Filter (`#latest-glow`):** `feDropShadow` with `stdDeviation: 8`, `flood-color: #0a84ff`, `flood-opacity: 0.85`.
* **Card Border Animation (`.latest-node-card`):** `@keyframes latest-border-pulse` oscillating between `#0a84ff` (blue) and `#30d158` (emerald).
* **Radar Halo (`.glow-new-node`):** `@keyframes pulse-glow` emitting radial diffusion rings (`box-shadow: 0 0 0 8px rgba(10,132,255,0)`).
* **Auto-Camera Glide:** When a new node cluster is synthesized, D3 zoom transforms smoothly center on `(midX, midY)` over `1000ms`.

---

## 8. Graph Intelligence Chatbot (`GraphChatbot.tsx`)

### Layout & Accessibility Specifications
* **Dialog Semantics:** `role="dialog"`, `aria-label="Graph Intelligence Chat"`, `aria-modal="false"`, `role="log"`, `aria-live="polite"`.
* **Keyboard Navigation:** `Escape` key closes window, `Tab` traps focus to active inputs, `focus-visible:ring-2` with `ring-orange-500`.
* **Color Contrast:** Full WCAG 2.1 AA compliance (contrast ratio ≥ 4.5:1 for all text in light and dark modes).
* **Live Node Injection:** Assistant response includes verified `Make Graph` trigger with grounded node payload injection into active canvas state.

