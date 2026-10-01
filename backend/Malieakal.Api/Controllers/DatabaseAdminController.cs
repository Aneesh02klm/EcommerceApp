using Malieakal.Application.Abstractions;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Dapper;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/admin/db")]
    public class DatabaseAdminController : ControllerBase
    {
        private readonly IDbConnectionFactory _db;

        public DatabaseAdminController(IDbConnectionFactory db)
        {
            _db = db;
        }

        public class QueryDto
        {
            public string Sql { get; set; } = string.Empty;
        }

        [HttpPost("execute")]
        public async Task<IActionResult> Execute([FromBody] QueryDto dto)
        {
            using var connection = _db.CreateConnection();
            await connection.ExecuteAsync(dto.Sql);
            return Ok(new { success = true });
        }
    }
}
