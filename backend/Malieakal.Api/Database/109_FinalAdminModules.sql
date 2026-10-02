-- 109_FinalAdminModules.sql

-- 1. Marketing
CREATE TABLE IF NOT EXISTS FlashSales (
    Id SERIAL PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    StartTime TIMESTAMP NOT NULL,
    EndTime TIMESTAMP NOT NULL,
    IsActive BOOLEAN DEFAULT TRUE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS FlashSaleItems (
    Id SERIAL PRIMARY KEY,
    FlashSaleId INT REFERENCES FlashSales(Id) ON DELETE CASCADE,
    ProductId UUID NOT NULL,
    DiscountPercentage DECIMAL(5,2),
    SpecialPrice DECIMAL(18,2),
    StockLimit INT,
    SoldQuantity INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS ScratchCards (
    Id SERIAL PRIMARY KEY,
    OrderId UUID NOT NULL,
    UserId UUID NOT NULL,
    IsScratched BOOLEAN DEFAULT FALSE,
    RewardType VARCHAR(50), -- 'Coupon', 'Cashback', 'None'
    RewardValue VARCHAR(255),
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Notifications (
    Id SERIAL PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Message TEXT NOT NULL,
    Type VARCHAR(50), -- 'Push', 'InApp', 'Email'
    TargetAudience VARCHAR(50), -- 'All', 'Specific'
    ScheduledTime TIMESTAMP,
    IsSent BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Content
CREATE TABLE IF NOT EXISTS Blogs (
    Id SERIAL PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Slug VARCHAR(255) UNIQUE NOT NULL,
    Content TEXT NOT NULL,
    Author VARCHAR(255),
    ImageUrl VARCHAR(255),
    IsPublished BOOLEAN DEFAULT FALSE,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS Faqs (
    Id SERIAL PRIMARY KEY,
    Question TEXT NOT NULL,
    Answer TEXT NOT NULL,
    Category VARCHAR(100),
    SortOrder INT DEFAULT 0
);

-- 3. Warranty & Support
CREATE TABLE IF NOT EXISTS SupportTickets (
    Id SERIAL PRIMARY KEY,
    UserId UUID NOT NULL,
    OrderId UUID,
    Subject VARCHAR(255) NOT NULL,
    Message TEXT NOT NULL,
    Status VARCHAR(50) DEFAULT 'Open', -- 'Open', 'InProgress', 'Resolved', 'Closed'
    Priority VARCHAR(50) DEFAULT 'Medium',
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS WarrantyClaims (
    Id SERIAL PRIMARY KEY,
    UserId UUID NOT NULL,
    ProductId UUID NOT NULL,
    SerialNumber VARCHAR(255),
    IssueDescription TEXT,
    Status VARCHAR(50) DEFAULT 'Pending', -- 'Pending', 'Approved', 'Rejected', 'Repaired'
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Settings
CREATE TABLE IF NOT EXISTS StoreSettings (
    Id SERIAL PRIMARY KEY,
    KeyName VARCHAR(100) UNIQUE NOT NULL,
    KeyValue TEXT NOT NULL,
    DataType VARCHAR(50) DEFAULT 'String',
    Description TEXT
);

-- Insert Default Settings
INSERT INTO StoreSettings (KeyName, KeyValue, DataType, Description) VALUES
('StoreName', 'Malieakal Electronics', 'String', 'Name of the store'),
('ContactEmail', 'support@malieakal.com', 'String', 'Customer support email'),
('ContactPhone', '1800-123-4567', 'String', 'Customer support phone'),
('FreeShippingThreshold', '5000', 'Number', 'Minimum cart value for free shipping'),
('MaintenanceMode', 'false', 'Boolean', 'Is the store under maintenance?')
ON CONFLICT (KeyName) DO NOTHING;
