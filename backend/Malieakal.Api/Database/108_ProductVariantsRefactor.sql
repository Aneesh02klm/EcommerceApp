-- Safely rebuild ProductVariants
DROP TABLE IF EXISTS ProductVariants CASCADE;

CREATE TABLE ProductVariants (
    Id SERIAL PRIMARY KEY,
    ProductId UUID REFERENCES Products(Id) ON DELETE CASCADE,
    GroupName VARCHAR(255) NOT NULL, -- e.g., 'Color', 'RAM'
    OptionName VARCHAR(255) NOT NULL, -- e.g., 'Red', '256GB'
    LinkedProductId UUID REFERENCES Products(Id) ON DELETE SET NULL
);
