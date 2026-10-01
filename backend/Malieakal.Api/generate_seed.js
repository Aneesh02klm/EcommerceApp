const fs = require('fs');
const path = require('path');

const base64Png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
const imageBuffer = Buffer.from(base64Png, 'base64');

const wwwroot = path.join(__dirname, 'wwwroot', 'uploads');
const dirs = ['products', 'categories', 'brands', 'banners', 'blogs', 'features'];
dirs.forEach(d => fs.mkdirSync(path.join(wwwroot, d), { recursive: true }));

function generateImage(subpath) {
    const fullPath = path.join(wwwroot, subpath);
    if (!fs.existsSync(fullPath)) {
        fs.writeFileSync(fullPath, imageBuffer);
    }
}

// Generate base SQL
let sql = `
-- TRUNCATE existing catalog data
TRUNCATE TABLE ProductImages, ProductSpecifications, SpecificationDefinitions, Products, Brands, Subcategories, Categories CASCADE;
TRUNCATE TABLE Banners, Features, Articles CASCADE;

INSERT INTO Categories (Id, Name, Slug, Description, ImageUrl, DisplayOrder) VALUES
(1, 'Washing Machines', 'washing-machines', 'Premium front load and top load.', '/uploads/categories/washing-machine.jpg', 1),
(2, 'Refrigerators', 'refrigerators', 'Double door and smart refrigerators.', '/uploads/categories/refrigerator.jpg', 2),
(3, 'Televisions', 'televisions', '4K, 8K, OLED and QLED Smart TVs.', '/uploads/categories/tv.jpg', 3),
(4, 'Air Conditioners', 'air-conditioners', 'Split and Window Inverters.', '/uploads/categories/ac.jpg', 4),
(5, 'Kitchen Appliances', 'kitchen-appliances', 'Microwaves, Ovens, and Chimneys.', '/uploads/categories/kitchen.jpg', 5),
(6, 'Audio', 'audio', 'Home theatres, Soundbars.', '/uploads/categories/audio.jpg', 6),
(7, 'Mobiles & Tablets', 'mobiles-tablets', 'Smartphones and Tablets.', '/uploads/categories/mobile.jpg', 7),
(8, 'Laptops & PCs', 'laptops-pcs', 'Notebooks and Desktops.', '/uploads/categories/laptop.jpg', 8);

INSERT INTO Brands (Id, Name, Slug, LogoUrl) VALUES
(1, 'LG', 'lg', '/uploads/brands/lg.png'),
(2, 'Samsung', 'samsung', '/uploads/brands/samsung.png'),
(3, 'Sony', 'sony', '/uploads/brands/sony.png'),
(4, 'Daikin', 'daikin', '/uploads/brands/daikin.png'),
(5, 'Whirlpool', 'whirlpool', '/uploads/brands/whirlpool.png'),
(6, 'Panasonic', 'panasonic', '/uploads/brands/panasonic.png'),
(7, 'Apple', 'apple', '/uploads/brands/apple.png'),
(8, 'Bosch', 'bosch', '/uploads/brands/bosch.png'),
(9, 'Croma', 'croma', '/uploads/brands/croma.png');

INSERT INTO SpecificationDefinitions (Id, CategoryId, Name, DataType, IsFilterable, IsComparable, Unit) VALUES
(1, 1, 'Capacity', 'Number', TRUE, TRUE, 'Kg'),
(2, 1, 'Load Type', 'Select', TRUE, TRUE, NULL),
(3, 2, 'Capacity', 'Number', TRUE, TRUE, 'L'),
(4, 2, 'Compressor Type', 'Select', TRUE, TRUE, NULL),
(5, 3, 'Screen Size', 'Number', TRUE, TRUE, 'Inches'),
(6, 3, 'Resolution', 'Select', TRUE, TRUE, NULL),
(7, 4, 'Capacity', 'Number', TRUE, TRUE, 'Ton'),
(8, 7, 'RAM', 'Number', TRUE, TRUE, 'GB'),
(9, 7, 'Internal Storage', 'Number', TRUE, TRUE, 'GB'),
(10, 7, 'Camera', 'Text', FALSE, TRUE, NULL);
`;

const products = [];
const productImages = [];
const productSpecs = [];

function getUUID(idx) {
    const hex = idx.toString(16).padStart(12, '0');
    return `11111111-2222-3333-4444-${hex}`;
}

let prodIdCounter = 1;

