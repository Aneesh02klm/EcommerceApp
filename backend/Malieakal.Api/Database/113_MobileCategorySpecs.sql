-- Seed Master Specs for Mobile Phones
DO $$
DECLARE
    spec record;
BEGIN
    -- Temporary table to hold data
    CREATE TEMP TABLE tmp_specs (
        GroupName VARCHAR(100),
        Name VARCHAR(100),
        DataType VARCHAR(50),
        IsRequired BOOLEAN,
        DisplayOrder INT
    ) ON COMMIT DROP;

    INSERT INTO tmp_specs VALUES
    ('General', 'In The Box', 'Text', false, 1),
    ('General', 'Model Number', 'Text', true, 2),
    ('General', 'Model Name', 'Text', true, 3),
    ('General', 'Color', 'Text', true, 4),
    ('General', 'SIM Type', 'Text', true, 5),
    ('Display Features', 'Display Size', 'Text', true, 1),
    ('Display Features', 'Resolution', 'Text', true, 2),
    ('Display Features', 'Resolution Type', 'Text', false, 3),
    ('Display Features', 'Display Type', 'Text', true, 4),
    ('OS & Processor Features', 'Operating System', 'Text', true, 1),
    ('OS & Processor Features', 'Processor Brand', 'Text', true, 2),
    ('OS & Processor Features', 'Processor Type', 'Text', true, 3),
    ('OS & Processor Features', 'Processor Core', 'Text', false, 4),
    ('Memory & Storage Features', 'Internal Storage', 'Text', true, 1),
    ('Memory & Storage Features', 'RAM', 'Text', true, 2),
    ('Memory & Storage Features', 'Expandable Storage', 'Boolean', false, 3),
    ('Camera Features', 'Primary Camera', 'Text', true, 1),
    ('Camera Features', 'Secondary Camera', 'Text', false, 2),
    ('Camera Features', 'Flash', 'Boolean', false, 3),
    ('Connectivity Features', 'Network Type', 'Text', true, 1),
    ('Connectivity Features', 'Supported Networks', 'Text', false, 2),
    ('Connectivity Features', 'Bluetooth Support', 'Boolean', false, 3),
    ('Connectivity Features', 'Wi-Fi', 'Boolean', false, 4),
    ('Connectivity Features', 'NFC', 'Boolean', false, 5),
    ('Battery & Power Features', 'Battery Capacity', 'Text', true, 1),
    ('Battery & Power Features', 'Battery Type', 'Text', false, 2);

    FOR spec IN SELECT * FROM tmp_specs LOOP
        IF NOT EXISTS (SELECT 1 FROM SpecificationDefinitions WHERE GroupName = spec.GroupName AND Name = spec.Name) THEN
            INSERT INTO SpecificationDefinitions (GroupName, Name, DataType, IsRequired, DisplayOrder, IsActive)
            VALUES (spec.GroupName, spec.Name, spec.DataType, spec.IsRequired, spec.DisplayOrder, true);
        END IF;
    END LOOP;
END $$;

-- Update Mobile Phones Category
UPDATE Categories 
SET SpecificationTemplate = '{"General": ["In The Box", "Model Number", "Model Name", "Color", "SIM Type"], "Display Features": ["Display Size", "Resolution", "Resolution Type", "Display Type"], "OS & Processor Features": ["Operating System", "Processor Brand", "Processor Type", "Processor Core"], "Memory & Storage Features": ["Internal Storage", "RAM", "Expandable Storage"], "Camera Features": ["Primary Camera", "Secondary Camera", "Flash"], "Connectivity Features": ["Network Type", "Supported Networks", "Bluetooth Support", "Wi-Fi", "NFC"], "Battery & Power Features": ["Battery Capacity", "Battery Type"]}'::jsonb 
WHERE Name ILIKE '%Mobile%' OR Name ILIKE '%Phone%' OR Name ILIKE '%Smartphone%';

-- Fix Sequence
SELECT setval('specificationdefinitions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM specificationdefinitions));
