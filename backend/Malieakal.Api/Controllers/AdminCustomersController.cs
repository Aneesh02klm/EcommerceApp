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
    [Route("api/v1/admin/customers")]
    [Authorize(Roles = "Admin")]
    public class AdminCustomersController : ControllerBase
    {
        private readonly IDbConnectionFactory _dbConnectionFactory;

        public AdminCustomersController(IDbConnectionFactory dbConnectionFactory)
        {
            _dbConnectionFactory = dbConnectionFactory;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllCustomers()
        {
            try
            {
                using var connection = _dbConnectionFactory.CreateConnection();
                var sql = @"
                    SELECT 
                        u.Id, 
                        u.FirstName, 
                        u.LastName, 
                        u.Email, 
                        u.Phone, 
                        u.CreatedAt, 
                        u.MemberTier,
                        COUNT(o.Id) as TotalOrders,
                        COALESCE(SUM(o.TotalAmount), 0) as LifetimeSpend
                    FROM Users u
                    JOIN UserRoles ur ON u.Id = ur.UserId
                    JOIN Roles r ON ur.RoleId = r.Id
                    LEFT JOIN Orders o ON u.Id = o.UserId AND o.Status != 'Cancelled'
                    WHERE r.Name = 'Customer'
                    GROUP BY u.Id, u.FirstName, u.LastName, u.Email, u.Phone, u.CreatedAt, u.MemberTier
                    ORDER BY u.CreatedAt DESC;
                ";

                var customers = await connection.QueryAsync<dynamic>(sql);
                return Ok(new { success = true, data = customers });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { success = false, message = "Failed to load customers.", error = ex.Message });
            }
        }
    }
}
