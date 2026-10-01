-- Catalog Schema Foundation

CREATE TABLE IF NOT EXISTS Categories (
    Id SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Slug VARCHAR(150) NOT NULL UNIQUE,
    Description TEXT,
    ImageUrl VARCHAR(255),
    IsActive BOOLEAN DEFAULT TRUE,
    SeoTitle VARCHAR(150),
    SeoDescription VARCHAR(255),
    DisplayOrder INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS Subcategories (
    Id SERIAL PRIMARY KEY,
    CategoryId INT REFERENCES Categories(Id) ON DELETE CASCADE,
    Name VARCHAR(100) NOT NULL,
    Slug VARCHAR(150) NOT NULL UNIQUE,
    Description TEXT,
    IsActive BOOLEAN DEFAULT TRUE,
    SeoTitle VARCHAR(150),
    SeoDescription VARCHAR(255),
    DisplayOrder INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS Brands (
    Id SERIAL PRIMARY KEY,
    Name VARCHAR(100) NOT NULL,
    Slug VARCHAR(150) NOT NULL UNIQUE,
    Description TEXT,
    LogoUrl VARCHAR(255),
    IsActive BOOLEAN DEFAULT TRUE,
    SeoTitle VARCHAR(150),
    SeoDescription VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS Products (
    Id SERIAL PRIMARY KEY,
    CategoryId INT REFERENCES Categories(Id),
    SubcategoryId INT REFERENCES Subcategories(Id),
    BrandId INT REFERENCES Brands(Id),
    Name VARCHAR(200) NOT NULL,
    Slug VARCHAR(250) NOT NULL UNIQUE,
    SKU VARCHAR(100) UNIQUE,
    Model VARCHAR(100),
    MRP DECIMAL(18, 2) NOT NULL,
    Discount DECIMAL(18, 2) DEFAULT 0,
    MRP DECIMAL(18, 2) NOT NULL DEFAULT 0,
    FinalPrice DECIMAL(18, 2) NOT NULL,
    Stock INT DEFAULT 0,
    Description TEXT,
    Features TEXT,
    Highlights TEXT,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ProductImages (
    Id SERIAL PRIMARY KEY,
    ProductId UUID REFERENCES Products(Id) ON DELETE CASCADE,
    ImageUrl VARCHAR(255) NOT NULL,
    IsPrimary BOOLEAN DEFAULT FALSE,
    DisplayOrder INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS SpecificationDefinitions (
    Id SERIAL PRIMARY KEY,
    CategoryId INT REFERENCES Categories(Id) ON DELETE CASCADE,
    Name VARCHAR(100) NOT NULL,
    DataType VARCHAR(50) NOT NULL, -- 'Text', 'Number', 'Decimal', 'Boolean', 'Select', 'MultiSelect'
    IsRequired BOOLEAN DEFAULT FALSE,
    Unit VARCHAR(50),
    AllowedValues TEXT, -- Stored as comma-separated or JSON
    IsFilterable BOOLEAN DEFAULT FALSE,
    IsSearchable BOOLEAN DEFAULT FALSE,
    IsComparable BOOLEAN DEFAULT FALSE,
    DisplayOrder INT DEFAULT 0,
    IsActive BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS ProductSpecifications (
    ProductId UUID REFERENCES Products(Id) ON DELETE CASCADE,
    SpecificationDefinitionId INT REFERENCES SpecificationDefinitions(Id) ON DELETE CASCADE,
    Value TEXT NOT NULL,
    PRIMARY KEY (ProductId, SpecificationDefinitionId)
);

ALTER TABLE Categories ADD COLUMN IF NOT EXISTS SpecificationTemplate JSONB DEFAULT '{}'::jsonb;
ALTER TABLE Categories ADD COLUMN IF NOT EXISTS HighlightKeys JSONB DEFAULT '[]'::jsonb;

ALTER TABLE Products ADD COLUMN IF NOT EXISTS SpecificationJson JSONB DEFAULT '{}'::jsonb;
ALTER TABLE Products ADD COLUMN IF NOT EXISTS VariantKeys JSONB DEFAULT '[]'::jsonb;

DROP TABLE IF EXISTS ProductVariants;
CREATE TABLE ProductVariants (
    Id SERIAL PRIMARY KEY,
    ProductId UUID REFERENCES Products(Id) ON DELETE CASCADE,
    AttributesJSON JSONB NOT NULL,
    SKU VARCHAR(100),
    MRP DECIMAL(18, 2) NOT NULL,
    FinalPrice DECIMAL(18, 2) NOT NULL,
    Stock INT DEFAULT 0,
    ImageUrl VARCHAR(255)
);
