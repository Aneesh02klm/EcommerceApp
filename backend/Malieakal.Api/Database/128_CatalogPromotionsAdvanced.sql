ALTER TABLE CatalogPromotions ADD COLUMN IF NOT EXISTS TargetCategoryId INT;
ALTER TABLE CatalogPromotions ADD COLUMN IF NOT EXISTS TargetBrandId INT;

-- Migrate existing data
UPDATE CatalogPromotions SET TargetCategoryId = TargetId WHERE TargetType = 'Category';
UPDATE CatalogPromotions SET TargetBrandId = TargetId WHERE TargetType = 'Brand';

-- We can leave TargetId around for backwards compatibility or ignore it.
