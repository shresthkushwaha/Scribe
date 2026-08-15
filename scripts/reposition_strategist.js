const fs = require('fs');
const path = require('path');
const file = 'c:/Users/kushr/.gemini/antigravity/scratch/scribe/components/v2/ScribeStrategist.tsx';
let content = fs.readFileSync(file, 'utf8');

// Use a more flexible replace to avoid whitespace issues
const lines = content.split('\n');
let replaced = false;

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('className="absolute right-10')) {
        lines[i] = lines[i].replace('right-10', 'left-10');
        replaced = true;
    }
    if (lines[i].includes('initial={{ x: 400')) {
        lines[i] = lines[i].replace('x: 400', 'x: -400');
    }
    if (lines[i].includes('animate={{ x: isOpen ? 0 : 340')) {
        lines[i] = lines[i].replace(': 340', ': -340');
    }
}

if (replaced) {
    fs.writeFileSync(file, lines.join('\n'));
    console.log('SUCCESS: Repositioned Strategist to leftside.');
} else {
    console.log('FAILURE: Pattern not found.');
}
