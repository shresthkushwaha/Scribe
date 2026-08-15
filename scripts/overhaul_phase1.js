/**
 * Strategist Engine Overhaul: Phase 1 - Execution Engine
 * Replaces executeStrategistSkillDirect + routeStrategistMessage + handleStrategistMutate
 * with a universal, unconstrained AI query engine.
 */
const fs = require('fs');
const file = 'c:/Users/kushr/.gemini/antigravity/scratch/scribe/components/GraphCanvas.tsx';
let content = fs.readFileSync(file, 'utf8');
let changed = 0;

// ─── 1. REPLACE THE SKILL EXECUTION ENGINE ───────────────────────────────────
// Old: executeStrategistSkillDirect (rigid per-skill JSON schemas)
// New: executeStrategistQuery (universal, free-form, returns standardized node schema)

const OLD_EXEC_START = `    // ── Strategist: Execute a skill directly via Gemini API ───────────────────
    const executeStrategistSkillDirect = async (skillId: string, content: string, canvasNodes: Node[]): Promise<any | null> => {`;

const NEW_EXEC_BLOCK = `    // ── Strategist: Universal Query Engine (unrestricted, real-world AI analysis) ──
    const executeStrategistQuery = async (userQuery: string, skillHint: string, content: string, canvasNodes: Node[]): Promise<{
        sessionTitle: string;
        sessionCategory: string;
        nodes: Array<{
            label: string;
            category: 'CRITIQUE' | 'INSIGHT' | 'FACT' | 'OPPORTUNITY' | 'RISK' | 'PATH' | 'QUESTION' | 'DATA';
            summary: string;
            intensity?: number;
        }>;
        chatSummary: string;
    } | null> => {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) { console.error('[Strategist] No API key found.'); return null; }

        const url = \`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite-preview:generateContent?key=\${apiKey}\`;

        const canvasContext = canvasNodes.slice(0, 30).map(n => \`- [\${n.type}] \${n.label}: \${(n.summary || '').slice(0, 80)}\`).join('\\n');

        const systemInstruction = \`You are SCRIBE STRATEGIST — an elite strategic intelligence engine trained on management consulting, competitive intelligence, systems thinking, and real-world business analysis. You have access to broad real-world knowledge.

CORE DIRECTIVE:
- Respond to the user's query with substantive, specific, analytically rich nodes
- You are NOT limited to any technique framework. Provide whatever is most useful: real market data, historical analogies, competitive landscape, risk factors, tactical recommendations, etc.
- Each node must be SPECIFIC, NAMED, and DISCOVERABLE — not generic platitudes
- Session title must clearly name what type of analysis was done

NODE CATEGORIES (choose the most accurate per node):
- CRITIQUE: An adversarial challenge, flaw, or assumption attack
- INSIGHT: A non-obvious pattern, synthesis, or revelation
- FACT: A real-world data point, historical precedent, or market reality
- OPPORTUNITY: An unexploited leverage point or strategic whitespace
- RISK: A failure mode, threat vector, or vulnerability
- PATH: A recommended action, step, or strategic move
- QUESTION: A critical open question that must be resolved
- DATA: A quantitative benchmark, metric, or comparable

SKILL HINT (use as analytical lens, not rigid constraint): \${skillHint}

OUTPUT SCHEMA (strict JSON, no markdown):
{
  "sessionTitle": "Descriptive title like 'Competitive Landscape Red Team' or 'GTM Strategy Gaps'",
  "sessionCategory": "adversarial|exploratory|risk|synthesis|research",
  "nodes": [
    {
      "label": "SPECIFIC NAME (3-6 words, all caps or title case)",
      "category": "CRITIQUE|INSIGHT|FACT|OPPORTUNITY|RISK|PATH|QUESTION|DATA",
      "summary": "2-4 sentences of substantive analysis grounded in the source material and real-world context.",
      "intensity": 0.0-1.0
    }
  ],
  "chatSummary": "2-3 sentence plain-language summary of what was found and why it matters."
}\`;

        const userMessage = \`USER QUERY: "\${userQuery}"

SOURCE CONTENT:
\${content.slice(0, 5000)}

CURRENT CANVAS NODES (for context):
\${canvasContext}

Produce 8-14 high-signal nodes. Prioritize specificity over breadth.\`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemInstruction }] },
                    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
                    generationConfig: { responseMimeType: 'application/json', temperature: 0.75 }
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('[Strategist] API Error:', response.status, errText);
                return null;
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) { console.error('[Strategist] Empty response'); return null; }

            try {
                return JSON.parse(text);
            } catch (e) {
                const match = text.match(/\\{[\\s\\S]*\\}/);
                if (match) return JSON.parse(match[0]);
                console.error('[Strategist] JSON parse failed:', text.slice(0, 300));
                return null;
            }
        } catch (err) {
            console.error('[Strategist] Network error:', err);
            return null;
        }
    };`;

