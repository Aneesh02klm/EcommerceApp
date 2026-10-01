-- 107_OrderTracking.sql
-- Add order tracking and logistics fields to Orders table

ALTER TABLE Orders ADD COLUMN IF NOT EXISTS DeliveryMethod VARCHAR(50); -- 'In-House' or 'Third-Party'
ALTER TABLE Orders ADD COLUMN IF NOT EXISTS CourierName VARCHAR(100);
ALTER TABLE Orders ADD COLUMN IF NOT EXISTS TrackingId VARCHAR(100);
ALTER TABLE Orders ADD COLUMN IF NOT EXISTS TrackingUrl TEXT;
