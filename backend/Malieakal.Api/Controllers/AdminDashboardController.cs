using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System;
using System.Threading.Tasks;
using Malieakal.Application.Abstractions;
using Dapper;

namespace Malieakal.Api.Controllers
{
    public class PeriodMetricsResult {
        public decimal PeriodSales { get; set; }
        public int PeriodOrders { get; set; }
    }

    public class StockMetricsResult {
        public int ProductsInStock { get; set; }
        public int LowStockAlerts { get; set; }
    }

    [ApiController]
    [Route("api/v1/admin/dashboard")]
    [Authorize(Roles = "Admin")]
    public class AdminDashboardController : ControllerBase
    {
        private readonly IDbConnectionFactory _dbConnectionFactory;

        public AdminDashboardController(IDbConnectionFactory dbConnectionFactory)
        {
            _dbConnectionFactory = dbConnectionFactory;
        }

        [HttpGet]
        public async Task<IActionResult> GetDashboardMetrics([FromQuery] string range = "today", [FromQuery] DateTime? start = null, [FromQuery] DateTime? end = null)
        {
            try
            {
                string safeRange = range?.ToLower().Replace(" ", "").Replace("-", "") ?? "today";
                DateTime startDate = DateTime.UtcNow.Date;
                DateTime endDate = DateTime.UtcNow.Date.AddDays(1).AddTicks(-1);

                if (safeRange == "yesterday") {
                    startDate = DateTime.UtcNow.Date.AddDays(-1);
                    endDate = startDate.AddDays(1).AddTicks(-1);
                } else if (safeRange == "last30days") {
                    startDate = DateTime.UtcNow.Date.AddDays(-30);
                } else if (safeRange == "last7days") {
                    startDate = DateTime.UtcNow.Date.AddDays(-7);
                } else if (safeRange == "thismonth") {
                    startDate = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1);
                } else if (safeRange == "custom" && start.HasValue && end.HasValue) {
                    startDate = start.Value.ToUniversalTime().Date;
                    endDate = end.Value.ToUniversalTime().Date.AddDays(1).AddTicks(-1);
                }

                using var connection = _dbConnectionFactory.CreateConnection();
                var sql = @"
                    -- 1. Period Sales & Orders
                    SELECT 
                        COALESCE(SUM(TotalAmount), 0) as PeriodSales,
                        COUNT(Id) as PeriodOrders
                    FROM Orders
                    WHERE Status != 'Cancelled' AND CreatedAt >= @StartDate AND CreatedAt <= @EndDate;

                    -- 2. Active Customers
                    SELECT COUNT(u.Id) as ActiveCustomers
                    FROM Users u
                    JOIN UserRoles ur ON u.Id = ur.UserId
                    JOIN Roles r ON ur.RoleId = r.Id
                    WHERE r.Name = 'Customer' AND u.CreatedAt >= @StartDate AND u.CreatedAt <= @EndDate;

                    -- 3. Pending Orders
                    SELECT COUNT(Id) as PendingOrders
                    FROM Orders
                    WHERE Status NOT IN ('Delivered', 'Cancelled') AND CreatedAt >= @StartDate AND CreatedAt <= @EndDate;

                    -- 4. Revenue This Month
                    SELECT COALESCE(SUM(TotalAmount), 0) as RevenueThisMonth
                    FROM Orders
                    WHERE Status != 'Cancelled' AND CreatedAt >= @StartDate AND CreatedAt <= @EndDate;

                    -- 5. Products In Stock & Low Stock
                    SELECT 
                        COUNT(Id) as ProductsInStock,
                        COUNT(CASE WHEN Stock <= 5 THEN 1 END) as LowStockAlerts
                    FROM Products
                    WHERE IsActive = true;

                    -- 6. Open Complaints
                    SELECT COUNT(Id) as OpenComplaints
                    FROM UserComplaints
                    WHERE Status = 'Open' AND CreatedAt >= @StartDate AND CreatedAt <= @EndDate;

                    -- 7. Recent Orders
                    SELECT 
                        o.OrderNumber as Id, 
                        a.FullName as Customer, 
                        o.TotalAmount as Amount, 
                        o.Status as Status, 
                        o.CreatedAt as Date
                    FROM Orders o
                    LEFT JOIN Addresses a ON o.ShippingAddressId = a.Id
                    ORDER BY o.CreatedAt DESC
                    LIMIT 5;

                    -- 8. Top Selling Products
                    SELECT 
                        p.Name, 
                        SUM(oi.Quantity) as UnitsSold, 
                        SUM(oi.Price * oi.Quantity) as Revenue
                    FROM OrderItems oi
                    JOIN Products p ON oi.ProductId = p.Id
                    JOIN Orders o ON oi.OrderId = o.Id
                    WHERE o.Status != 'Cancelled'
                    GROUP BY p.Id, p.Name
                    ORDER BY UnitsSold DESC
                    LIMIT 3;

                    -- 9. Revenue Trend
                    SELECT 
                        TO_CHAR(DATE(CreatedAt), 'YYYY-MM-DD') as Date,
                        COALESCE(SUM(TotalAmount), 0) as Revenue
                    FROM Orders
                    WHERE Status != 'Cancelled' AND CreatedAt >= @StartDate AND CreatedAt <= @EndDate
                    GROUP BY DATE(CreatedAt)
                    ORDER BY DATE(CreatedAt);

                    -- 10. Active Promotion (Latest Coupon)
                    SELECT 
                        Code as Title,
                        DiscountType,
                        DiscountValue,
                        (SELECT COUNT(Id) FROM Orders WHERE Discount > 0 AND CreatedAt >= @StartDate AND CreatedAt <= @EndDate) as Conversions
                    FROM Coupons
                    WHERE IsActive = true
                    ORDER BY CreatedAt DESC
                    LIMIT 1;
                ";

                using var multi = await connection.QueryMultipleAsync(sql, new { StartDate = startDate, EndDate = endDate });

                var periodMetrics = await multi.ReadSingleAsync<PeriodMetricsResult>();
                var activeCustomers = await multi.ReadSingleAsync<int>();
                var pendingOrders = await multi.ReadSingleAsync<int>();
                var revenueThisMonth = await multi.ReadSingleAsync<decimal>();
                var stockMetrics = await multi.ReadSingleAsync<StockMetricsResult>();
                var openComplaints = await multi.ReadSingleAsync<int>();
                var recentOrders = await multi.ReadAsync<dynamic>();
                var topProducts = await multi.ReadAsync<dynamic>();
                var revenueTrend = await multi.ReadAsync<dynamic>();
                var activePromotion = await multi.ReadFirstOrDefaultAsync<dynamic>();

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        periodSales = periodMetrics.PeriodSales,
                        periodOrders = periodMetrics.PeriodOrders,
                        activeCustomers = activeCustomers,
                        pendingOrders = pendingOrders,
                        periodRevenue = revenueThisMonth,
                        productsInStock = stockMetrics.ProductsInStock,
                        lowStockAlerts = stockMetrics.LowStockAlerts,
                        openComplaints = openComplaints,
                        recentOrders = recentOrders,
                        topProducts = topProducts,
                        revenueTrend = revenueTrend,
                        activePromotion = activePromotion
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Failed to load dashboard metrics.", error = ex.Message });
            }
        }
    }
}
