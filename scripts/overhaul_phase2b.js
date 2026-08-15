const fs = require('fs');
const file = 'c:/Users/kushr/.gemini/antigravity/scratch/scribe/components/GraphCanvas.tsx';
let content = fs.readFileSync(file, 'utf8');

// Fix the collideR function - add STRAT types
const oldPersonaLine = "    if (n.type === 'PERSONA') return 80;";
const newPersonaLine = `    if (n.type === 'PERSONA') return 80;
    if (n.type === 'STRAT_CRITIQUE' || n.type === 'STRAT_RISK') return 58;
    if (n.type === 'STRAT_OPPORTUNITY' || n.type === 'STRAT_PATH') return 65;
    if (n.type === 'STRAT_INSIGHT') return 55;
    if (n.type === 'STRAT_FACT' || n.type === 'STRAT_QUESTION') return 48;`;

if (content.includes(oldPersonaLine)) {
    content = content.replace(oldPersonaLine, newPersonaLine);
    console.log('✅ Added STRAT collide radii to collideR');
} else {
    console.log('⚠️  PERSONA collide line not found');
}

// Fix workbench header
const lines = content.split('\n');
let wb1 = -1, wb2 = -1;
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes("SWARM WORKBENCH")) wb1 = i;
}
console.log('SWARM WORKBENCH at line:', wb1);
if (wb1 !== -1) {
    // Replace lines wb1-5 to wb1+6 range
    const spanStart = wb1 - 1;
    const spanEnd = wb1 + 5; // span closes at wb1+5
    // Hunt for the close of the span
    for (let i = wb1; i < Math.min(wb1+15, lines.length); i++) {
        if (lines[i].includes('</span>') && !lines[i].includes('<span')) { wb2 = i; break; }
    }
    console.log('Span end at line:', wb2);
    if (wb2 !== -1) {
        const newLines = [
            `                             <span className="text-[9px] font-mono text-[var(--text-3)] uppercase tracking-[0.18em]">`,
            `                                 {activeNode ? (`,
            `                                     (activeNode.type as string).startsWith('STRAT_')`,
            `                                         ? ((activeNode as any).sessionTitle || activeNode.type.replace('STRAT_', ''))`,
            `                                         : activeNode.type`,
            `                                 ) : 'WORKBENCH'}`,
            `                                 {activeNode && (`,
            `                                     <span className="ml-2 normal-case tracking-normal" style={{`,
            `                                         color: (activeNode.type as string) === 'STRAT_CRITIQUE' ? '#f97316' :`,
            `                                                (activeNode.type as string) === 'STRAT_RISK' ? '#ef4444' :`,
            `                                                (activeNode.type as string) === 'STRAT_OPPORTUNITY' ? '#f59e0b' :`,
            `                                                (activeNode.type as string) === 'STRAT_INSIGHT' ? '#06b6d4' :`,
            `                                                (activeNode.type as string) === 'STRAT_PATH' ? '#10b981' :`,
            `                                                (activeNode.type as string) === 'STRAT_QUESTION' ? '#a855f7' :`,
            `                                                'var(--text-3)'`,
            `                                     }}>`,
            `                                         {(activeNode.type as string).startsWith('STRAT_')`,
            `                                             ? (activeNode as any).category`,
            `                                             : activeNode.resonanceScore != null ? \`rs \${Math.round(activeNode.resonanceScore)}\` : ''}`,
            `                                     </span>`,
            `                                 )}`,
            `                             </span>`,
        ];
        lines.splice(spanStart, wb2 - spanStart + 1, ...newLines);
        console.log('✅ Updated Workbench header for STRAT nodes');
    }
}

content = lines.join('\n');
fs.writeFileSync(file, content);
console.log('Done. File size:', content.length);
