-- Add indexes to heavily optimize Storefront CMS automated queries
CREATE INDEX IF NOT EXISTS IDX_Products_CreatedAt ON Products(CreatedAt DESC);
CREATE INDEX IF NOT EXISTS IDX_Products_SoldStock ON Products(SoldStock DESC);
CREATE INDEX IF NOT EXISTS IDX_Products_IsBestSeller ON Products(IsBestSeller);
CREATE INDEX IF NOT EXISTS IDX_Products_MRP_FinalPrice ON Products(MRP, FinalPrice);
