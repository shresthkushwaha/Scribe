const fs = require('fs');
const file = 'c:/Users/kushr/.gemini/antigravity/scratch/scribe/components/GraphCanvas.tsx';
let content = fs.readFileSync(file, 'utf8');

// The workbench patch injected duplicate closing tags. Find the malformed region and fix it.
// Problem: The script added extra ')}\n</span>' at lines 1621-1622 (remnants of old closing)
// We need the header span to be a clean single block.

// Find the workbench header block - look for our injected code
const markerStart = '                             <span className="text-[9px] font-mono text-[var(--text-3)] uppercase tracking-[0.18em]">\n                                 {activeNode ? (';
const markerEnd1 = '                             </span>';

const headerStart = content.indexOf(markerStart);
if (headerStart === -1) {
    console.log('⚠️  Could not find header start marker');
    process.exit(1);
}

// Find the issue: after our new span closes at the '</span>' ~22 lines later,
// there are extra ")}" and "</span>" from the old code. Detect and remove them.
const afterHeader = content.indexOf(markerEnd1, headerStart);
console.log('First </span> at:', afterHeader);
const afterSpan = content.substring(afterHeader + markerEnd1.length, afterHeader + markerEnd1.length + 100);
console.log('After first </span>:', JSON.stringify(afterSpan.slice(0, 100)));

// The pattern we need to remove: \n                                 )}\n                             </span>
// That's the orphaned closing from the old code that the replacement duplicated
const orphan = '\n                                 )}\n                             </span>';
const orphanIdx = content.indexOf(orphan, afterHeader);
if (orphanIdx !== -1 && orphanIdx < afterHeader + 200) {
    content = content.slice(0, orphanIdx) + content.slice(orphanIdx + orphan.length);
    console.log('✅ Removed orphaned closing tags');
} else {
    // Try another approach: look for the actual duplicate
    const dup = ')}\n                             </span>\n                                 )}\n                             </span>';
    const dupIdx = content.indexOf(dup);
    if (dupIdx !== -1) {
        const half = ')}\n                             </span>';
        content = content.slice(0, dupIdx) + half + content.slice(dupIdx + dup.length);
        console.log('✅ Fixed duplicate closing via dup pattern');
    } else {
        console.log('⚠️  Cannot find exact orphan pattern, checking manually...');
        // Print 10 lines after the matched span
        const lines = content.split('\n');
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].includes('STRAT_QUESTION') && lines[i].includes("'a855f7'")) {
                console.log('Context around STRAT_QUESTION line', i, ':');
                for (let j = i-1; j < i+15; j++) console.log(j, ':', JSON.stringify(lines[j]));
                break;
            }
        }
    }
}

fs.writeFileSync(file, content);
console.log('Done. File size:', content.length);
