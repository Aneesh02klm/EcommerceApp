CREATE TABLE IF NOT EXISTS SpecificationGroups (
    Id SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL UNIQUE,
    DisplayOrder INT DEFAULT 0
);

-- Seed from existing data
INSERT INTO SpecificationGroups (Name)
SELECT DISTINCT GroupName FROM SpecificationDefinitions WHERE GroupName IS NOT NULL AND GroupName != ''
ON CONFLICT (Name) DO NOTHING;
