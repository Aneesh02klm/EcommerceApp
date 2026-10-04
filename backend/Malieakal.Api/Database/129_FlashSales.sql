-- 129_FlashSales.sql
ALTER TABLE FlashSales ADD COLUMN IF NOT EXISTS DiscountValue DECIMAL(10,2) DEFAULT 0;
ALTER TABLE FlashSales ADD COLUMN IF NOT EXISTS TargetType VARCHAR(50) DEFAULT 'Product'; -- 'Product' or 'Category'
ALTER TABLE FlashSales ADD COLUMN IF NOT EXISTS TargetCategoryId INT NULL;

-- Insert Dummy Data
INSERT INTO FlashSales (Title, StartTime, EndTime, IsActive, DiscountValue, TargetType, TargetCategoryId)
VALUES ('Weekend Mega Sale', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '48 hours', true, 35.00, 'Category', NULL)
ON CONFLICT DO NOTHING;

-- Let's just update the target category to 1 (Televisions) or something if it exists.
UPDATE FlashSales 
SET TargetCategoryId = (SELECT Id FROM Categories LIMIT 1) 
WHERE Title = 'Weekend Mega Sale';
