-- Step 1: Create Dummy Variants
INSERT INTO ProductVariants (ProductId, GroupName, OptionName, LinkedProductId)
VALUES 
    -- Link MacBook Air M2 to Galaxy Book Go as an example 'Color' variant
    ('88888888-0000-0000-0000-000000000002', 'Color', 'Silver', '88888888-0000-0000-0000-000000000002'),
    ('88888888-0000-0000-0000-000000000002', 'Color', 'Space Gray', '88888888-0000-0000-0000-000000000006'),

    -- Also link it backwards from Galaxy Book Go
    ('88888888-0000-0000-0000-000000000006', 'Color', 'Silver', '88888888-0000-0000-0000-000000000002'),
    ('88888888-0000-0000-0000-000000000006', 'Color', 'Space Gray', '88888888-0000-0000-0000-000000000006'),

    -- Dummy storage variants
    ('88888888-0000-0000-0000-000000000002', 'Storage', '256GB', '88888888-0000-0000-0000-000000000002'),
    ('88888888-0000-0000-0000-000000000006', 'Storage', '512GB', '88888888-0000-0000-0000-000000000006');
