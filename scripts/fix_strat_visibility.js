const fs = require('fs');
const path = 'c:/Users/kushr/.gemini/antigravity/scratch/scribe/components/GraphCanvas.tsx';
let content = fs.readFileSync(path, 'utf8');

// Target the labels for Strategist nodes specifically
// They use very similar patterns, so I'll use a broad regex or specific search/replace.

const replacements = [
    {
        from: /fill={isActive \? '#fff' : 'rgba\(255,255,255,0\.85\)'}/g,
        to: "fill={isActive ? '#111827' : 'rgba(17,24,39,0.85)'}"
    },
    {
        from: /fill={isActive \? '#fff' : 'rgba\(255,255,255,0\.70\)'}/g,
        to: "fill={isActive ? '#111827' : 'rgba(17,24,39,0.85)'}"
    },
    {
        from: /fill={isActive \? '#fff' : 'rgba\(255,255,255,0\.75\)'}/g,
        to: "fill={isActive ? '#111827' : 'rgba(17,24,39,0.85)'}"
    }
];

let modified = false;
replacements.forEach(r => {
    if (content.match(r.from)) {
        content = content.replace(r.from, r.to);
        modified = true;
    }
});

if (modified) {
    fs.writeFileSync(path, content);
    console.log('✅ Successfully updated Strategist node text colors to high-contrast dark theme.');
} else {
    console.log('⚠️ No matching text patterns found for Strategist nodes.');
}
