CREATE TABLE IF NOT EXISTS FlashSaleItems (
    Id SERIAL PRIMARY KEY,
    FlashSaleId INT REFERENCES FlashSales(Id) ON DELETE CASCADE,
    ProductId UUID NOT NULL,
    Sku VARCHAR(255),
    Name VARCHAR(255),
    ImageUrl VARCHAR(255),
    Mrp DECIMAL(18,2),
    DiscountType VARCHAR(50),
    Discount DECIMAL(18,2)
);

CREATE TABLE IF NOT EXISTS CatalogPromotionItems (
    Id SERIAL PRIMARY KEY,
    CatalogPromotionId INT REFERENCES CatalogPromotions(Id) ON DELETE CASCADE,
    ProductId UUID NOT NULL,
    Sku VARCHAR(255),
    Name VARCHAR(255),
    ImageUrl VARCHAR(255),
    Mrp DECIMAL(18,2),
    DiscountType VARCHAR(50),
    Discount DECIMAL(18,2)
);

ALTER TABLE FlashSales DROP COLUMN IF EXISTS SpecificProducts;
ALTER TABLE CatalogPromotions DROP COLUMN IF EXISTS SpecificProducts;
