const fs = require('fs');
const file = 'c:/Users/kushr/.gemini/antigravity/scratch/scribe/components/GraphCanvas.tsx';
let content = fs.readFileSync(file, 'utf8');

const newEffect = `    useEffect(() => {
        // Only reset non-AI lens modes; Strategist manages its own data
        if (activeAiLens !== 'oracle' && activeAiLens !== 'swamp' && activeAiLens !== 'strategist') {
            setAiGraphData(null);
        }
    }, [activeAiLens]);`;

// Find the old effect by its unique marker
const idx = content.indexOf('// Ensure clean discovery state');
if (idx === -1) {
    console.log('Already patched or not found. Checking for alternate pattern...');
    const idx2 = content.indexOf("activeAiLens !== 'swamp' && activeAiLens !== 'strategist'");
    if (idx2 === -1) {
        console.log('Neither pattern found! File may need manual inspection.');
    } else {
        console.log('Already patched at index:', idx2);
    }
    process.exit(0);
}

// Find the boundaries of the useEffect block
const effectStart = content.lastIndexOf('useEffect', idx);
const effectEnd = content.indexOf('}, [activeAiLens]);', effectStart) + '}, [activeAiLens]);'.length;

const before = content.substring(0, effectStart);
const after = content.substring(effectEnd);

const newContent = before + newEffect + after;
fs.writeFileSync(file, newContent);
console.log('SUCCESS: Reset effect fixed. New file length:', newContent.length);