function generateCategoryProducts(categoryId, brandId, baseName, count, specsDef) {
    for (let i = 1; i <= count; i++) {
        const id = getUUID(prodIdCounter++);
        const slug = `${baseName.toLowerCase().replace(/ /g, '-')}-${i}`;
        const mrp = 20000 + (Math.random() * 50000);
        const discount = Math.floor(Math.random() * 25);
        const price = discount > 0 ? mrp - (mrp * discount / 100) : mrp;
        const imgName = `${slug}.jpg`;
        
        products.push(`('${id}', ${categoryId}, ${brandId}, '${baseName} Model ${i}', '${slug}', 'SKU-${slug.toUpperCase()}', 'MOD-${i}', ${mrp.toFixed(2)}, ${discount.toFixed(2)}, ${price.toFixed(2)}, 50, TRUE, CURRENT_TIMESTAMP)`);
        
        productImages.push(`('${id}', '/uploads/products/${imgName}', TRUE, 1)`);
        generateImage(`products/${imgName}`);
        
        specsDef.forEach(s => {
            productSpecs.push(`('${id}', ${s.id}, '${s.val()}')`);
        });
    }
}

// 1. Washing Machines (10)
generateCategoryProducts(1, 1, 'LG Front Load Washer', 5, [
    { id: 1, val: () => (Math.floor(Math.random() * 5) + 6).toString() },
    { id: 2, val: () => 'Front Load' }
]);
generateCategoryProducts(1, 2, 'Samsung Top Load Washer', 5, [
    { id: 1, val: () => (Math.floor(Math.random() * 5) + 6).toString() },
    { id: 2, val: () => 'Top Load' }
]);

// 2. Refrigerators (10)
generateCategoryProducts(2, 1, 'LG Double Door Fridge', 5, [
    { id: 3, val: () => (Math.floor(Math.random() * 200) + 200).toString() },
    { id: 4, val: () => 'Digital Inverter' }
]);
generateCategoryProducts(2, 2, 'Samsung Side by Side Fridge', 5, [
    { id: 3, val: () => (Math.floor(Math.random() * 200) + 400).toString() },
    { id: 4, val: () => 'Smart Inverter' }
]);

// 3. Televisions (10)
generateCategoryProducts(3, 3, 'Sony Bravia Smart TV', 10, [
    { id: 5, val: () => ['43', '50', '55', '65'][Math.floor(Math.random()*4)] },
    { id: 6, val: () => ['4K UHD', '8K UHD', 'FHD'][Math.floor(Math.random()*3)] }
]);

// 4. Air Conditioners (10)
generateCategoryProducts(4, 4, 'Daikin Split AC', 10, [
    { id: 7, val: () => ['1.0', '1.5', '2.0'][Math.floor(Math.random()*3)] }
]);

// 7. Mobiles (10)
generateCategoryProducts(7, 2, 'Samsung Galaxy S', 5, [
    { id: 8, val: () => ['8', '12'][Math.floor(Math.random()*2)] },
    { id: 9, val: () => ['128', '256', '512'][Math.floor(Math.random()*3)] },
    { id: 10, val: () => '200MP Quad' }
]);
generateCategoryProducts(7, 7, 'Apple iPhone', 5, [
    { id: 8, val: () => '8' },
    { id: 9, val: () => ['128', '256', '512'][Math.floor(Math.random()*3)] },
    { id: 10, val: () => '48MP Dual' }
]);

sql += `INSERT INTO Products (Id, CategoryId, BrandId, Name, Slug, SKU, Model, MRP, Discount, FinalPrice, Stock, IsActive, CreatedAt) VALUES\n`;
sql += products.join(',\n') + ';\n\n';

sql += `INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, DisplayOrder) VALUES\n`;
sql += productImages.join(',\n') + ';\n\n';

sql += `INSERT INTO ProductSpecifications (ProductId, SpecificationDefinitionId, Value) VALUES\n`;
sql += productSpecs.join(',\n') + ';\n\n';

// Static category, brand, and banner images
['washing-machine.jpg', 'refrigerator.jpg', 'tv.jpg', 'ac.jpg', 'kitchen.jpg', 'audio.jpg', 'mobile.jpg', 'laptop.jpg'].forEach(img => generateImage(`categories/${img}`));
['lg.png', 'samsung.png', 'sony.png', 'daikin.png', 'whirlpool.png', 'panasonic.png', 'apple.png', 'bosch.png', 'croma.png'].forEach(img => generateImage(`brands/${img}`));
['hero1.jpg', 'hero2.jpg'].forEach(img => generateImage(`banners/${img}`));

sql += `
INSERT INTO Banners (Title, Subtitle, ImageUrl, TargetUrl, DisplayOrder) VALUES
('Bring Premium Comfort Home', 'Upgrade to next-generation innovations.', '/uploads/banners/hero1.jpg', '/products', 1),
('Monsoon Super Sale', 'Up to 40% Off on ACs', '/uploads/banners/hero2.jpg', '/products', 2);

SELECT setval('categories_id_seq', (SELECT MAX(Id) FROM Categories));
SELECT setval('brands_id_seq', (SELECT MAX(Id) FROM Brands));
SELECT setval('specificationdefinitions_id_seq', (SELECT MAX(Id) FROM SpecificationDefinitions));
`;

fs.writeFileSync(path.join(__dirname, 'Database', '99_Figma_Seed.sql'), sql);
console.log('Seed generated and images created!');
