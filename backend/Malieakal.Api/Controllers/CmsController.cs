using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Dapper;
using System.Collections.Generic;
using Malieakal.Application.Abstractions;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CmsController : ControllerBase
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public CmsController(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        [HttpGet("banners")]
        public async Task<IActionResult> GetBanners()
        {
            using var conn = _connectionFactory.CreateConnection();
            var sql = "SELECT * FROM Banners WHERE IsActive = TRUE ORDER BY DisplayOrder";
            var result = await conn.QueryAsync(sql);
            return Ok(result);
        }

        [HttpGet("features")]
        public async Task<IActionResult> GetFeatures()
        {
            using var conn = _connectionFactory.CreateConnection();
            var sql = "SELECT * FROM Features WHERE IsActive = TRUE ORDER BY DisplayOrder";
            var result = await conn.QueryAsync(sql);
            return Ok(result);
        }

        [HttpGet("articles")]
        public async Task<IActionResult> GetArticles()
        {
            using var conn = _connectionFactory.CreateConnection();
            var sql = "SELECT * FROM Articles WHERE IsActive = TRUE ORDER BY PublishedAt DESC";
            var result = await conn.QueryAsync(sql);
            return Ok(result);
        }

        [HttpGet("brands")]
        public async Task<IActionResult> GetBrands()
        {
            using var conn = _connectionFactory.CreateConnection();
            var sql = "SELECT * FROM Brands WHERE IsActive = TRUE ORDER BY Name";
            var result = await conn.QueryAsync(sql);
            return Ok(result);
        }
    }
}
