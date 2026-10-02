using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System;
using System.Threading.Tasks;
using Malieakal.Application.Abstractions;
using Dapper;

namespace Malieakal.Api.Controllers
{
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
        public async Task<IActionResult> GetDashboardMetrics()
        {
            try
            {
                using var connection = _dbConnectionFactory.CreateConnection();
                var sql = @"
                    -- 1. Today's Sales & Orders
                    SELECT 
                        COALESCE(SUM(TotalAmount), 0) as TodaysSales,
                        COUNT(Id) as TodaysOrders
                    FROM Orders
                    WHERE DATE(CreatedAt) = CURRENT_DATE;

                    -- 2. Active Customers
                    SELECT COUNT(u.Id) as ActiveCustomers
                    FROM Users u
                    JOIN UserRoles ur ON u.Id = ur.UserId
                    JOIN Roles r ON ur.RoleId = r.Id
                    WHERE r.Name = 'Customer';

                    -- 3. Pending Orders
                    SELECT COUNT(Id) as PendingOrders
                    FROM Orders
                    WHERE Status NOT IN ('Delivered', 'Cancelled');

                    -- 4. Revenue This Month
                    SELECT COALESCE(SUM(TotalAmount), 0) as RevenueThisMonth
                    FROM Orders
                    WHERE EXTRACT(MONTH FROM CreatedAt) = EXTRACT(MONTH FROM CURRENT_DATE)
                      AND EXTRACT(YEAR FROM CreatedAt) = EXTRACT(YEAR FROM CURRENT_DATE);

                    -- 5. Products In Stock & Low Stock
                    SELECT 
                        COUNT(Id) as ProductsInStock,
                        COUNT(CASE WHEN StockQuantity <= 5 THEN 1 END) as LowStockAlerts
                    FROM Products
                    WHERE IsActive = true;

                    -- 6. Open Complaints
                    SELECT COUNT(Id) as OpenComplaints
                    FROM UserComplaints
                    WHERE Status = 'Open';

                    -- 7. Recent Orders (limit 5)
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
                ";

                using var multi = await connection.QueryMultipleAsync(sql);

                var todaysMetrics = await multi.ReadSingleAsync<dynamic>();
                var activeCustomers = await multi.ReadSingleAsync<int>();
                var pendingOrders = await multi.ReadSingleAsync<int>();
                var revenueThisMonth = await multi.ReadSingleAsync<decimal>();
                var stockMetrics = await multi.ReadSingleAsync<dynamic>();
                var openComplaints = await multi.ReadSingleAsync<int>();
                
                var recentOrders = await multi.ReadAsync<dynamic>();
                var topProducts = await multi.ReadAsync<dynamic>();

                return Ok(new
                {
                    success = true,
                    data = new
                    {
                        todaysSales = todaysMetrics.todayssales,
                        todaysOrders = todaysMetrics.todaysorders,
                        activeCustomers,
                        pendingOrders,
                        revenueThisMonth,
                        productsInStock = stockMetrics.productsinstock,
                        lowStockAlerts = stockMetrics.lowstockalerts,
                        openComplaints,
                        recentOrders,
                        topProducts
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
