-- Seed Master Specs for Televisions
INSERT INTO SpecificationDefinitions (GroupName, Name, DataType, IsRequired, DisplayOrder, IsActive)
SELECT 'Display', 'Screen Size', 'Text', true, 1, true WHERE NOT EXISTS (SELECT 1 FROM SpecificationDefinitions WHERE GroupName = 'Display' AND Name = 'Screen Size');
INSERT INTO SpecificationDefinitions (GroupName, Name, DataType, IsRequired, DisplayOrder, IsActive)
SELECT 'Display', 'Resolution', 'Text', true, 2, true WHERE NOT EXISTS (SELECT 1 FROM SpecificationDefinitions WHERE GroupName = 'Display' AND Name = 'Resolution');
INSERT INTO SpecificationDefinitions (GroupName, Name, DataType, IsRequired, DisplayOrder, IsActive)
SELECT 'Display', 'Panel Type', 'Text', true, 3, true WHERE NOT EXISTS (SELECT 1 FROM SpecificationDefinitions WHERE GroupName = 'Display' AND Name = 'Panel Type');
INSERT INTO SpecificationDefinitions (GroupName, Name, DataType, IsRequired, DisplayOrder, IsActive)
SELECT 'Audio', 'Speaker Output', 'Text', false, 1, true WHERE NOT EXISTS (SELECT 1 FROM SpecificationDefinitions WHERE GroupName = 'Audio' AND Name = 'Speaker Output');
INSERT INTO SpecificationDefinitions (GroupName, Name, DataType, IsRequired, DisplayOrder, IsActive)
SELECT 'Smart Features', 'Operating System', 'Text', true, 1, true WHERE NOT EXISTS (SELECT 1 FROM SpecificationDefinitions WHERE GroupName = 'Smart Features' AND Name = 'Operating System');
INSERT INTO SpecificationDefinitions (GroupName, Name, DataType, IsRequired, DisplayOrder, IsActive)
SELECT 'Connectivity', 'HDMI Ports', 'Number', true, 1, true WHERE NOT EXISTS (SELECT 1 FROM SpecificationDefinitions WHERE GroupName = 'Connectivity' AND Name = 'HDMI Ports');

-- Update Categories
UPDATE Categories SET SpecificationTemplate = '{"Display": ["Screen Size", "Resolution", "Panel Type"], "Audio": ["Speaker Output"], "Smart Features": ["Operating System"], "Connectivity": ["HDMI Ports"]}'::jsonb WHERE Name ILIKE '%Television%' OR Name ILIKE '%TV%';


-- Seed Master Specs for Refrigerators
INSERT INTO SpecificationDefinitions (GroupName, Name, DataType, IsRequired, DisplayOrder, IsActive)
SELECT 'Capacity', 'Total Capacity (L)', 'Number', true, 1, true WHERE NOT EXISTS (SELECT 1 FROM SpecificationDefinitions WHERE GroupName = 'Capacity' AND Name = 'Total Capacity (L)');
INSERT INTO SpecificationDefinitions (GroupName, Name, DataType, IsRequired, DisplayOrder, IsActive)
SELECT 'Design', 'Door Type', 'Text', true, 1, true WHERE NOT EXISTS (SELECT 1 FROM SpecificationDefinitions WHERE GroupName = 'Design' AND Name = 'Door Type');
INSERT INTO SpecificationDefinitions (GroupName, Name, DataType, IsRequired, DisplayOrder, IsActive)
SELECT 'Features', 'Defrosting Type', 'Text', true, 1, true WHERE NOT EXISTS (SELECT 1 FROM SpecificationDefinitions WHERE GroupName = 'Features' AND Name = 'Defrosting Type');
INSERT INTO SpecificationDefinitions (GroupName, Name, DataType, IsRequired, DisplayOrder, IsActive)
SELECT 'Energy', 'Energy Rating', 'Text', true, 1, true WHERE NOT EXISTS (SELECT 1 FROM SpecificationDefinitions WHERE GroupName = 'Energy' AND Name = 'Energy Rating');

-- Update Categories
UPDATE Categories SET SpecificationTemplate = '{"Capacity": ["Total Capacity (L)"], "Design": ["Door Type", "Color"], "Features": ["Defrosting Type"], "Energy": ["Energy Rating"]}'::jsonb WHERE Name ILIKE '%Refrigerator%';


