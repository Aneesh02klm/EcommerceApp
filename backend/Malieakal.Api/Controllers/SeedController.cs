using Malieakal.Application.Abstractions;
using Microsoft.AspNetCore.Mvc;
using System.IO;
using System.Threading.Tasks;
using Dapper;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SeedController : ControllerBase
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public SeedController(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        [HttpPost("run-figma-seed")]
        public async Task<IActionResult> RunFigmaSeed()
        {
            var scriptPath = Path.Combine(Directory.GetCurrentDirectory(), "Database", "99_Figma_Seed.sql");
            if (!System.IO.File.Exists(scriptPath)) return NotFound("Seed script not found.");

            var sql = await System.IO.File.ReadAllTextAsync(scriptPath);

            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync(sql);

            return Ok("Figma pixel-perfect seed data inserted successfully.");
        }
    }
}
