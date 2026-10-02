using Dapper;
using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Malieakal.Infrastructure.Repositories
{
    public class OrderRepository : IOrderRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public OrderRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        // ─── Address Methods ─────────────────────────────────────────────────────

        public async Task<int> CreateAddressAsync(Address address)
        {
            using var connection = _connectionFactory.CreateConnection();
            
            // 1. Data Normalization Helper
            string Normalize(string? input)
            {
                if (string.IsNullOrWhiteSpace(input)) return string.Empty;
                var sb = new System.Text.StringBuilder();
                foreach (char c in input)
                {
                    if (char.IsLetterOrDigit(c))
                        sb.Append(char.ToLowerInvariant(c));
                }
                return sb.ToString();
            }

            // 2. Fetch all existing addresses for the user
            var existingAddresses = await connection.QueryAsync<Address>(
                "SELECT * FROM Addresses WHERE UserId = @UserId", 
                new { UserId = address.UserId }
            );

            // 3. Normalize incoming key fields
            var incPhone = Normalize(address.Phone);
            var incPincode = Normalize(address.Pincode);
            
            // Fallback to AddressLine1 if FlatHouseNo is null/empty
            var incLine = !string.IsNullOrWhiteSpace(address.FlatHouseNo) 
                ? address.FlatHouseNo 
                : address.AddressLine1;
            var incNormalizedLine = Normalize(incLine);
            // take first 15 chars
            if (incNormalizedLine.Length > 15) incNormalizedLine = incNormalizedLine.Substring(0, 15);

            Address? matchedAddress = null;

            // 4. Find match
            foreach (var existing in existingAddresses)
            {
                var extPhone = Normalize(existing.Phone);
                var extPincode = Normalize(existing.Pincode);
                
                var extLine = !string.IsNullOrWhiteSpace(existing.FlatHouseNo) 
                    ? existing.FlatHouseNo 
                    : existing.AddressLine1;
                var extNormalizedLine = Normalize(extLine);
                if (extNormalizedLine.Length > 15) extNormalizedLine = extNormalizedLine.Substring(0, 15);

                if (incPhone == extPhone && 
                    incPincode == extPincode && 
                    incNormalizedLine == extNormalizedLine)
                {
                    matchedAddress = existing;
                    break;
                }
            }

            // 5. Smart Overwrite (Upsert)
            if (matchedAddress != null)
            {
                var updateSql = @"
                    UPDATE Addresses 
                    SET FullName = @FullName,
                        Email = @Email,
                        Phone = @Phone,
                        AddressType = @AddressType,
                        FlatHouseNo = @FlatHouseNo,
                        AreaStreet = @AreaStreet,
                        AddressLine1 = @AddressLine1,
                        AddressLine2 = @AddressLine2,
                        City = @City,
                        State = @State,
                        Pincode = @Pincode,
                        IsDefault = @IsDefault
                    WHERE Id = @Id;
                ";
                
                // Keep the matched ID, but use the newly submitted raw text
                address.Id = matchedAddress.Id; 
                await connection.ExecuteAsync(updateSql, address);
                return address.Id;
            }

            // 6. Otherwise, Insert new
            var sql = @"
                INSERT INTO Addresses
                    (UserId, FullName, Email, Phone, AddressType, FlatHouseNo, AreaStreet,
                     AddressLine1, AddressLine2, City, State, Pincode, IsDefault)
                VALUES
                    (@UserId, @FullName, @Email, @Phone, @AddressType, @FlatHouseNo, @AreaStreet,
                     @AddressLine1, @AddressLine2, @City, @State, @Pincode, @IsDefault)
                RETURNING Id;";
            return await connection.ExecuteScalarAsync<int>(sql, address);
        }

        public async Task<IEnumerable<Address>> GetAddressesByUserIdAsync(Guid userId)
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<Address>(
                "SELECT * FROM Addresses WHERE UserId = @UserId ORDER BY IsDefault DESC",
                new { UserId = userId });
        }

        public async Task<Address?> GetAddressByIdAsync(int addressId, Guid userId)
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync<Address>(
                "SELECT * FROM Addresses WHERE Id = @Id AND UserId = @UserId",
                new { Id = addressId, UserId = userId });
        }

        public async Task UpdateAddressAsync(Address address, Guid userId)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                UPDATE Addresses
                SET FullName      = @FullName,
                    Email         = @Email,
                    Phone         = @Phone,
                    AddressType   = @AddressType,
                    FlatHouseNo   = @FlatHouseNo,
                    AreaStreet    = @AreaStreet,
                    AddressLine1  = @AddressLine1,
                    AddressLine2  = @AddressLine2,
                    City          = @City,
                    State         = @State,
                    Pincode       = @Pincode,
                    IsDefault     = @IsDefault
                WHERE Id = @Id AND UserId = @UserId";
            await connection.ExecuteAsync(sql, new
            {
                address.FullName,
                address.Email,
                address.Phone,
                address.AddressType,
                address.FlatHouseNo,
                address.AreaStreet,
                address.AddressLine1,
                address.AddressLine2,
                address.City,
                address.State,
                address.Pincode,
                address.IsDefault,
                address.Id,
                UserId = userId
            });
        }

        public async Task<bool> DeleteAddressAsync(int addressId, Guid userId)
        {
            using var connection = _connectionFactory.CreateConnection();
            var rows = await connection.ExecuteAsync(
                "DELETE FROM Addresses WHERE Id = @Id AND UserId = @UserId",
                new { Id = addressId, UserId = userId });
            return rows > 0;
        }

        public async Task SetDefaultAddressAsync(int addressId, Guid userId)
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();
            try
            {
                // Clear all defaults for this user
                await connection.ExecuteAsync(
                    "UPDATE Addresses SET IsDefault = false WHERE UserId = @UserId",
                    new { UserId = userId },
                    transaction);

                // Set the selected one as default (IDOR-safe: userId check)
                await connection.ExecuteAsync(
                    "UPDATE Addresses SET IsDefault = true WHERE Id = @Id AND UserId = @UserId",
                    new { Id = addressId, UserId = userId },
                    transaction);

                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        // ─── Order Methods ───────────────────────────────────────────────────────

        public async Task<Guid> CreateOrderAsync(Order order, Payment payment)
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            try
            {
                var insertOrderSql = @"
                    INSERT INTO Orders
                        (Id, UserId, OrderNumber, SubTotal, Discount, ShippingCharges, TotalAmount,
                         PromoCode, PromoDiscount,
                         ShippingAddressId, Status, PaymentMethod, EmailAddress, DeliveryAddressSnapshot)
                    VALUES
                        (gen_random_uuid(), @UserId, @OrderNumber, @SubTotal, @Discount, @ShippingCharges, @TotalAmount,
                         @PromoCode, @PromoDiscount,
                         @ShippingAddressId, @Status, @PaymentMethod, @EmailAddress,
                         CAST(@DeliveryAddressSnapshot AS jsonb))
                    RETURNING Id;";
                
                var newOrderId = await connection.ExecuteScalarAsync<Guid>(insertOrderSql, new
                {
                    order.UserId,
                    order.OrderNumber,
                    order.SubTotal,
                    order.Discount,
                    order.ShippingCharges,
                    order.TotalAmount,
                    order.PromoCode,
                    order.PromoDiscount,
                    order.ShippingAddressId,
                    order.Status,
                    order.PaymentMethod,
                    order.EmailAddress,
                    order.DeliveryAddressSnapshot
                }, transaction);

                var insertItemsSql = @"
                    INSERT INTO OrderItems (OrderId, ProductId, ProductName, Price, Quantity)
                    VALUES (@OrderId, @ProductId, @ProductName, @Price, @Quantity)";
                foreach (var item in order.Items)
                {
                    item.OrderId = newOrderId;
                    await connection.ExecuteAsync(insertItemsSql, item, transaction);
                }

                var insertPaymentSql = @"
                    INSERT INTO Payments (Id, OrderId, RazorpayOrderId, Status, Amount, Method)
                    VALUES (gen_random_uuid(), @OrderId, @RazorpayOrderId, @Status, @Amount, @Method)";
                await connection.ExecuteAsync(insertPaymentSql, new
                {
                    OrderId = newOrderId,
                    payment.RazorpayOrderId,
                    payment.Status,
                    payment.Amount,
                    payment.Method
                }, transaction);

                // Clear the user's cart
                await connection.ExecuteAsync(
                    "DELETE FROM CartItems WHERE CartId = (SELECT Id FROM Carts WHERE UserId = @UserId)",
                    new { UserId = order.UserId },
                    transaction);

                
                if (!string.IsNullOrEmpty(order.PromoCode)) {
                    await connection.ExecuteAsync("UPDATE Coupons SET TimesUsed = TimesUsed + 1 WHERE Code = @PromoCode", new { PromoCode = order.PromoCode }, transaction);
                }
                transaction.Commit();
                order.Id = newOrderId; // update the original object so the controller gets the new ID
                return newOrderId;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task<Order?> GetOrderByIdAsync(Guid orderId)
        {
            using var connection = _connectionFactory.CreateConnection();
            var order = await connection.QuerySingleOrDefaultAsync<Order>(
                "SELECT * FROM Orders WHERE Id = @Id",
                new { Id = orderId });

            if (order != null)
            {
                order.Items = (await connection.QueryAsync<OrderItem>(
                    @"SELECT i.Id, i.OrderId, i.ProductId, i.ProductName, i.Price, i.Quantity,
                             pi.ImageUrl as ProductImage, p.Slug as ProductSlug, c.Slug as CategorySlug,
                             '1 Year' as WarrantyPeriod, w.ExpiryDate as WarrantyExpiryDate,
                             w.Status as WarrantyStatus
                      FROM OrderItems i
                      LEFT JOIN Products p ON p.Id = i.ProductId
                      LEFT JOIN Categories c ON c.Id = p.CategoryId
                      LEFT JOIN ProductImages pi ON pi.ProductId = p.Id AND pi.IsPrimary = TRUE
                      LEFT JOIN UserWarranties w ON w.ProductId = i.ProductId AND w.UserId = @UserId
                      WHERE i.OrderId = @OrderId",
                    new { OrderId = orderId, UserId = order.UserId }))
                    .GroupBy(i => i.Id).Select(g => g.First()).ToList();

                order.ShippingAddress = await connection.QuerySingleOrDefaultAsync<Address>(
                    "SELECT * FROM Addresses WHERE Id = @Id",
                    new { Id = order.ShippingAddressId });

                order.PaymentInfo = await connection.QuerySingleOrDefaultAsync<Payment>(
                    "SELECT * FROM Payments WHERE OrderId = @OrderId",
                    new { OrderId = orderId });
            }
            return order;
        }
        public async Task<bool> LinkGuestOrderToUserAsync(Guid orderId, Guid userId, string email)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"UPDATE Orders SET UserId = @UserId WHERE Id = @OrderId AND UserId IS NULL AND EmailAddress = @Email";
            var rows = await connection.ExecuteAsync(sql, new { OrderId = orderId, UserId = userId, Email = email });
            return rows > 0;
        }

        public async Task<IEnumerable<Order>> GetOrdersByUserIdAsync(Guid userId)
        {
            using var connection = _connectionFactory.CreateConnection();

            var sql = @"
                SELECT o.*, 
                       i.Id, i.OrderId, i.ProductId, i.ProductName, i.Price, i.Quantity,
                       pi.ImageUrl as ProductImage, p.Slug as ProductSlug, c.Slug as CategorySlug, br.Slug as BrandSlug,
                       '1 Year' as WarrantyPeriod, w.ExpiryDate as WarrantyExpiryDate,
                       w.Status as WarrantyStatus
                FROM Orders o
                LEFT JOIN OrderItems i ON o.Id = i.OrderId
                LEFT JOIN Products p ON p.Id = i.ProductId
                LEFT JOIN Categories c ON c.Id = p.CategoryId
                LEFT JOIN Brands br ON br.Id = p.BrandId
                LEFT JOIN ProductImages pi ON pi.ProductId = p.Id AND pi.IsPrimary = TRUE
                LEFT JOIN UserWarranties w ON w.ProductId = i.ProductId AND w.UserId = o.UserId
                WHERE o.UserId = @UserId
                ORDER BY o.CreatedAt DESC";

            var orderDict = new Dictionary<Guid, Order>();

            await connection.QueryAsync<Order, OrderItem, Order>(
                sql,
                (order, item) =>
                {
                    if (!orderDict.TryGetValue(order.Id, out var currentOrder))
                    {
                        currentOrder = order;
                        currentOrder.Items = new List<OrderItem>();
                        orderDict.Add(currentOrder.Id, currentOrder);
                    }

                    if (item != null && item.Id > 0)
                    {
                        if (!currentOrder.Items.Any(i => i.Id == item.Id))
                        {
                            currentOrder.Items.Add(item);
                        }
                    }

                    return currentOrder;
                },
                new { UserId = userId },
                splitOn: "Id"
            );

            return orderDict.Values;
        }

        public async Task UpdatePaymentStatusAsync(Guid orderId, string paymentId, string signature, string status)
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            try
            {
                var paymentSql = @"
                    UPDATE Payments
                    SET RazorpayPaymentId = @PaymentId, RazorpaySignature = @Signature, Status = @Status
                    WHERE OrderId = @OrderId";
                await connection.ExecuteAsync(paymentSql,
                    new { PaymentId = paymentId, Signature = signature, Status = status, OrderId = orderId },
                    transaction);

                var orderStatus = status == "Success" ? "Paid" : "Pending";
                await connection.ExecuteAsync(
                    "UPDATE Orders SET Status = @Status WHERE Id = @OrderId",
                    new { Status = orderStatus, OrderId = orderId },
                    transaction);

                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task<IEnumerable<Order>> GetAllOrdersAsync()
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync<Order>("SELECT * FROM Orders ORDER BY CreatedAt DESC");
        }

        public async Task UpdateOrderStatusAsync(Guid orderId, string status)
        {
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync(
                "UPDATE Orders SET Status = @Status, UpdatedAt = CURRENT_TIMESTAMP WHERE Id = @Id",
                new { Status = status, Id = orderId });
        }

        public async Task UpdateOrderTrackingAsync(Guid orderId, string? deliveryMethod, string? courierName, string? trackingId, string? trackingUrl)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                UPDATE Orders 
                SET DeliveryMethod = @DeliveryMethod, 
                    CourierName = @CourierName, 
                    TrackingId = @TrackingId, 
                    TrackingUrl = @TrackingUrl,
                    UpdatedAt = CURRENT_TIMESTAMP
                WHERE Id = @Id";
            await connection.ExecuteAsync(sql, new 
            { 
                DeliveryMethod = deliveryMethod,
                CourierName = courierName,
                TrackingId = trackingId,
                TrackingUrl = trackingUrl,
                Id = orderId 
            });
        }
    }
}
