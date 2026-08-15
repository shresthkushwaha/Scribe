/**
 * Strategist Engine Overhaul: Phase 2 - Canvas Renderer + CSS Vars + Workbench
 * - Adds 7 new Strategist node type renderers (STRAT_*)
 * - Adds D3 charge handling for new node types
 * - Updates Workbench header to show Strategy node metadata
 */
const fs = require('fs');
const file = 'c:/Users/kushr/.gemini/antigravity/scratch/scribe/components/GraphCanvas.tsx';
let content = fs.readFileSync(file, 'utf8');
let changed = 0;

// ─── 1. ADD STRAT node types to the D3 charge force function ─────────────────
const OLD_CHARGE_PERSONA = `                    if (d.type === 'ANCHOR') return 0;
                    if (d.type === 'PERSONA') return effLens === 'swamp' ? -450 : -180;`;

const NEW_CHARGE_PERSONA = `                    if (d.type === 'ANCHOR') return 0;
                    if (d.type === 'PERSONA') return effLens === 'swamp' ? -450 : -180;
                    if (d.type === 'STRAT_CRITIQUE') return -220;
                    if (d.type === 'STRAT_RISK') return -200;
                    if (d.type === 'STRAT_OPPORTUNITY') return -240;
                    if (d.type === 'STRAT_INSIGHT') return -190;
                    if (d.type === 'STRAT_PATH') return -210;
                    if (d.type === 'STRAT_FACT') return -160;
                    if (d.type === 'STRAT_QUESTION') return -150;`;

if (content.includes(OLD_CHARGE_PERSONA)) {
    content = content.replace(OLD_CHARGE_PERSONA, NEW_CHARGE_PERSONA);
    console.log('✅ Added STRAT charge forces');
    changed++;
} else {
    console.log('⚠️  Charge force pattern not found');
}

// ─── 2. ADD STRAT collide radius handling ────────────────────────────────────
// Find the collideR helper function
const OLD_COLLIDEF = `function collideR(n: any, lens: string)`;
const collideIdx = content.indexOf(OLD_COLLIDEF);
if (collideIdx !== -1) {
    // Find the end of collideR function by looking for the next function
    const collideBodyStart = content.indexOf('{', collideIdx);
    let depth = 0;
    let collideBodyEnd = collideBodyStart;
    for (let i = collideBodyStart; i < content.length; i++) {
        if (content[i] === '{') depth++;
        if (content[i] === '}') depth--;
        if (depth === 0) { collideBodyEnd = i; break; }
    }
    // Insert STRAT types inside the function before the closing brace
    const oldCollideBody = content.substring(collideIdx, collideBodyEnd + 1);
    if (oldCollideBody.includes('STRAT_')) {
        console.log('ℹ️  STRAT collide already present, skipping');
    } else {
        const insertPoint = oldCollideBody.lastIndexOf('if (n.type');
        if (insertPoint !== -1) {
            const afterLastIf = oldCollideBody.indexOf('\n', insertPoint) + 1;
            const newCollideBody = oldCollideBody.slice(0, afterLastIf) +
                `    if (n.type === 'STRAT_CRITIQUE' || n.type === 'STRAT_RISK') return lens === 'oracle' ? 58 : 52;\n` +
                `    if (n.type === 'STRAT_OPPORTUNITY' || n.type === 'STRAT_PATH') return lens === 'oracle' ? 65 : 60;\n` +
                `    if (n.type === 'STRAT_INSIGHT') return 55;\n` +
                `    if (n.type === 'STRAT_FACT' || n.type === 'STRAT_QUESTION') return 48;\n` +
                oldCollideBody.slice(afterLastIf);
            content = content.slice(0, collideIdx) + newCollideBody + content.slice(collideBodyEnd + 1);
            console.log('✅ Added STRAT collide radii');
            changed++;
        }
    }
} else {
    console.log('⚠️  collideR function not found');
}

// ─── 3. INJECT SVG RENDERERS for STRAT node types ────────────────────────────
// Add new renderers as additional else-if blocks before the final Trait tags fallback
const OLD_TRAIT_RENDERER = `                                     ) : (\n                                        // ── Trait tags ──`;

