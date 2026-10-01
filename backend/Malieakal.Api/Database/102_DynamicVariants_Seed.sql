--
-- 102_DynamicVariants_Seed.sql
--
DO $$
BEGIN

  UPDATE Categories SET HighlightKeys = '["Washing Capacity","Energy Rating","Function Type"]'::jsonb WHERE Id = 1;
  UPDATE Categories SET HighlightKeys = '["Capacity","Star Rating","Compressor Type"]'::jsonb WHERE Id = 2;
  UPDATE Categories SET HighlightKeys = '["Display Size","Resolution","Smart TV","Refresh Rate","Sound Technology"]'::jsonb WHERE Id = 3;
  UPDATE Categories SET HighlightKeys = '["Capacity in Tons","Star Rating","Cooling Capacity","Type"]'::jsonb WHERE Id = 4;
  UPDATE Categories SET HighlightKeys = '["RAM","Internal Storage","Operating System","Processor Brand","Battery Type"]'::jsonb WHERE Id = 7;

  UPDATE Products SET VariantKeys = '["Color", "Internal Storage"]'::jsonb WHERE Id = '11111111-2222-3333-4444-000000000031';
  INSERT INTO ProductVariants (ProductId, AttributesJSON, SKU, MRP, FinalPrice, Stock) VALUES
  ('11111111-2222-3333-4444-000000000031', '{"Color": "Space Black", "Internal Storage": "256 GB"}', 'SKU-PH1', 27868.30, 22015.96, 50),
  ('11111111-2222-3333-4444-000000000031', '{"Color": "Silver", "Internal Storage": "256 GB"}', 'SKU-PH2', 27868.30, 22015.96, 30),
  ('11111111-2222-3333-4444-000000000031', '{"Color": "Space Black", "Internal Storage": "512 GB"}', 'SKU-PH3', 42868.3, 37015.96, 20);
  UPDATE Products SET VariantKeys = '["Display Size"]'::jsonb WHERE Id = '11111111-2222-3333-4444-000000000018';
  INSERT INTO ProductVariants (ProductId, AttributesJSON, SKU, MRP, FinalPrice, Stock) VALUES
  ('11111111-2222-3333-4444-000000000018', '{"Display Size": "55 Inch"}', 'SKU-TV1', 69190.47, 61579.52, 15),
  ('11111111-2222-3333-4444-000000000018', '{"Display Size": "65 Inch"}', 'SKU-TV2', 99190.47, 86579.51999999999, 10);
  UPDATE Products SET VariantKeys = '["Capacity in Tons"]'::jsonb WHERE Id = '11111111-2222-3333-4444-000000000026';
  INSERT INTO ProductVariants (ProductId, AttributesJSON, SKU, MRP, FinalPrice, Stock) VALUES
  ('11111111-2222-3333-4444-000000000026', '{"Capacity in Tons": "1.0 Ton"}', 'SKU-AC1', 50296.46, 37578.28, 40),
  ('11111111-2222-3333-4444-000000000026', '{"Capacity in Tons": "1.5 Ton"}', 'SKU-AC2', 55296.46, 42578.28, 35),
  ('11111111-2222-3333-4444-000000000026', '{"Capacity in Tons": "2.0 Ton"}', 'SKU-AC3', 63296.46, 50078.28, 20);

END $$;