// Find the old function start and its end (the next function definition)
const execStart = content.indexOf(OLD_EXEC_START);
if (execStart !== -1) {
    const routerStart = content.indexOf('    // ── Strategist: Route user message to a skill', execStart);
    const beforeExec = content.substring(0, execStart);
    const afterExec = content.substring(routerStart); // keep router and everything after
    content = beforeExec + NEW_EXEC_BLOCK + '\n\n' + afterExec;
    console.log('✅ Replaced executeStrategistSkillDirect with executeStrategistQuery');
    changed++;
} else {
    console.log('⚠️  executeStrategistSkillDirect start not found');
}

// ─── 2. UPDATE handleStrategistSend TO USE NEW ENGINE ────────────────────────
// Replace the call site: instead of calling executeStrategistSkillDirect, call executeStrategistQuery

const OLD_SEND_CALL = `            // 2. Execute the skill with proper context
            const executionData = await executeStrategistSkillDirect(intent.skillId, sourceContent, currentNodes);

            if (executionData) {
                const resultText = getSkillResultSummary(intent.skillId, executionData);
                setStrategistMessages(prev => [...prev, {
                    role: 'assistant',
                    text: resultText,
                    skillId: intent.skillId,
                    executionData,
                    timestamp: Date.now()
                }]);

                // 3. Mutate the canvas
                handleStrategistMutate(intent.skillId, executionData, currentNodes);
            } else {
                setStrategistMessages(prev => [...prev, {
                    role: 'assistant',
                    text: "The analysis returned no actionable data. Please check your API key or try a different query.",
                    timestamp: Date.now()
                }]);
            }`;

const NEW_SEND_CALL = `            // 2. Execute the universal query engine
            const result = await executeStrategistQuery(text, intent.skillId, sourceContent, currentNodes);

            if (result) {
                setStrategistMessages(prev => [...prev, {
                    role: 'assistant',
                    text: result.chatSummary,
                    sessionTitle: result.sessionTitle,
                    sessionCategory: result.sessionCategory,
                    nodeCount: result.nodes.length,
                    timestamp: Date.now()
                }]);

                // 3. Mutate the canvas with universal node schema
                handleStrategistMutate(result, currentNodes);
            } else {
                setStrategistMessages(prev => [...prev, {
                    role: 'assistant',
                    text: "The analysis returned no data. Check the console for API errors.",
                    timestamp: Date.now()
                }]);
            }`;

if (content.includes(OLD_SEND_CALL)) {
    content = content.replace(OLD_SEND_CALL, NEW_SEND_CALL);
    console.log('✅ Updated handleStrategistSend call site');
    changed++;
} else {
    console.log('⚠️  handleStrategistSend call site pattern not found');
}

// ─── 3. REPLACE handleStrategistMutate WITH UNIVERSAL HANDLER ────────────────
const OLD_MUTATE_START = `    // ── Strategist: Convert AI data to V1 D3 nodes ────────────────────────────
    const handleStrategistMutate = (skillId: string, data: any, baseNodes: Node[]) => {`;

const newMutate = `    // ── Strategist: Universal node injection (all categories) ──────────────────
    const handleStrategistMutate = (result: any, baseNodes: Node[]) => {`;

