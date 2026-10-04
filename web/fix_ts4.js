const fs = require('fs');
let file = 'src/store/cartStore.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace("return typeof item !== 'undefined' ? item : undefined;", "return item;");
code = code.replace("return typeof item !== 'undefined' ? item : undefined;", "return item;");

fs.writeFileSync(file, code);
