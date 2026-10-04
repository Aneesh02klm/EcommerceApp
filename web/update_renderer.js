const fs = require('fs');
let file = 'src/components/ui/StorefrontRenderer.tsx';
let code = fs.readFileSync(file, 'utf8');

const oldHeader = `<div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-5 border-b border-red-200">
                    <div>
                      <p className="text-[10px] text-red-500 font-extrabold uppercase tracking-[0.2em] mb-1">{section.subtitle || "Limited Time Offer"}</p>
                      <h2 className="text-2xl font-black text-red-900 tracking-tight flex items-center gap-3">
                        ⚡ {section.title || fsName || "Flash Sale"}
                      </h2>
                    </div>
                    <div className="mt-4 md:mt-0">
                      <FlashSaleCountdown endTime={fsEnd} />
                    </div>
                  </div>`;

const newHeader = `<div className="flex flex-col md:flex-row items-center justify-between mb-8 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-red-100">
                    <div className="flex items-center gap-4 mb-4 md:mb-0">
                      <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center text-2xl animate-pulse shadow-inner">
                        ⚡
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight uppercase">
                        {section.title || fsName || "Flash Sale"}
                      </h2>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="hidden md:inline-block text-sm font-bold text-gray-400 uppercase tracking-widest">Ends In:</span>
                      <FlashSaleCountdown endTime={fsEnd} variant="premium" />
                    </div>
                  </div>`;

if (code.includes('flex flex-col md:flex-row items-center justify-between mb-8 pb-5 border-b')) {
    code = code.replace(oldHeader, newHeader);
    // Also remove the `s ` broken character if it exists
    code = code.replace(/s /g, '');
    fs.writeFileSync(file, code);
    console.log("Updated header in StorefrontRenderer.tsx");
} else {
    // maybe Regex match it
    const match = code.match(/<div className="flex flex-col md:flex-row items-center justify-between mb-8 pb-5 border-b[\s\S]*?<\/FlashSaleCountdown>[\s\S]*?<\/div>[\s\S]*?<\/div>/);
    if (match) {
        code = code.replace(match[0], newHeader);
        fs.writeFileSync(file, code);
        console.log("Updated header using regex");
    } else {
        console.log("Could not find FlashSaleGrid header block.");
    }
}