const NEW_STRAT_RENDERERS = `                                     ) : n.type === 'STRAT_CRITIQUE' || n.type === 'STRAT_RISK' ? (
                                        // ── Strategist: Critique / Risk node ──
                                        (() => {
                                            const w = Math.max(130, ((n as any).label?.length ?? 10) * 7.5 + 32);
                                            const isRisk = n.type === 'STRAT_RISK';
                                            const accent = isRisk ? '#ef4444' : '#f97316';
                                            const bg = isRisk ? 'rgba(239,68,68,0.10)' : 'rgba(249,115,22,0.10)';
                                            const badge = isRisk ? 'RISK' : 'CRITIQUE';
                                            return (
                                                <>
                                                    {isActive && <rect x={-w/2-3} y={-22} width={w+6} height={50} rx={11} fill="none" stroke={accent} strokeWidth={1.5} opacity={0.5} />}
                                                    <rect x={-w/2} y={-19} width={w} height={44} rx={8}
                                                        fill={bg}
                                                        stroke={isActive ? accent : 'rgba(239,68,68,0.30)'}
                                                        strokeWidth={isActive ? 1.5 : 1}
                                                    />
                                                    {/* Top accent bar */}
                                                    <rect x={-w/2} y={-19} width={w} height={4} rx={2} fill={accent} opacity={0.8} />
                                                    {/* Badge */}
                                                    <text x={-w/2+8} y={-5} fontSize={7} fontWeight="900"
                                                        fill={accent} fontFamily="monospace"
                                                        style={{ letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                                                        {badge}
                                                    </text>
                                                    <text textAnchor="middle" y={14} fontSize={10} fontWeight="700"
                                                        fontFamily="monospace"
                                                        fill={isActive ? '#fff' : 'rgba(255,255,255,0.85)'}
                                                        pointerEvents="none" style={{ userSelect: 'none' }}>
                                                        {(n.label?.length ?? 0) > 20 ? n.label.slice(0, 18) + '…' : n.label}
                                                    </text>
                                                </>
                                            );
                                        })()
                                     ) : n.type === 'STRAT_OPPORTUNITY' ? (
                                        // ── Strategist: Opportunity node ──
                                        (() => {
                                            const w = Math.max(130, ((n as any).label?.length ?? 10) * 7.5 + 32);
                                            return (
                                                <>
                                                    {isActive && <rect x={-w/2-3} y={-22} width={w+6} height={50} rx={14} fill="none" stroke="#f59e0b" strokeWidth={2} opacity={0.6} />}
                                                    <rect x={-w/2} y={-19} width={w} height={44} rx={12}
                                                        fill="rgba(245,158,11,0.12)"
                                                        stroke={isActive ? '#f59e0b' : 'rgba(245,158,11,0.35)'}
                                                        strokeWidth={isActive ? 1.5 : 1}
                                                    />
                                                    <rect x={-w/2} y={-19} width={w} height={4} rx={2} fill="#f59e0b" opacity={0.9} />
                                                    <text x={-w/2+8} y={-5} fontSize={7} fontWeight="900"
                                                        fill="#f59e0b" fontFamily="monospace"
                                                        style={{ letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                                                        OPPORTUNITY
                                                    </text>
                                                    <text textAnchor="middle" y={14} fontSize={10} fontWeight="700"
                                                        fontFamily="monospace"
                                                        fill={isActive ? '#fff' : 'rgba(255,255,255,0.85)'}
                                                        pointerEvents="none" style={{ userSelect: 'none' }}>
                                                        {(n.label?.length ?? 0) > 20 ? n.label.slice(0, 18) + '…' : n.label}
                                                    </text>
                                                </>
                                            );
                                        })()
                                     ) : n.type === 'STRAT_INSIGHT' ? (
                                        // ── Strategist: Insight node ──
                                        (() => {
                                            const w = Math.max(130, ((n as any).label?.length ?? 10) * 7.5 + 32);
                                            return (
                                                <>
                                                    {isActive && <rect x={-w/2-3} y={-22} width={w+6} height={50} rx={12} fill="none" stroke="#06b6d4" strokeWidth={1.5} opacity={0.5} />}
                                                    <rect x={-w/2} y={-19} width={w} height={44} rx={10}
                                                        fill="rgba(6,182,212,0.10)"
                                                        stroke={isActive ? '#06b6d4' : 'rgba(6,182,212,0.30)'}
                                                        strokeWidth={isActive ? 1.5 : 1}
                                                    />
                                                    <rect x={-w/2} y={-19} width={w} height={4} rx={2} fill="#06b6d4" opacity={0.8} />
                                                    <text x={-w/2+8} y={-5} fontSize={7} fontWeight="900"
                                                        fill="#06b6d4" fontFamily="monospace"
                                                        style={{ letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                                                        INSIGHT
                                                    </text>
                                                    <text textAnchor="middle" y={14} fontSize={10} fontWeight="700"
                                                        fontFamily="monospace"
                                                        fill={isActive ? '#fff' : 'rgba(255,255,255,0.85)'}
                                                        pointerEvents="none" style={{ userSelect: 'none' }}>
                                                        {(n.label?.length ?? 0) > 20 ? n.label.slice(0, 18) + '…' : n.label}
                                                    </text>
                                                </>
                                            );
                                        })()
                                     ) : n.type === 'STRAT_PATH' ? (
                                        // ── Strategist: Path / Action node ──
                                        (() => {
                                            const w = Math.max(130, ((n as any).label?.length ?? 10) * 7.5 + 32);
                                            return (
                                                <>
                                                    {isActive && <rect x={-w/2-3} y={-22} width={w+6} height={50} rx={26} fill="none" stroke="#10b981" strokeWidth={2} opacity={0.6} />}
                                                    <rect x={-w/2} y={-19} width={w} height={44} rx={22}
                                                        fill="rgba(16,185,129,0.12)"
                                                        stroke={isActive ? '#10b981' : 'rgba(16,185,129,0.35)'}
                                                        strokeWidth={isActive ? 1.5 : 1}
                                                    />
                                                    <text x={0} y={-5} textAnchor="middle" fontSize={7} fontWeight="900"
                                                        fill="#10b981" fontFamily="monospace"
                                                        style={{ letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                                                        → PATH
                                                    </text>
                                                    <text textAnchor="middle" y={12} fontSize={10} fontWeight="700"
                                                        fontFamily="monospace"
                                                        fill={isActive ? '#fff' : 'rgba(255,255,255,0.85)'}
                                                        pointerEvents="none" style={{ userSelect: 'none' }}>
                                                        {(n.label?.length ?? 0) > 20 ? n.label.slice(0, 18) + '…' : n.label}
                                                    </text>
                                                </>
                                            );
                                        })()
                                     ) : n.type === 'STRAT_FACT' ? (
                                        // ── Strategist: Fact / Data node ──
                                        (() => {
                                            const w = Math.max(120, ((n as any).label?.length ?? 10) * 7.5 + 28);
                                            return (
                                                <>
                                                    <rect x={-w/2} y={-18} width={w} height={40} rx={6}
                                                        fill="rgba(148,163,184,0.08)"
                                                        stroke={isActive ? '#94a3b8' : 'rgba(148,163,184,0.25)'}
                                                        strokeWidth={isActive ? 1.5 : 0.8}
                                                        strokeDasharray={isActive ? undefined : '4 3'}
                                                    />
                                                    <text x={-w/2+6} y={-4} fontSize={7} fontWeight="900"
                                                        fill="#94a3b8" fontFamily="monospace"
                                                        style={{ letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                                                        FACT
                                                    </text>
                                                    <text textAnchor="middle" y={12} fontSize={10} fontWeight="600"
                                                        fontFamily="monospace"
                                                        fill={isActive ? '#fff' : 'rgba(255,255,255,0.70)'}
                                                        pointerEvents="none" style={{ userSelect: 'none' }}>
                                                        {(n.label?.length ?? 0) > 20 ? n.label.slice(0, 18) + '…' : n.label}
                                                    </text>
                                                </>
                                            );
                                        })()
                                     ) : n.type === 'STRAT_QUESTION' ? (
                                        // ── Strategist: Open Question node ──
                                        (() => {
                                            const w = Math.max(120, ((n as any).label?.length ?? 10) * 7.5 + 28);
                                            return (
                                                <>
                                                    <rect x={-w/2} y={-18} width={w} height={40} rx={8}
                                                        fill="rgba(168,85,247,0.10)"
                                                        stroke={isActive ? '#a855f7' : 'rgba(168,85,247,0.30)'}
                                                        strokeWidth={isActive ? 1.5 : 0.8}
                                                        strokeDasharray="5 3"
                                                    />
                                                    <text x={0} y={-4} textAnchor="middle" fontSize={7} fontWeight="900"
                                                        fill="#a855f7" fontFamily="monospace"
                                                        style={{ letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                                                        ? QUESTION
                                                    </text>
                                                    <text textAnchor="middle" y={12} fontSize={10} fontWeight="600"
                                                        fontFamily="monospace"
                                                        fill={isActive ? '#fff' : 'rgba(255,255,255,0.75)'}
                                                        pointerEvents="none" style={{ userSelect: 'none' }}>
                                                        {(n.label?.length ?? 0) > 20 ? n.label.slice(0, 18) + '…' : n.label}
                                                    </text>
                                                </>
                                            );
                                        })()
                                     ) : (
                                        // ── Trait tags ──`;

