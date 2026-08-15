const fs = require('fs');
const file = 'c:/Users/kushr/.gemini/antigravity/scratch/scribe/components/GraphCanvas.tsx';
let content = fs.readFileSync(file, 'utf8');
let changed = 0;

// 1. Fix displayNodes — Strategist should fully replace (like Oracle), not overlay
const oldDisplayNodes = `    const displayNodes = useMemo(() => {
        if (!activeAiLens) return propNodes;
        if (activeAiLens === 'strategist') {
            return aiGraphData ? [...propNodes, ...aiGraphData.nodes] : propNodes;
        }
        return aiGraphData?.nodes ?? [];
    }, [activeAiLens, aiGraphData, propNodes]);

    const displayLinks = useMemo(() => {
        if (!activeAiLens) return propLinks;
        if (activeAiLens === 'strategist') {
            return aiGraphData ? [...propLinks, ...aiGraphData.links] : propLinks;
        }
        return aiGraphData?.links ?? [];
    }, [activeAiLens, aiGraphData, propLinks]);`;

const newDisplayNodes = `    const displayNodes = useMemo(() => {
        if (!activeAiLens) return propNodes;
        // Strategist, Oracle, Swamp all fully replace the graph (no overlay)
        return aiGraphData?.nodes ?? propNodes;
    }, [activeAiLens, aiGraphData, propNodes]);

    const displayLinks = useMemo(() => {
        if (!activeAiLens) return propLinks;
        return aiGraphData?.links ?? propLinks;
    }, [activeAiLens, aiGraphData, propLinks]);`;

if (content.includes(oldDisplayNodes)) {
    content = content.replace(oldDisplayNodes, newDisplayNodes);
    console.log('✅ Fixed displayNodes/Links');
    changed++;
} else {
    console.log('⚠️  displayNodes pattern not found');
}

// 2. Fix effLens and effArch to include strategist (give it Oracle physics)
const oldEffLens = `    const effLens = activeAiLens === 'oracle' ? 'oracle' : lens;
    const effId = activeAiLens === 'oracle' ? 'oracle' : activeAiLens === 'swamp' ? 'swamp' : 'weaver';
    const effArch = isArchipelago || activeAiLens === 'oracle' || activeAiLens === 'swamp';`;

const newEffLens = `    const effLens = (activeAiLens === 'oracle' || activeAiLens === 'strategist') ? 'oracle' : lens;
    const effId = (activeAiLens === 'oracle' || activeAiLens === 'strategist') ? 'oracle' : activeAiLens === 'swamp' ? 'swamp' : 'weaver';
    const effArch = isArchipelago || activeAiLens === 'oracle' || activeAiLens === 'swamp' || activeAiLens === 'strategist';`;

if (content.includes(oldEffLens)) {
    content = content.replace(oldEffLens, newEffLens);
    console.log('✅ Fixed effLens/effArch for strategist');
    changed++;
} else {
    console.log('⚠️  effLens pattern not found');
}

// 3. Fix model URLs — use gemini-1.5-flash (stable, widely available)
content = content.replace(/gemini-2\.0-flash/g, 'gemini-1.5-flash');
console.log('✅ Updated model to gemini-1.5-flash');

// 4. Make routing more aggressive — add a fallback keyword matcher before API call
const oldRoutineStart = `    const handleStrategistSend = useCallback(async (text: string) => {
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
            }`;

const newRoutineStart = `    // ── Strategist: Keyword-based fallback routing ────────────────────────────
    const keywordRoute = (text: string): string | null => {
        const t = text.toLowerCase();
        if (t.includes('red team') || t.includes('redteam') || t.includes('adversar') || t.includes('critic') || t.includes('stress test') || t.includes('skeptic') || t.includes('attack') || t.includes('weakness') || t.includes('vulnerab')) return 'red-team';
        if (t.includes('gap') || t.includes('missing') || t.includes('void') || t.includes('absent') || t.includes('hollow') || t.includes('lack') || t.includes('audit')) return 'gaps-audit';
        if (t.includes('golden path') || t.includes('trajectory') || t.includes('roadmap') || t.includes('path') || t.includes('optimal') || t.includes('synthesis') || t.includes('journey') || t.includes('next step')) return 'golden-path';
        if (t.includes('fmea') || t.includes('failure') || t.includes('failure mode') || t.includes('reliability') || t.includes('risk')) return 'fmea';
        if (t.includes('blue ocean') || t.includes('market') || t.includes('competition') || t.includes('innovation')) return 'blue-ocean';
        if (t.includes('first principles') || t.includes('axiom') || t.includes('deconstruct') || t.includes('fundamental')) return 'first-principles';
        return null;
    };

    const handleStrategistSend = useCallback(async (text: string) => {
        if (isStrategistExecuting) return;
        setIsStrategistExecuting(true);

        const userMsg = { role: 'user', text, timestamp: Date.now() };
        setStrategistMessages(prev => [...prev, userMsg]);

        try {
            // 1. Route — try keyword first, fall back to API routing
            const currentNodes = displayNodes;
            const keywordSkillId = keywordRoute(text);
            let intent: { skillId: string; reasoning: string } | null = keywordSkillId
                ? { skillId: keywordSkillId, reasoning: \`Applying \${keywordSkillId.replace('-', ' ')} based on your request.\` }
                : await routeStrategistMessage(text, currentNodes);

            if (!intent) {
                // Last resort: default to red-team
                intent = { skillId: 'red-team', reasoning: 'Defaulting to Red Team audit as a general strategic stress-test.' };
            }`;

if (content.includes('    const handleStrategistSend = useCallback(async (text: string) => {')) {
    content = content.replace(
        `    const handleStrategistSend = useCallback(async (text: string) => {
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
            }`,
        newRoutineStart
    );
    console.log('✅ Added keyword routing fallback to handleStrategistSend');
    changed++;
} else {
    console.log('⚠️  handleStrategistSend pattern not found');
}

fs.writeFileSync(file, content);
console.log(`\nDone. ${changed} targeted replacements made. File size: ${content.length}`);
