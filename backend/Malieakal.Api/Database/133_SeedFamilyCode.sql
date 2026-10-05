INSERT INTO Products (Id, CategoryId, BrandId, Name, Slug, SKU, FamilyCode, MRP, FinalPrice, Stock, IsActive, CreatedAt, UpdatedAt)
VALUES 
('11111111-0000-0000-0000-000000000001', 1, 1, 'Samsung Galaxy S23 (8GB RAM, 128GB, Phantom Black)', 'samsung-galaxy-s23-128gb-black', 'SGS23-128-BLK', 'GALAXY-S23', 74999.00, 74999.00, 50, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('11111111-0000-0000-0000-000000000002', 1, 1, 'Samsung Galaxy S23 (8GB RAM, 256GB, Phantom Black)', 'samsung-galaxy-s23-256gb-black', 'SGS23-256-BLK', 'GALAXY-S23', 79999.00, 79999.00, 30, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('11111111-0000-0000-0000-000000000003', 1, 1, 'Samsung Galaxy S23 (8GB RAM, 256GB, Cream)', 'samsung-galaxy-s23-256gb-cream', 'SGS23-256-CRM', 'GALAXY-S23', 79999.00, 79999.00, 20, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

INSERT INTO ProductImages (ProductId, ImageUrl, IsPrimary, DisplayOrder)
VALUES
('11111111-0000-0000-0000-000000000001', '/uploads/categories/mobiles.jpg', true, 1),
('11111111-0000-0000-0000-000000000002', '/uploads/categories/mobiles.jpg', true, 1),
('11111111-0000-0000-0000-000000000003', '/uploads/categories/mobiles.jpg', true, 1);
