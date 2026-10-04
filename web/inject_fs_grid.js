const fs = require('fs');
const file = 'src/components/ui/StorefrontRenderer.tsx';
let code = fs.readFileSync(file, 'utf8');

const targetStr = `if (section.type === 'HeroSlider') {`;

const newBlock = `if (section.type === 'FlashSalesGrid') {
          const flashSaleProducts = (mapProductPayload?.allProducts || []).filter((p: any) => p.flashSaleEndTime || p.flashsaleendtime);
          if (flashSaleProducts.length === 0) return null;

          const fsName = flashSaleProducts[0].flashSaleName || flashSaleProducts[0].flashsalename;
          const fsEnd = flashSaleProducts[0].flashSaleEndTime || flashSaleProducts[0].flashsaleendtime;

          return (
            <section key={section.id} className="py-12 bg-red-50 relative overflow-hidden border-y border-red-100">
              <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row items-center justify-between mb-8 bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-red-100">
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
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {flashSaleProducts.slice(0, 10).map((p: any) => <ProductCard key={p.id} {...p} />)}
                </div>
              </div>
            </section>
          );
        }

        if (section.type === 'HeroSlider') {`;

if (code.includes(targetStr)) {
    code = code.replace(targetStr, newBlock);
    fs.writeFileSync(file, code);
    console.log("Injected FlashSalesGrid logic");
} else {
    console.log("Could not find targetStr");
}
