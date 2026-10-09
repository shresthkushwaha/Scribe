# 07 — Scribe User Flows & System Sitemap

> **Comprehensive Architecture Blueprint, User Journey Flows, and Navigational Sitemap.**
> Designed for Product Strategy, Engineering Implementation, and UX Assurance.

---

## 1. System Sitemap & Application Architecture

```mermaid
graph TD
    Root["/ (Root Domain)"] --> Landing["Landing Page (/)"]
    Root --> App["Workspace App (/app)"]

    subgraph Landing_Experience ["Landing Experience"]
        Landing --> Hero["Hero: 'Your Thoughts, Graph-Engineered'"]
        Landing --> VideoDemos["Video Demonstration Pairs (6 Walkthroughs)"]
        Landing --> FeatureBento["Strategic Intelligence Bento Grid"]
        Landing --> BYOKBanner["Zero-Custody BYOK Architecture Banner"]
        Landing --> LandingFooter["Footer & GitHub Link"]
    end

    subgraph Core_Workspace ["Core Workspace (/app)"]
        App --> WorkbenchCanvas["Macro Spatial Canvas (Infinite Pan/Zoom)"]
        App --> DocSidebar["Document Sidebar & File Manager"]
        App --> TacticalNav["Tactical Topbar (Theme, Search, BYOK, Export)"]
        App --> BottomDock["Cartridge & Tool Dock (Lenses, Protocols)"]
        App --> StrategistDrawer["Strategist AI Co-Pilot Panel"]
    end

    subgraph Modals_And_Overlays ["Modals & Overlays"]
        TacticalNav --> BYOKModal["BYOK Settings Modal (Gemini / Local AI)"]
        TacticalNav --> ExportModal["Export Modal (JSON, MD, SVG, Text)"]
        DocSidebar --> UploadModal["Multi-File Ingestion (PDF, TXT, MD, DOCX)"]
        DocSidebar --> MultiGraphSelector["Multi-Document Graph Synthesizer"]
    end

    subgraph Spatial_Map_Views ["Spatial Map Views (Fullscreen Modals)"]
        App --> OatsenGigaMap["Oatsen GigaMap (Pillars -> Clusters -> Leaves)"]
        App --> OracleGigaMap["Radial Oracle GigaMap (Spherical Knowledge Orbit)"]
        OatsenGigaMap --> ProtocolInspector["Protocol Inspector & Rationale Ledger"]
        OatsenGigaMap --> GraphChatbot["Live Graph Intelligence Chatbot"]
        OatsenGigaMap --> RecoveryHUD["⚡ Offline Recovery HUD Banner"]
    end

    subgraph Local_Storage_Layer ["Client-Side Zero-Custody Storage"]
        App --> IndexedDB["IndexedDB (scribe_db_v2: workspaces, notes, sessions)"]
        App --> LocalStorage["LocalStorage (byok_config, gigamap_cache, theme)"]
    end
```

---

## 2. Universal User Flows

---

### User Flow 1: Onboarding & Zero-Custody BYOK Setup

```mermaid
sequenceDiagram
    autonumber
    actor User as Researcher / User
    participant UI as Scribe Topbar HUD
    participant Modal as BYOK Modal
    participant Store as Local Storage (byokStore)
    participant Google as Gemini 2.5 API

    User->>UI: Clicks "API Key" / Key Icon
    UI->>Modal: Opens BYOK Modal
    User->>Modal: Selects Provider (Gemini / Local Ollama) & Pastes Key
    User->>Modal: Clicks "Test Key"
    Modal->>Google: GET /v1beta/models/gemini-2.5-flash?key=KEY (0 Tokens)
    alt Key is Valid (HTTP 200)
        Google-->>Modal: HTTP 200 OK
        Modal->>UI: Shows "✅ Connection verified (Latency: 240ms)"
        User->>Modal: Clicks "Save Configuration"
        Modal->>Store: Saves encrypted key to LocalStorage
        Modal->>UI: Closes Modal & Updates Header Badge
    else Key is Invalid (HTTP 400 / 403)
        Google-->>Modal: HTTP 400/403 Error
        Modal->>UI: Shows "❌ Key verification failed. Please check your key."
    else Offline / Rate Limited (HTTP 429)
        Google-->>Modal: HTTP 429 / Network Error
        Modal->>UI: Shows "⚠️ Quota limit or Network issue. Offline mode available."
    end
```

---

### User Flow 2: Document Ingestion & Spatial Map Synthesis

