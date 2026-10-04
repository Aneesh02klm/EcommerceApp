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
    [Route("api/v1/admin/marketing/flash-sales")]
    [Authorize(Roles = "Admin")]
    public class AdminFlashSalesController : ControllerBase
    {
        private readonly IDbConnectionFactory _db;
        public AdminFlashSalesController(IDbConnectionFactory db) { _db = db; }
        
        [HttpGet]
        public async Task<IActionResult> Get() {
            using var c = _db.CreateConnection();
            return Ok(new { success = true, data = await c.QueryAsync("SELECT * FROM FlashSales ORDER BY CreatedAt DESC") });
        }
    }

    [ApiController]
    [Route("api/v1/admin/settings")]
    [Authorize(Roles = "Admin")]
    public class SettingsController : ControllerBase
    {
        private readonly IDbConnectionFactory _db;
        public SettingsController(IDbConnectionFactory db) { _db = db; }
        
        [HttpGet]
        public async Task<IActionResult> Get() {
            using var c = _db.CreateConnection();
            return Ok(new { success = true, data = await c.QueryAsync("SELECT * FROM StoreSettings ORDER BY KeyName") });
        }
    }

    [ApiController]
    [Route("api/v1/admin/support")]
    [Authorize(Roles = "Admin")]
    public class SupportController : ControllerBase
    {
        private readonly IDbConnectionFactory _db;
        public SupportController(IDbConnectionFactory db) { _db = db; }
        
        [HttpGet]
        public async Task<IActionResult> Get() {
            using var c = _db.CreateConnection();
            return Ok(new { success = true, data = await c.QueryAsync("SELECT * FROM SupportTickets ORDER BY CreatedAt DESC") });
        }
    }

    [ApiController]
    [Route("api/v1/admin/warranty")]
    [Authorize(Roles = "Admin")]
    public class WarrantyController : ControllerBase
    {
        private readonly IDbConnectionFactory _db;
        public WarrantyController(IDbConnectionFactory db) { _db = db; }
        
        [HttpGet]
        public async Task<IActionResult> Get() {
            using var c = _db.CreateConnection();
            return Ok(new { success = true, data = await c.QueryAsync("SELECT * FROM WarrantyClaims ORDER BY CreatedAt DESC") });
        }
    }
}
