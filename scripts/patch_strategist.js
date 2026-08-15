const fs = require('fs');
const file = 'c:/Users/kushr/.gemini/antigravity/scratch/scribe/components/GraphCanvas.tsx';
let content = fs.readFileSync(file, 'utf8');

// The new replacement block
const newBlock = `    // ── AI Synthesis ──────────────────────────────────────────────────────────
    const handleTriggerAi = useCallback(async (lensKey: string, force = false, overridePackage?: string) => {
        if (!force && activeAiLens === lensKey && !overridePackage) {
            setActiveAiLens(null);
            setAiGraphData(null);
            return;
        }

        setIsSynthesizing(true);
        setActiveAiLens(lensKey);

        if (lensKey === 'strategist') {
            // Generate the initial Oracle-quality graph from source content first
            try {
                const oracleSystemPrompt = \`Focus on discovering the latent conceptual skeleton of the notes. Identify thematic anchors that represent the gravity centers of the discussion, then populate them with concrete evidence nodes. Be specific and analytical—this is a strategic workspace.\`;
                const result = await summarizeConcepts(sourceContent, oracleSystemPrompt, force);
                if (result) {
                    const converted = convertGeminiToV1(result);
                    setAiGraphData(converted);
                }
            } catch (err) {
                console.error('[Strategist] Initial graph generation failed:', err);
            } finally {
                setIsSynthesizing(false);
            }
            return;
        }

        const config = AI_LENS_CONFIGS[lensKey];
        if (!config) {
            setIsSynthesizing(false);
            return;
        }

        try {
            if (lensKey === 'swamp') {
                const pkgId = overridePackage || selectedPackage;
                setSelectedPackage(pkgId);

                if (!force && !overridePackage) {
                    setIsSynthesizing(false);
                    return;
                }

                const existing = swampSessions.find(s => s.packageName === pkgId);
                if (existing && !force) {
                    setIsSynthesizing(false);
                    return;
                }

                const cacheKey = \`swamp-cache-\${noteId || 'multi'}-\${pkgId}\`;
                const cached = localStorage.getItem(cacheKey);
                if (cached && !force) {
                    try {
                        const session = JSON.parse(cached);
                        setSwampSessions(prev => [...prev, session]);
                        const converted = convertSwampToV1(session);
                        setAiGraphData(prev => ({
                            nodes: [...(prev?.nodes || []), ...converted.nodes],
                            links: [...(prev?.links || []), ...converted.links]
                        }));
                        setIsSynthesizing(false);
                        return;
                    } catch (e) {
                        localStorage.removeItem(cacheKey);
                    }
                }

                let selectedPersonas = RED_TEAM;
                if (pkgId === 'bauhaus') selectedPersonas = BAUHAUS_COUNCIL;
                if (pkgId === 'market-movers') selectedPersonas = MARKET_MOVERS;
                if (pkgId === 'deep-thinkers') selectedPersonas = DEEP_THINKERS;

                const session = await generateSwampSession(
                    noteId || "multi",
                    sourceContent,
                    pkgId,
                    selectedPersonas
                );

                if (session) {
                    localStorage.setItem(cacheKey, JSON.stringify(session));
                    setSwampSessions(prev => [...prev, session]);
                    const converted = convertSwampToV1(session);
                    setAiGraphData(prev => ({
                        nodes: [...(prev?.nodes || []), ...converted.nodes],
                        links: [...(prev?.links || []), ...converted.links]
                    }));
                }
            } else {
                const result = await summarizeConcepts(sourceContent, config.systemPrompt, force);
                if (result) {
                    const converted = convertGeminiToV1(result);
                    setAiGraphData(converted);
                }
            }
        } catch (err) {
            console.error("AI Synthesis Error:", err);
        } finally {
            setIsSynthesizing(false);
        }
    }, [activeAiLens, sourceContent, noteId, swampSessions, selectedPackage]);

    // ── Strategist: Execute a skill directly via Gemini API ───────────────────
    const executeStrategistSkillDirect = async (skillId: string, content: string, canvasNodes: Node[]): Promise<any | null> => {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            console.error('[Strategist] No API key found.');
            return null;
        }

        const { STRATEGIST_SKILLS } = await import('@/lib/skills');
        const skill = STRATEGIST_SKILLS[skillId];
        if (!skill) {
            console.error('[Strategist] Unknown skill:', skillId);
            return null;
        }

        const url = \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=\${apiKey}\`;

        const nodeContext = canvasNodes.slice(0, 30).map(n => ({
            id: n.id,
            label: n.label,
            type: n.type,
            summary: n.summary || ''
        }));

        const userPrompt = \`SOURCE CONTENT:\\n\${content.slice(0, 4000)}\\n\\nCURRENT CANVAS NODES:\\n\${JSON.stringify(nodeContext, null, 2)}\\n\\nAnalyze the above and produce your strategic output.\`;

        const payload = {
            systemInstruction: { parts: [{ text: skill.systemPrompt }] },
            contents: [{ role: "user", parts: [{ text: userPrompt }] }],
            generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.7
            }
        };

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('[Strategist] API Error:', response.status, errText);
                return null;
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) {
                console.error('[Strategist] Empty response from API');
                return null;
            }

            try {
                return JSON.parse(text);
            } catch (e) {
                // Try to extract JSON from text
                const jsonMatch = text.match(/\\{[\\s\\S]*\\}/);
                if (jsonMatch) return JSON.parse(jsonMatch[0]);
                console.error('[Strategist] Could not parse JSON from:', text.slice(0, 200));
                return null;
            }
        } catch (err) {
            console.error('[Strategist] Network error:', err);
            return null;
        }
    };

    // ── Strategist: Route user message to a skill ─────────────────────────────
    const routeStrategistMessage = async (message: string, canvasNodes: Node[]): Promise<{ skillId: string; reasoning: string } | null> => {
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) return null;

        const url = \`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=\${apiKey}\`;

        const { STRATEGIST_SKILLS } = await import('@/lib/skills');
        const skillList = Object.values(STRATEGIST_SKILLS).map(s => \`- \${s.id}: \${s.name} – \${s.description}\`).join('\\n');

        const systemPrompt = \`You are the Scribe Strategic Router. Given a user message, select the best skill and explain WHY in one sentence.

AVAILABLE SKILLS:
\${skillList}

OUTPUT (strict JSON only):
{"skillId": "the-skill-id", "reasoning": "I am applying X because Y."}\`;

        const nodeLabels = canvasNodes.slice(0, 15).map(n => n.label).join(', ');
        const userContent = \`USER MESSAGE: "\${message}"\\nCANVAS CONTEXT: \${nodeLabels}\`;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    systemInstruction: { parts: [{ text: systemPrompt }] },
                    contents: [{ role: "user", parts: [{ text: userContent }] }],
                    generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
                })
            });

            if (!response.ok) return null;
            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) return null;
            return JSON.parse(text);
        } catch (err) {
            console.error('[Strategist Router] Error:', err);
            return null;
        }
    };

    const handleStrategistSend = useCallback(async (text: string) => {
        if (isStrategistExecuting) return;
        setIsStrategistExecuting(true);

        const userMsg = { role: 'user', text, timestamp: Date.now() };
        setStrategistMessages(prev => [...prev, userMsg]);

        try {
            // 1. Route the message to a skill
            const currentNodes = displayNodes;
            const intent = await routeStrategistMessage(text, currentNodes);

            if (!intent) {
                setStrategistMessages(prev => [...prev, {
                    role: 'assistant',
                    text: "I couldn't identify a strategic pathway for that query. Try asking for a Red Team audit, Gaps analysis, or Golden Path synthesis.",
                    timestamp: Date.now()
                }]);
                return;
            }

            // Show the intent reasoning immediately
            setStrategistMessages(prev => [...prev, {
                role: 'assistant',
                text: intent.reasoning,
                skillId: intent.skillId,
                type: 'logic-transparent',
                timestamp: Date.now()
            }]);

            // 2. Execute the skill with proper context
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
            }
        } catch (err) {
            console.error("[Strategist] Error:", err);
            setStrategistMessages(prev => [...prev, {
                role: 'assistant',
                text: "A system error occurred during analysis.",
                timestamp: Date.now()
            }]);
        } finally {
            setIsStrategistExecuting(false);
        }
    }, [isStrategistExecuting, sourceContent, displayNodes]);

    // ── Strategist: Generate user-friendly result summary ─────────────────────
    const getSkillResultSummary = (skillId: string, data: any): string => {
        if (skillId === 'red-team' && data.personas) {
            return \`Red Team spawned \${data.personas.length} adversarial personas onto the canvas. Each critic targets a different vulnerability in your logic.\`;
        }
        if (skillId === 'gaps-audit' && data.hollowNodes) {
            return \`Gaps Audit identified \${data.hollowNodes.length} structural voids. These hollow nodes represent what is critically absent from your framework.\`;
        }
        if (skillId === 'golden-path' && data.trajectory) {
            return \`Golden Path synthesized a \${data.trajectory.length}-step trajectory from current chaos to optimal outcome.\`;
        }
        if (skillId === 'fmea' && data.failures) {
            return \`FMEA identified \${data.failures.length} failure modes. Risk nodes have been added to the canvas.\`;
        }
        return \`Analysis complete. Strategic mutations applied to the canvas.\`;
    };

    // ── Strategist: Convert AI data to V1 D3 nodes ────────────────────────────
    const handleStrategistMutate = (skillId: string, data: any, baseNodes: Node[]) => {
        const newNodes: Node[] = [];
        const newLinks: GraphLink[] = [];
        let counter = 0;
        const generateId = () => \`s-\${Date.now()}-\${counter++}\`;

        // Find a central anchor node on the canvas to orbit around
        const anchorNode = baseNodes.find(n => n.type === 'ANCHOR') || baseNodes.find(n => n.type === 'EPICENTER') || baseNodes[0];
        const cx = anchorNode?.x || 0;
        const cy = anchorNode?.y || 0;

        const allIds = new Set(baseNodes.map(n => n.id));

        if (skillId === 'red-team' && data.personas) {
            const count = data.personas.length;
            data.personas.forEach((p: any, i: number) => {
                const id = generateId();
                const angle = (i / count) * Math.PI * 2;
                const radius = 350 + Math.random() * 80;
                const x = cx + Math.cos(angle) * radius;
                const y = cy + Math.sin(angle) * radius;

                newNodes.push({
                    id, type: 'PERSONA',
                    label: p.name || \`Critic \${i + 1}\`,
                    summary: p.critique || p.objection || '',
                    critique: p.critique || p.objection || '',
                    x, y, r: 80, resonanceScore: 90
                });
                allIds.add(id);

                // Link to anchor
                if (anchorNode) {
                    newLinks.push({ source: id, target: anchorNode.id, value: 0.8, type: 'DESCRIBES' });
                }
            });
        }

        if (skillId === 'gaps-audit' && data.hollowNodes) {
            data.hollowNodes.forEach((gap: any, i: number) => {
                const id = generateId();
                // Spread gaps around the canvas
                const angle = (i / data.hollowNodes.length) * Math.PI * 2;
                const radius = 300 + Math.random() * 100;
                const x = cx + Math.cos(angle) * radius;
                const y = cy + Math.sin(angle) * radius;

                newNodes.push({
                    id, type: 'ENTITY',
                    label: \`⚠ \${gap.label || 'Missing Element'}\`,
                    summary: gap.logic || gap.reason || '',
                    x, y, r: 40, resonanceScore: 10
                });
                allIds.add(id);

                // Link to nearest existing node if possible
                const nearId = gap.near && allIds.has(gap.near) ? gap.near : anchorNode?.id;
                if (nearId) {
                    newLinks.push({ source: id, target: nearId, value: 0.5, type: 'GAP_LINK' });
                }
            });
        }

        if (skillId === 'golden-path' && data.trajectory) {
            let lastId: string | null = null;
            data.trajectory.forEach((step: any, i: number) => {
                const id = generateId();
                const x = cx + (i - data.trajectory.length / 2) * 300;
                const y = cy + Math.sin(i * 0.8) * 200;

                newNodes.push({
                    id, type: 'EPICENTER',
                    label: step.label || \`Step \${i + 1}\`,
                    summary: step.reasoning || step.rationale || '',
                    x, y, r: 100, resonanceScore: 100
                });
                allIds.add(id);

                if (lastId) {
                    newLinks.push({ source: lastId, target: id, value: 1, type: 'SYNTHESIS' });
                }
                lastId = id;
            });
        }

        if (skillId === 'fmea' && data.failures) {
            data.failures.forEach((failure: any, i: number) => {
                const id = generateId();
                const angle = (i / data.failures.length) * Math.PI * 2;
                const x = cx + Math.cos(angle) * 380;
                const y = cy + Math.sin(angle) * 380;

                newNodes.push({
                    id, type: 'ENTITY',
                    label: \`⚡ \${failure.point || \`Failure \${i + 1}\`}\`,
                    summary: \`\${failure.effect || ''} → \${failure.mitigation || ''}\`,
                    x, y, r: 45, resonanceScore: 20
                });
                allIds.add(id);

                if (anchorNode) {
                    newLinks.push({ source: id, target: anchorNode.id, value: 0.6, type: 'DESCRIBES' });
                }
            });
        }

        if (newNodes.length > 0) {
            console.log(\`[Strategist] Injecting \${newNodes.length} nodes and \${newLinks.length} links into canvas\`);
            setAiGraphData(prev => ({
                nodes: [...(prev?.nodes || []), ...newNodes],
                links: [...(prev?.links || []), ...newLinks]
            }));
            // Reheat the simulation
            setTimeout(() => simRef.current?.alpha(0.6).restart(), 50);
        } else {
            console.warn('[Strategist] No nodes generated from skill data:', data);
        }
    };

`;

const startMarker = '    // \u2500\u2500 AI Synthesis \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500';
const endMarker = '    // \u2500\u2500 Connected-node set';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
    console.error('Could not find block markers! startIdx:', startIdx, 'endIdx:', endIdx);
    process.exit(1);
}

const before = content.substring(0, startIdx);
const after = content.substring(endIdx);

const newContent = before + newBlock + after;
fs.writeFileSync(file, newContent);
console.log('SUCCESS: Block replaced. New file length:', newContent.length);
