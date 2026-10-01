-- Logistics, Pincode Serviceability & Dynamic Delivery Charges

CREATE TABLE IF NOT EXISTS LogisticsSettings (
    Id INT PRIMARY KEY DEFAULT 1,
    StoreLat DECIMAL(10, 8) NOT NULL DEFAULT 9.9312, -- Default: Kochi, Kerala
    StoreLng DECIMAL(11, 8) NOT NULL DEFAULT 76.2673,
    FreeDeliveryRadiusKm DECIMAL(10, 2) NOT NULL DEFAULT 25.0,
    ChargePerKm DECIMAL(10, 2) NOT NULL DEFAULT 10.0,
    BaseFlatRate DECIMAL(10, 2) NOT NULL DEFAULT 100.0,
    UpdatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure there is always exactly one settings row
INSERT INTO LogisticsSettings (Id, StoreLat, StoreLng, FreeDeliveryRadiusKm, ChargePerKm, BaseFlatRate)
VALUES (1, 9.9312, 76.2673, 25.0, 10.0, 100.0)
ON CONFLICT (Id) DO NOTHING;

CREATE TABLE IF NOT EXISTS StateDeliveryRules (
    Id SERIAL PRIMARY KEY,
    StateName VARCHAR(100) UNIQUE NOT NULL,
    FlatCharge DECIMAL(10, 2) NOT NULL,
    IsServiceable BOOLEAN DEFAULT TRUE,
    UpdatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS ServiceablePincodes (
    Pincode VARCHAR(20) PRIMARY KEY,
    City VARCHAR(100) NOT NULL,
    StateName VARCHAR(100) NOT NULL,
    Latitude DECIMAL(10, 8),
    Longitude DECIMAL(11, 8),
    EstimatedDeliveryDays VARCHAR(50) NOT NULL,
    IsServiceable BOOLEAN DEFAULT TRUE,
    UpdatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed a few states
INSERT INTO StateDeliveryRules (StateName, FlatCharge, IsServiceable) VALUES 
('Kerala', 50.0, TRUE),
('Tamil Nadu', 150.0, TRUE),
('Karnataka', 150.0, TRUE),
('Maharashtra', 250.0, TRUE)
ON CONFLICT (StateName) DO NOTHING;

-- Seed a few pincodes
INSERT INTO ServiceablePincodes (Pincode, City, StateName, Latitude, Longitude, EstimatedDeliveryDays, IsServiceable) VALUES
('682001', 'Kochi', 'Kerala', 9.9632, 76.2447, 'Same Day Delivery', TRUE),
('682024', 'Kochi', 'Kerala', 10.0261, 76.3125, 'Same Day Delivery', TRUE),
('560001', 'Bangalore', 'Karnataka', 12.9716, 77.5946, '3-4 Days', TRUE),
('400001', 'Mumbai', 'Maharashtra', 18.9322, 72.8264, '5-7 Days', TRUE)
ON CONFLICT (Pincode) DO NOTHING;
