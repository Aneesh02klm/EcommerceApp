-- Checkout Upgrade Additions

-- Step 1: Extend Addresses table with new fields
ALTER TABLE Addresses ADD COLUMN IF NOT EXISTS Email VARCHAR(255);
ALTER TABLE Addresses ADD COLUMN IF NOT EXISTS AddressType VARCHAR(50) DEFAULT 'Home'; -- Home, Work, Other
ALTER TABLE Addresses ADD COLUMN IF NOT EXISTS FlatHouseNo VARCHAR(255);
ALTER TABLE Addresses ADD COLUMN IF NOT EXISTS AreaStreet VARCHAR(255);

-- Step 2: Extend Orders table
ALTER TABLE Orders ADD COLUMN IF NOT EXISTS PaymentMethod VARCHAR(50) DEFAULT 'Razorpay';
ALTER TABLE Orders ADD COLUMN IF NOT EXISTS EmailAddress VARCHAR(255);
ALTER TABLE Orders ADD COLUMN IF NOT EXISTS DeliveryAddressSnapshot JSONB;

-- Step 3: Fix Payments table - make RazorpayOrderId nullable for COD
ALTER TABLE Payments ALTER COLUMN RazorpayOrderId DROP NOT NULL;