if (content.includes(OLD_TRAIT_RENDERER)) {
    content = content.replace(OLD_TRAIT_RENDERER, NEW_STRAT_RENDERERS);
    console.log('✅ Injected all STRAT node SVG renderers');
    changed++;
} else {
    console.log('⚠️  Trait renderer pattern not found – looking for fallback pattern...');
    const altPattern = `                                    ) : (\n                                        // ── Trait tags ──`;
    if (content.includes(altPattern)) {
        content = content.replace(altPattern, NEW_STRAT_RENDERERS);
        console.log('✅ Injected STRAT renderers (alt pattern)');
        changed++;
    } else {
        console.log('⚠️  Alt pattern also not found');
    }
}

// ─── 4. Update STRAT link rendering - add new link types ─────────────────────
const OLD_LINK_STROKE = `stroke={l.type === 'SYNTHESIS' ? 'rgba(255,200,0,0.8)' : l.type === 'GAP_LINK' ? 'rgba(255,100,0,0.5)' : 'var(--ink)'}`;
const NEW_LINK_STROKE = `stroke={
                                        l.type === 'SYNTHESIS' ? 'rgba(255,200,0,0.8)' :
                                        l.type === 'GAP_LINK' ? 'rgba(255,100,0,0.5)' :
                                        l.type === 'STRAT_LINK' ? 'rgba(255,255,255,0.08)' :
                                        'var(--ink)'
                                    }`;
