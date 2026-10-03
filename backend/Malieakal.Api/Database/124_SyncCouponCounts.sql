-- Sync Coupon TimesUsed based on actual un-cancelled orders
UPDATE Coupons c
SET TimesUsed = (
    SELECT COUNT(*) 
    FROM Orders o 
    WHERE o.PromoCode = c.Code 
    AND o.Status NOT IN ('Cancelled', 'Created')
);
