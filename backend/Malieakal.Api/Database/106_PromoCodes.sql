-- Step 1: Create Coupons Table
CREATE TABLE IF NOT EXISTS Coupons (
    Id SERIAL PRIMARY KEY,
    Code VARCHAR(50) UNIQUE NOT NULL,
    DiscountType VARCHAR(20) NOT NULL, -- 'Flat' or 'Percentage'
    DiscountValue DECIMAL(18,2) NOT NULL,
    MinOrderAmount DECIMAL(18,2) DEFAULT 0,
    MaxDiscountAmount DECIMAL(18,2), -- useful for percentage
    ExpiryDate TIMESTAMP,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Step 2: Seed some coupons
INSERT INTO Coupons (Code, DiscountType, DiscountValue, MinOrderAmount, MaxDiscountAmount, ExpiryDate, IsActive)
VALUES 
('WELCOME10', 'Percentage', 10.00, 1000.00, 2000.00, '2030-12-31', TRUE),
('FESTIVAL500', 'Flat', 500.00, 5000.00, NULL, '2030-12-31', TRUE)
ON CONFLICT (Code) DO NOTHING;

-- Step 3: Add Promo fields to Orders
ALTER TABLE Orders ADD COLUMN IF NOT EXISTS PromoCode VARCHAR(50);
ALTER TABLE Orders ADD COLUMN IF NOT EXISTS PromoDiscount DECIMAL(18,2) DEFAULT 0;
