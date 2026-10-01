-- 103_MoreVariants_Seed.sql
DO $$
BEGIN

  -- SONY BRAVIA
  UPDATE Products SET VariantKeys = '["Display Size"]'::jsonb WHERE Slug = 'sony-bravia-smart-tv-1';
  DELETE FROM ProductVariants WHERE ProductId = (SELECT Id FROM Products WHERE Slug = 'sony-bravia-smart-tv-1');
  
  INSERT INTO ProductVariants (ProductId, AttributesJSON, SKU, MRP, FinalPrice, Stock)
  SELECT Id, '{"Display Size": "55 Inch"}', 'SKU-SONY-55', 69900, 52990, 10
  FROM Products WHERE Slug = 'sony-bravia-smart-tv-1';
  
  INSERT INTO ProductVariants (ProductId, AttributesJSON, SKU, MRP, FinalPrice, Stock)
  SELECT Id, '{"Display Size": "65 Inch"}', 'SKU-SONY-65', 99900, 82990, 5
  FROM Products WHERE Slug = 'sony-bravia-smart-tv-1';

  -- LG SMART TV
  UPDATE Products SET VariantKeys = '["Display Size"]'::jsonb WHERE Slug = 'sony-bravia-smart-tv-2';
  DELETE FROM ProductVariants WHERE ProductId = (SELECT Id FROM Products WHERE Slug = 'sony-bravia-smart-tv-2');
  
  INSERT INTO ProductVariants (ProductId, AttributesJSON, SKU, MRP, FinalPrice, Stock)
  SELECT Id, '{"Display Size": "43 Inch"}', 'SKU-LG-43', 49990, 31990, 20
  FROM Products WHERE Slug = 'sony-bravia-smart-tv-2';
  
  INSERT INTO ProductVariants (ProductId, AttributesJSON, SKU, MRP, FinalPrice, Stock)
  SELECT Id, '{"Display Size": "50 Inch"}', 'SKU-LG-50', 59990, 41990, 15
  FROM Products WHERE Slug = 'sony-bravia-smart-tv-2';

  -- 2. Washing Machines 
  UPDATE Products SET VariantKeys = '["Capacity", "Color"]'::jsonb WHERE Slug = 'lg-front-load-washer-1';
  DELETE FROM ProductVariants WHERE ProductId = (SELECT Id FROM Products WHERE Slug = 'lg-front-load-washer-1');
  
  INSERT INTO ProductVariants (ProductId, AttributesJSON, SKU, MRP, FinalPrice, Stock)
  SELECT Id, '{"Capacity": "7 KG", "Color": "Silver"}', 'SKU-IFB-7S', 36990, 29990, 15
  FROM Products WHERE Slug = 'lg-front-load-washer-1';
  
  INSERT INTO ProductVariants (ProductId, AttributesJSON, SKU, MRP, FinalPrice, Stock)
  SELECT Id, '{"Capacity": "8 KG", "Color": "Silver"}', 'SKU-IFB-8S', 39990, 32990, 25
  FROM Products WHERE Slug = 'lg-front-load-washer-1';

  INSERT INTO ProductVariants (ProductId, AttributesJSON, SKU, MRP, FinalPrice, Stock)
  SELECT Id, '{"Capacity": "8 KG", "Color": "White"}', 'SKU-IFB-8W', 38990, 31990, 10
  FROM Products WHERE Slug = 'lg-front-load-washer-1';

  -- 3. Samsung Galaxy (Phone)
  UPDATE Products SET VariantKeys = '["Color", "Internal Storage"]'::jsonb WHERE Slug = 'samsung-galaxy-s-1';
  DELETE FROM ProductVariants WHERE ProductId = (SELECT Id FROM Products WHERE Slug = 'samsung-galaxy-s-1');
  
  INSERT INTO ProductVariants (ProductId, AttributesJSON, SKU, MRP, FinalPrice, Stock)
  SELECT Id, '{"Color": "Green", "Internal Storage": "256 GB"}', 'SKU-SAM-G256', 149999, 124999, 12
  FROM Products WHERE Slug = 'samsung-galaxy-s-1';
  
  INSERT INTO ProductVariants (ProductId, AttributesJSON, SKU, MRP, FinalPrice, Stock)
  SELECT Id, '{"Color": "Phantom Black", "Internal Storage": "256 GB"}', 'SKU-SAM-B256', 149999, 124999, 8
  FROM Products WHERE Slug = 'samsung-galaxy-s-1';
  
  INSERT INTO ProductVariants (ProductId, AttributesJSON, SKU, MRP, FinalPrice, Stock)
  SELECT Id, '{"Color": "Phantom Black", "Internal Storage": "512 GB"}', 'SKU-SAM-B512', 161999, 134999, 5
  FROM Products WHERE Slug = 'samsung-galaxy-s-1';

  -- 4. AC
  UPDATE Products SET VariantKeys = '["Capacity in Tons", "Star Rating"]'::jsonb WHERE Slug = 'daikin-split-ac-1';
  DELETE FROM ProductVariants WHERE ProductId = (SELECT Id FROM Products WHERE Slug = 'daikin-split-ac-1');
  
  INSERT INTO ProductVariants (ProductId, AttributesJSON, SKU, MRP, FinalPrice, Stock)
  SELECT Id, '{"Capacity in Tons": "1.0 Ton", "Star Rating": "3 Star"}', 'SKU-DAK-10-3', 45000, 33500, 20
  FROM Products WHERE Slug = 'daikin-split-ac-1';

  INSERT INTO ProductVariants (ProductId, AttributesJSON, SKU, MRP, FinalPrice, Stock)
  SELECT Id, '{"Capacity in Tons": "1.5 Ton", "Star Rating": "3 Star"}', 'SKU-DAK-15-3', 58400, 37500, 30
  FROM Products WHERE Slug = 'daikin-split-ac-1';
  
  INSERT INTO ProductVariants (ProductId, AttributesJSON, SKU, MRP, FinalPrice, Stock)
  SELECT Id, '{"Capacity in Tons": "1.5 Ton", "Star Rating": "5 Star"}', 'SKU-DAK-15-5', 68400, 44500, 15
  FROM Products WHERE Slug = 'daikin-split-ac-1';

END $$;
