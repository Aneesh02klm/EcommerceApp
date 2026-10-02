using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Malieakal.Application.Abstractions;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using System;
using System.Linq;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/admin/reports")]
    [Authorize(Roles = "Admin")]
    public class ReportsController : ControllerBase
    {
        private readonly IDbConnectionFactory _db;

        public ReportsController(IDbConnectionFactory db)
        {
            _db = db;
        }

        
        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboardMetrics([FromQuery] string period = "lifetime")
        {
            using var connection = _db.CreateConnection();
            
            var revenueQuery = @"
                SELECT 
                    TO_CHAR(CreatedAt, 'Mon YYYY') as Month,
                    SUM(TotalAmount) as Revenue,
                    COUNT(Id) as OrderCount
                FROM Orders 
                WHERE Status != 'Cancelled' AND CreatedAt >= NOW() - INTERVAL '6 months'
                GROUP BY TO_CHAR(CreatedAt, 'Mon YYYY'), DATE_TRUNC('month', CreatedAt)
                ORDER BY DATE_TRUNC('month', CreatedAt) ASC;
            ";
            var revenueTrends = await connection.QueryAsync(revenueQuery);

            var topCategoriesQuery = @"
                SELECT c.Name as Category, COUNT(oi.Id) as Sales
                FROM OrderItems oi
                JOIN Products p ON oi.ProductId = p.Id
                JOIN Categories c ON p.CategoryId = c.Id
                JOIN Orders o ON oi.OrderId = o.Id
                WHERE o.Status != 'Cancelled'
                GROUP BY c.Name
                ORDER BY Sales DESC LIMIT 5;
            ";
            var topCategories = await connection.QueryAsync(topCategoriesQuery);

            string dateFilter = "1=1";
            if (period == "today") dateFilter = "CreatedAt >= CURRENT_DATE";
            else if (period == "week") dateFilter = "CreatedAt >= NOW() - INTERVAL '7 days'";
            else if (period == "month") dateFilter = "CreatedAt >= NOW() - INTERVAL '1 month'";
            else if (period == "6months") dateFilter = "CreatedAt >= NOW() - INTERVAL '6 months'";
            else if (period == "year") dateFilter = "CreatedAt >= NOW() - INTERVAL '1 year'";

            var summary = await connection.QueryFirstOrDefaultAsync($@"
                SELECT 
                    (SELECT COUNT(*) FROM Users WHERE IsActive = TRUE AND {dateFilter.Replace("CreatedAt", "CreatedAt")}) as TotalCustomers,
                    (SELECT COALESCE(SUM(TotalAmount),0) FROM Orders WHERE Status != 'Cancelled' AND {dateFilter}) as LifetimeRevenue,
                    (SELECT COUNT(*) FROM Orders WHERE {dateFilter}) as TotalOrders
            ");

            return Ok(new { success = true, data = new { revenueTrends, topCategories, summary } });
        }


        [HttpGet("{reportId}")]
        public async Task<IActionResult> GetDetailedReport(string reportId, [FromQuery] string? startDate = null, [FromQuery] string? endDate = null)
        {
            using var connection = _db.CreateConnection();
            
            if (reportId == "sales-by-date")
            {
                var sql = @"
                    SELECT 
                        DATE(CreatedAt) as Date,
                        COUNT(Id) as Orders,
                        SUM(TotalAmount) as Revenue,
                        SUM(Discount) as Discounts
                    FROM Orders
                    WHERE Status != 'Cancelled'
                    GROUP BY DATE(CreatedAt)
                    ORDER BY DATE(CreatedAt) DESC;
                ";
                var data = await connection.QueryAsync(sql);
                return Ok(new { success = true, data });
            }
            else if (reportId == "inventory-valuation")
            {
                var sql = @"
                    SELECT 
                        p.Name,
                        p.Model as ModelNumber,
                        p.Stock as AvailableStock,
                        p.FinalPrice as UnitPrice,
                        (p.Stock * p.FinalPrice) as TotalValue
                    FROM Products p
                    WHERE p.Stock > 0
                    ORDER BY TotalValue DESC;
                ";
                var data = await connection.QueryAsync(sql);
                return Ok(new { success = true, data });
            }
            
            
            else if (reportId == "coupon-usage")
            {
                var sql = @"
                    SELECT 
                        Code as CouponCode,
                        DiscountType,
                        DiscountValue,
                        TimesUsed,
                        (SELECT COUNT(*) FROM Orders WHERE PromoCode = Coupons.Code) as TotalOrdersApplied,
                        (SELECT SUM(PromoDiscount) FROM Orders WHERE PromoCode = Coupons.Code) as TotalDiscountGiven
                    FROM Coupons
                    ORDER BY TimesUsed DESC;
                ";
                var data = await connection.QueryAsync(sql);
                return Ok(new { success = true, data });
            }
            else if (reportId == "product-performance")
            {
                var sql = @"
                    SELECT 
                        p.Name,
                        c.Name as Category,
                        p.Stock as AvailableStock,
                        COALESCE(SUM(oi.Quantity), 0) as TotalUnitsSold,
                        COALESCE(SUM(oi.Price * oi.Quantity), 0) as TotalRevenueGenerated
                    FROM Products p
                    LEFT JOIN OrderItems oi ON p.Id = oi.ProductId
                    LEFT JOIN Categories c ON p.CategoryId = c.Id
                    GROUP BY p.Name, c.Name, p.Stock
                    ORDER BY TotalRevenueGenerated DESC NULLS LAST;
                ";
                var data = await connection.QueryAsync(sql);
                return Ok(new { success = true, data });
            }
            
            else if (reportId == "low-stock-inventory")
            {
                // Default threshold to 5 if not provided in some other way, but we will accept a query param if we had one.
                // Re-using startDate as a threshold string for simplicity
                int threshold = 5;
                if (!string.IsNullOrEmpty(startDate) && int.TryParse(startDate, out int t)) threshold = t;

                var sql = @"
                    SELECT 
                        Name,
                        Model as ModelNumber,
                        Stock as CurrentStock,
                        FinalPrice as UnitPrice
                    FROM Products
                    WHERE Stock <= @Threshold
                    ORDER BY Stock ASC;
                ";
                var data = await connection.QueryAsync(sql, new { Threshold = threshold });
                return Ok(new { success = true, data });
            }
            else if (reportId == "warranty-metrics")
            {
                var sql = @"
                    SELECT 
                        Status,
                        COUNT(Id) as TotalClaims,
                        COUNT(DISTINCT ProductId) as AffectedProducts,
                        MAX(UpdatedAt) as LastUpdate
                    FROM WarrantyClaims
                    GROUP BY Status
                    ORDER BY TotalClaims DESC;
                ";
                var data = await connection.QueryAsync(sql);
                return Ok(new { success = true, data });
            }
            else if (reportId == "campaign-roi")
            {
                var sql = @"
                    SELECT 
                        Type as NotificationType,
                        TargetAudience,
                        COUNT(Id) as CampaignsSent,
                        SUM(CASE WHEN IsSent THEN 1 ELSE 0 END) as SuccessfullyDelivered
                    FROM Notifications
                    GROUP BY Type, TargetAudience;
                ";
                var data = await connection.QueryAsync(sql);
                return Ok(new { success = true, data });
            }
            else if (reportId == "tax-discount-summary")
            {
                var sql = @"
                    SELECT 
                        DATE_TRUNC('month', CreatedAt) as Month,
                        COUNT(Id) as TotalOrders,
                        SUM(PromoDiscount) as TotalDiscountsIssued,
                        SUM(TotalAmount) as TotalNetRevenue
                    FROM Orders
                    WHERE Status != 'Cancelled'
                    GROUP BY DATE_TRUNC('month', CreatedAt)
                    ORDER BY Month DESC;
                ";
                var data = await connection.QueryAsync(sql);
                return Ok(new { success = true, data });
            }
            return NotFound(new { success = false, message = "Report not found" });


        }
    }
}