const mutateStart = content.indexOf(OLD_MUTATE_START);
if (mutateStart !== -1) {
    // Find the end of the old function
    const mutateEnd = content.indexOf('\n    };\n\n    // ── Connected-node set', mutateStart);
    if (mutateEnd !== -1) {
        const newMutateBody = `    // ── Strategist: Universal node injection (all categories) ──────────────────
    const handleStrategistMutate = (result: any, baseNodes: Node[]) => {
        if (!result?.nodes?.length) {
            console.warn('[Strategist] No nodes in result to inject');
            return;
        }

        const newNodes: Node[] = [];
        const newLinks: GraphLink[] = [];
        let counter = 0;
        const generateId = () => \`strat-\${Date.now()}-\${counter++}\`;

        // Find a central anchor to orbit around
        const anchor = baseNodes.find(n => n.type === 'ANCHOR' || n.type === 'EPICENTER') || baseNodes[0];
        const cx = anchor?.x || 0;
        const cy = anchor?.y || 0;

        // Category → visual config mapping
        const CATEGORY_CONFIG: Record<string, { type: string; resonanceScore: number; r: number }> = {
            'CRITIQUE':    { type: 'STRAT_CRITIQUE',    resonanceScore: 85, r: 52 },
            'INSIGHT':     { type: 'STRAT_INSIGHT',     resonanceScore: 75, r: 56 },
            'FACT':        { type: 'STRAT_FACT',        resonanceScore: 60, r: 44 },
            'OPPORTUNITY': { type: 'STRAT_OPPORTUNITY', resonanceScore: 90, r: 60 },
            'RISK':        { type: 'STRAT_RISK',        resonanceScore: 95, r: 50 },
            'PATH':        { type: 'STRAT_PATH',        resonanceScore: 80, r: 58 },
            'QUESTION':    { type: 'STRAT_QUESTION',    resonanceScore: 50, r: 42 },
            'DATA':        { type: 'STRAT_FACT',        resonanceScore: 65, r: 48 },
        };

        const totalNodes = result.nodes.length;
        const sessionLabel = result.sessionTitle || 'Strategic Analysis';

        result.nodes.forEach((nodeData: any, i: number) => {
            const id = generateId();
            const cfg = CATEGORY_CONFIG[nodeData.category] ?? CATEGORY_CONFIG['INSIGHT'];

            // Distribute nodes in a cluster around anchor
            const angle = (i / totalNodes) * Math.PI * 2 - Math.PI / 2;
            const tier = Math.floor(i / 6);
            const radius = 280 + tier * 160 + Math.random() * 60;
            const x = cx + Math.cos(angle) * radius;
            const y = cy + Math.sin(angle) * radius;

            newNodes.push({
                id,
                type: cfg.type as any,
                label: nodeData.label || \`Node \${i + 1}\`,
                summary: nodeData.summary || '',
                category: nodeData.category,
                sessionTitle: sessionLabel,
                sessionCategory: result.sessionCategory,
                intensity: nodeData.intensity ?? 0.7,
                x, y,
                r: cfg.r,
                resonanceScore: cfg.resonanceScore,
            } as any);

            // Link to anchor node
            if (anchor) {
                newLinks.push({ source: id, target: anchor.id, value: 0.5, type: 'STRAT_LINK' });
            }

            // Chain PATH nodes sequentially
            if (nodeData.category === 'PATH' && i > 0) {
                const prevPathNode = newNodes.slice(0, -1).reverse().find(n => (n as any).category === 'PATH');
                if (prevPathNode) {
                    newLinks.push({ source: prevPathNode.id, target: id, value: 1, type: 'SYNTHESIS' });
                }
            }
        });

        console.log(\`[Strategist] Injecting \${newNodes.length} nodes from "\${sessionLabel}"\`);
        setAiGraphData(prev => ({
            nodes: [...(prev?.nodes || []), ...newNodes],
            links: [...(prev?.links || []), ...newLinks]
        }));
        setTimeout(() => simRef.current?.alpha(0.7).restart(), 60);
    };`;

        const beforeMutate = content.substring(0, mutateStart);
        const afterMutate = content.substring(mutateEnd + '\n    };'.length);
        content = beforeMutate + newMutateBody + afterMutate;
        console.log('✅ Replaced handleStrategistMutate with universal handler');
        changed++;
    } else {
        console.log('⚠️  Could not find end of handleStrategistMutate');
    }
} else {
    console.log('⚠️  handleStrategistMutate start not found');
}

fs.writeFileSync(file, content);
console.log(`\nPhase 1 done. ${changed} replacements. File size: ${content.length}`);
