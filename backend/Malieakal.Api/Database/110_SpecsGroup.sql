ALTER TABLE SpecificationDefinitions ADD COLUMN IF NOT EXISTS GroupName VARCHAR(100) DEFAULT 'General';
ALTER TABLE SpecificationDefinitions ALTER COLUMN CategoryId DROP NOT NULL;
