const fs = require('fs');
let file = 'src/store/cartStore.ts';
let code = fs.readFileSync(file, 'utf8');

// The first one is in initFromBackend
code = code.replace(/const res = await fetch\(`\$\{API\}\/api\/v1\/cart`[\s\S]*?if \(!res\.ok\) \{\s*if \(res\.status === 401\) \{\s*console\.warn\('Unauthorized fetch to ' \+ res\.url\);\s*return item;/m, (match) => {
    return match.replace('return item;', 'return;');
});

// The second one is in addItem
code = code.replace(/const res = await fetch\(`\$\{API\}\/api\/v1\/products\/\$\{productId\}`\)[\s\S]*?if \(!res\.ok\) \{\s*if \(res\.status === 401\) \{\s*console\.warn\('Unauthorized fetch to ' \+ res\.url\);\s*return item;/m, (match) => {
    return match.replace('return item;', 'return;');
});

fs.writeFileSync(file, code);