-- Seed Master Specs for Washing Machines
INSERT INTO SpecificationDefinitions (GroupName, Name, DataType, IsRequired, DisplayOrder, IsActive)
SELECT 'Capacity', 'Washing Capacity (kg)', 'Number', true, 1, true WHERE NOT EXISTS (SELECT 1 FROM SpecificationDefinitions WHERE GroupName = 'Capacity' AND Name = 'Washing Capacity (kg)');
INSERT INTO SpecificationDefinitions (GroupName, Name, DataType, IsRequired, DisplayOrder, IsActive)
SELECT 'Design', 'Machine Type', 'Text', true, 1, true WHERE NOT EXISTS (SELECT 1 FROM SpecificationDefinitions WHERE GroupName = 'Design' AND Name = 'Machine Type');
INSERT INTO SpecificationDefinitions (GroupName, Name, DataType, IsRequired, DisplayOrder, IsActive)
SELECT 'Features', 'Wash Programs', 'Text', false, 1, true WHERE NOT EXISTS (SELECT 1 FROM SpecificationDefinitions WHERE GroupName = 'Features' AND Name = 'Wash Programs');

-- Update Categories
UPDATE Categories SET SpecificationTemplate = '{"Capacity": ["Washing Capacity (kg)"], "Design": ["Machine Type", "Loading Type"], "Performance": ["Maximum Spin Speed"], "Features": ["Wash Programs", "Inverter Technology"], "Energy": ["Energy Rating"]}'::jsonb WHERE Name ILIKE '%Washing Machine%';


-- Seed Master Specs for Air Conditioners
INSERT INTO SpecificationDefinitions (GroupName, Name, DataType, IsRequired, DisplayOrder, IsActive)
SELECT 'Capacity', 'Cooling Capacity (Ton)', 'Text', true, 1, true WHERE NOT EXISTS (SELECT 1 FROM SpecificationDefinitions WHERE GroupName = 'Capacity' AND Name = 'Cooling Capacity (Ton)');
INSERT INTO SpecificationDefinitions (GroupName, Name, DataType, IsRequired, DisplayOrder, IsActive)
SELECT 'Design', 'AC Type', 'Text', true, 1, true WHERE NOT EXISTS (SELECT 1 FROM SpecificationDefinitions WHERE GroupName = 'Design' AND Name = 'AC Type');
INSERT INTO SpecificationDefinitions (GroupName, Name, DataType, IsRequired, DisplayOrder, IsActive)
SELECT 'Performance', 'Compressor', 'Text', true, 1, true WHERE NOT EXISTS (SELECT 1 FROM SpecificationDefinitions WHERE GroupName = 'Performance' AND Name = 'Compressor');

-- Update Categories
UPDATE Categories SET SpecificationTemplate = '{"Capacity": ["Cooling Capacity (Ton)"], "Design": ["AC Type", "Color"], "Performance": ["Compressor", "Condenser Coil"], "Features": ["Wi-Fi Control", "Air Filter"], "Energy": ["Energy Rating"]}'::jsonb WHERE Name ILIKE '%Air Conditioner%' OR Name ILIKE '%AC%';


-- Seed Master Specs for Laptops
INSERT INTO SpecificationDefinitions (GroupName, Name, DataType, IsRequired, DisplayOrder, IsActive)
SELECT 'Performance', 'Processor', 'Text', true, 1, true WHERE NOT EXISTS (SELECT 1 FROM SpecificationDefinitions WHERE GroupName = 'Performance' AND Name = 'Processor');
INSERT INTO SpecificationDefinitions (GroupName, Name, DataType, IsRequired, DisplayOrder, IsActive)
SELECT 'Performance', 'RAM', 'Text', true, 2, true WHERE NOT EXISTS (SELECT 1 FROM SpecificationDefinitions WHERE GroupName = 'Performance' AND Name = 'RAM');
INSERT INTO SpecificationDefinitions (GroupName, Name, DataType, IsRequired, DisplayOrder, IsActive)
SELECT 'Performance', 'Storage', 'Text', true, 3, true WHERE NOT EXISTS (SELECT 1 FROM SpecificationDefinitions WHERE GroupName = 'Performance' AND Name = 'Storage');
INSERT INTO SpecificationDefinitions (GroupName, Name, DataType, IsRequired, DisplayOrder, IsActive)
SELECT 'Battery', 'Battery Life', 'Text', false, 1, true WHERE NOT EXISTS (SELECT 1 FROM SpecificationDefinitions WHERE GroupName = 'Battery' AND Name = 'Battery Life');

-- Update Categories
UPDATE Categories SET SpecificationTemplate = '{"Performance": ["Processor", "RAM", "Storage", "Graphics"], "Display": ["Screen Size", "Resolution"], "Battery": ["Battery Life"], "Connectivity": ["Wi-Fi / Bluetooth", "Ports"]}'::jsonb WHERE Name ILIKE '%Laptop%' OR Name ILIKE '%Computer%';
