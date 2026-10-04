const fs = require('fs');
let file = 'src/store/cartStore.ts';
let code = fs.readFileSync(file, 'utf8');

const lines = code.split('\\n');
lines[86] = lines[86].replace('return item;', 'return;');
lines[127] = lines[127].replace('return item;', 'return;');

fs.writeFileSync(file, lines.join('\\n'));
