CREATE TABLE IF NOT EXISTS Banners (
    Id SERIAL PRIMARY KEY,
    ImageUrl VARCHAR,
    LinkUrl VARCHAR,
    DisplayStyle VARCHAR DEFAULT 'Slider',
    IsActive BOOLEAN DEFAULT true,
    CategoryId INT REFERENCES Categories(Id) NULL,
    BrandId INT REFERENCES Brands(Id) NULL,
    SortOrder INT DEFAULT 0
);
