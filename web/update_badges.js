const fs = require('fs');
let file = 'src/components/ui/ProductCard.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `{(isBestSeller || isbestseller) && (
          <div className="absolute top-3 left-3 z-10">
            <span className="bg-[#1a1a1a] text-white text-[9px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider">
              BEST SELLER
            </span>
          </div>
        )}`;

const newBlock = `<div className="absolute top-3 left-3 z-10 flex flex-col items-start gap-1.5">
          {(isBestSeller || isbestseller) && (
            <span className="bg-[#1a1a1a] text-white text-[9px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider">
              BEST SELLER
            </span>
          )}
          {mrp > price && price > 0 && actualFsName && (
            <span className="bg-red-600 text-white text-[9px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider flex items-center gap-1">
              ⚡ FLASH SALE
            </span>
          )}
          {mrp > price && price > 0 && !actualFsName && (
            <span className="bg-amber-500 text-white text-[9px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider flex items-center gap-1">
              🔥 LIMITED DEAL
            </span>
          )}
        </div>`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, newBlock);
    fs.writeFileSync(file, code);
    console.log("Updated ProductCard badges.");
} else {
    console.log("Could not find targetStr in ProductCard.tsx");
}
