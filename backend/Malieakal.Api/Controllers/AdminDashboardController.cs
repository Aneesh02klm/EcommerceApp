using Dapper;
using Malieakal.Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/admin/dashboard")]
    [Authorize(Roles = "Admin")]
    public class AdminDashboardController : ControllerBase
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public AdminDashboardController(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        [HttpGet("metrics")]
        public async Task<IActionResult> GetMetrics()
        {
            using var connection = _connectionFactory.CreateConnection();
            
            var totalOrders = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM Orders");
            var totalRevenue = await connection.ExecuteScalarAsync<decimal>("SELECT COALESCE(SUM(TotalAmount), 0) FROM Orders WHERE Status = 'Paid'");
            var totalCustomers = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM Users");
            var totalProducts = await connection.ExecuteScalarAsync<int>("SELECT COUNT(*) FROM Products WHERE IsActive = true");

            return Ok(new 
            { 
                success = true, 
                data = new 
                {
                    totalOrders,
                    totalRevenue,
                    totalCustomers,
                    totalProducts
                } 
            });
        }

        [HttpGet("recent-orders")]
        public async Task<IActionResult> GetRecentOrders()
        {
            using var connection = _connectionFactory.CreateConnection();
            var orders = await connection.QueryAsync("SELECT Id, OrderNumber, TotalAmount, Status, CreatedAt FROM Orders ORDER BY CreatedAt DESC LIMIT 5");
            return Ok(new { success = true, data = orders });
        }

        [HttpGet("low-stock")]
        public async Task<IActionResult> GetLowStock()
        {
            using var connection = _connectionFactory.CreateConnection();
            var products = await connection.QueryAsync("SELECT Id, Name, SKU, Stock FROM Products WHERE Stock <= 5 AND IsActive = true ORDER BY Stock ASC LIMIT 5");
            return Ok(new { success = true, data = products });
        }
    }
}
