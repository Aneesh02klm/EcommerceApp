-- Seed Data for Malieakal Electronics

-- 1. Insert Admin User (Password is 'Admin@123' hashed with BCrypt)
-- Note: You should ideally register this via API to get the correct salt, but this is a stub.
-- You can run the application, register a user via /api/v1/auth/register, and then manually map them to the Admin role.

INSERT INTO Roles (Id, Name, Description) 
VALUES 
    (1, 'Admin', 'Full administrative access'),
    (2, 'Customer', 'Standard customer access')
ON CONFLICT (Id) DO NOTHING;

-- 2. Insert Categories
INSERT INTO Categories (Id, Name, Slug, Description, IsActive, DisplayOrder) 
VALUES 
    (1, 'Washing Machines', 'washing-machines', 'Front Load, Top Load, and Semi-Automatic Washers', TRUE, 1),
    (2, 'Refrigerators', 'refrigerators', 'Single Door, Double Door, and Side-by-Side', TRUE, 2),
    (3, 'Televisions', 'televisions', 'LED, OLED, and QLED Smart TVs', TRUE, 3),
    (4, 'Air Conditioners', 'air-conditioners', 'Split and Window ACs', TRUE, 4)
ON CONFLICT (Id) DO NOTHING;

-- 3. Insert Brands
INSERT INTO Brands (Id, Name, Slug, IsActive)
VALUES
    (1, 'LG', 'lg', TRUE),
    (2, 'Samsung', 'samsung', TRUE),
    (3, 'Sony', 'sony', TRUE),
    (4, 'Daikin', 'daikin', TRUE)
ON CONFLICT (Id) DO NOTHING;