if (content.includes(OLD_LINK_STROKE)) {
    content = content.replace(OLD_LINK_STROKE, NEW_LINK_STROKE);
    console.log('✅ Updated link stroke colors');
    changed++;
} else {
    console.log('⚠️  Link stroke pattern not found');
}

// ─── 5. Update Workbench header to show Strategist node metadata ─────────────
const OLD_WORKBENCH_HEADER = `                             <span className="text-[9px] font-mono text-[var(--text-3)] uppercase tracking-[0.18em]">
                                 {activeNode ? activeNode.type : 'SWARM WORKBENCH'}
                                 {activeNode?.resonanceScore != null && (
                                     <span className="ml-2 text-[var(--text-2)] normal-case tracking-normal">
                                         rs {Math.round(activeNode.resonanceScore)}
                                     </span>
                                 )}
                             </span>`;

const NEW_WORKBENCH_HEADER = `                             <span className="text-[9px] font-mono text-[var(--text-3)] uppercase tracking-[0.18em]">
                                 {activeNode ? (
                                     (activeNode.type as string).startsWith('STRAT_')
                                         ? (activeNode as any).sessionTitle || activeNode.type.replace('STRAT_', '')
                                         : activeNode.type
                                 ) : 'SWARM WORKBENCH'}
                                 {activeNode?.resonanceScore != null && (
                                     <span className="ml-2 text-[var(--text-2)] normal-case tracking-normal">
                                         {(activeNode.type as string).startsWith('STRAT_') ? (activeNode as any).category : \`rs \${Math.round(activeNode.resonanceScore)}\`}
                                     </span>
                                 )}
                             </span>`;

if (content.includes(OLD_WORKBENCH_HEADER)) {
    content = content.replace(OLD_WORKBENCH_HEADER, NEW_WORKBENCH_HEADER);
    console.log('✅ Updated Workbench header for STRAT nodes');
    changed++;
} else {
    console.log('⚠️  Workbench header pattern not found');
}

fs.writeFileSync(file, content);
console.log(`\nPhase 2 done. ${changed} replacements. File size: ${content.length}`);