```mermaid
flowchart TD
    Start([User opens Scribe]) --> Action{Upload or Select Note?}
    
    Action -- Upload Files --> Upload[Drag & Drop PDF, MD, TXT, DOCX]
    Action -- Select Existing --> Select[Pick note or Multi-Select in Sidebar]

    Upload --> Parse[Client-Side Parser: extract plain text]
    Select --> Parse
    
    Parse --> SynthCheck{Trigger Spatial Graph Synthesis}
    
    SynthCheck --> KeyCheck{Gemini Key configured?}
    
    KeyCheck -- No --> Heuristic[⚡ Generate Deterministic Heuristic Graph from Markdown Headings]
    KeyCheck -- Yes --> LLMCall[Dispatch 2-Pass Synthesis: Pillars -> Clusters -> Leaves]
    
    LLMCall --> APIStatus{API Call Result}
    APIStatus -- Success (HTTP 200) --> RenderAI[Render AI-Synthesized Spatial Semantic GigaMap]
    APIStatus -- Error / Timeout / 429 --> Fallback[⚡ Render Deterministic Heuristic Graph]
    
    Fallback --> ShowHUD[Display Top Offline Recovery HUD: '⚡ Offline Graph • Configure API Key']
    ShowHUD --> BYOKAction[User can 1-Click open BYOK Modal & Retry Live]
    
    RenderAI --> Done([Interactive Spatial Canvas Ready])
    Fallback --> Done
```

---

### User Flow 3: Workbench Protocol Execution (Human-in-the-Loop)

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant Map as Spatial Canvas
    participant Inspector as Sidebar Protocol Inspector
    participant AI as Oracle AI Brain (Gemini 2.5)
    participant Store as Scribe Store & IndexedDB

    User->>Map: Clicks Node (e.g. Leaf "Edge Ingestion Latency")
    Map->>Inspector: Displays Node details, category & provenance
    User->>Inspector: Selects Protocol (e.g. "SCAMPER" or "First Principles")
    
    alt Step-Gate Mode is Active (EU AI Act Art. 14)
        Inspector->>User: Renders Amber Confirmation Gate: "Confirm Execution?"
        User->>Inspector: Clicks Confirm Protocol
    end

    Inspector->>AI: Dispatches targeted prompt with selected node context
    AI-->>Inspector: Returns 3-5 Satellite Nodes + Systemic Rationale
    Inspector->>Map: Dynamically places Satellite Nodes using Multi-Directional Smart Search
    Inspector->>Store: Persists Session into Workspace History
    Map->>User: Animates Beacon Glow on newly synthesized nodes
```

---

### User Flow 4: Graph Intelligence Chatbot & Live Node Injection

```mermaid
sequenceDiagram
    autonumber
    actor User as User
    participant Chat as Graph Chatbot Modal
    participant Brain as Strategist Brain
    participant Canvas as Oatsen Spatial Canvas

    User->>Canvas: Clicks "Chatbot" pill in bottom HUD (or presses Cmd+K)
    Canvas->>Chat: Opens Graph Intelligence Chatbot Modal
    User->>Chat: Asks question: "What are the biggest systemic risks in this graph?"
    Chat->>Brain: Queries Graph Context (all Pillars, Clusters, Leaves & Satellites)
    Brain-->>Chat: Streams structured strategic response with citations
    Chat->>User: Displays response with [Add to Graph as Satellite] action
    User->>Chat: Clicks "Add to Graph"
    Chat->>Canvas: Injects new synthetic insight node directly into closest cluster
    Canvas->>User: Pulses new node with cyan glow
```

---

### User Flow 5: Multi-Format Export & Sharing

```mermaid
flowchart TD
    A[User Clicks Export Button] --> B[Export Modal Opens]
    B --> C{Select Export Format}
    
    C -- Markdown Manifesto --> D[Compile structured markdown with headings, bullet clusters, and synthesis notes]
    C -- Systemic JSON Graph --> E[Generate complete topological JSON with nodes, links, sessions, and coordinates]
    C -- Vector SVG Canvas --> F[Serialize D3 SVG DOM tree into standalone high-res vector file]
    C -- Clipboard Copy --> G[Copy structured text directly to OS clipboard]
    
    D --> Download[Trigger Browser File Download]
    E --> Download
    F --> Download
    G --> Toast[Display Success Toast: 'Copied to Clipboard!']
```

---

## 3. Route & Component Navigational Sitemap

| Route / Surface | Component | Description & Key Responsibilities | Access Level |
| :--- | :--- | :--- | :--- |
| `/` | `LandingView.tsx` | High-converting landing page with 6 paired demo videos, interactive feature bento, and instant CTA. | Public |
| `/app` | `ScribeV2App.tsx` | Core workspace application containing the macro spatial canvas, document manager, and tools. | Client-side Zero-Login |
| `/app` (Spatial) | `OatsenGigaMap.tsx` | 3-tier columnar hierarchical spatial map with multi-directional smart session placement. | Client-side Modal |
| `/app` (Radial) | `OracleGigaMap.tsx` | Spherical orbital knowledge graph for intuitive conceptual exploration. | Client-side Modal |
| Modal | `BYOKModal.tsx` | Zero-custody API key manager with real-time ping verification for Gemini & Local AI. | Global Overlay |
| Modal | `GraphChatbot.tsx` | Grounded conversational AI assistant capable of live canvas node injections. | Spatial Overlay |
| Modal | `MultiGraphModal.tsx` | Cross-document synthesis tool allowing simultaneous graph creation from multiple sources. | Workspace Overlay |
| Spec | `/specs/*` | Design system specifications, tokens, component anatomy, edge cases, and compliance audits. | Developer Documentation |
| Showcase | `/showcase/index.html` | Interactive HTML UI component kit showcase demonstrating all tokens, states, and widgets. | Static Showcase |
