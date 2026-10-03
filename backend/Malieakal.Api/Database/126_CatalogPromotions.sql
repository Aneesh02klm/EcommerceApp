CREATE TABLE IF NOT EXISTS CatalogPromotions (
    Id SERIAL PRIMARY KEY,
    Name VARCHAR(255) NOT NULL,
    TargetType VARCHAR(50) NOT NULL, -- 'Store', 'Category', 'Brand'
    TargetId INT NULL, -- Null if Store
    DiscountType VARCHAR(50) NOT NULL, -- 'Percentage' or 'Flat'
    DiscountValue DECIMAL(18,2) NOT NULL,
    StartDate TIMESTAMP NOT NULL,
    EndDate TIMESTAMP NOT NULL,
    IsActive BOOLEAN DEFAULT true,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
