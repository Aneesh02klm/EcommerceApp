const fs = require('fs');
let file = 'src/store/cartStore.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(/console\.warn\('Unauthorized fetch to ' \+ res\.url\);\s*return;/g, "console.warn('Unauthorized fetch to ' + res.url);\n                return item;");

fs.writeFileSync(file, code);
