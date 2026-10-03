using Malieakal.Application.Abstractions;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Dapper;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    public class ReviewsController : ControllerBase
    {
        private readonly IDbConnectionFactory _db;

        public ReviewsController(IDbConnectionFactory db)
        {
            _db = db;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        public class ReviewDto
        {
            public Guid ProductId { get; set; }
            public int Rating { get; set; }
            public string Comment { get; set; } = string.Empty;
        }

        [HttpGet("{productId}")]
        public async Task<IActionResult> GetReviews(Guid productId)
        {
            using var connection = _db.CreateConnection();
            var sql = @"
                SELECT pr.*, u.FirstName, u.LastName 
                FROM ProductReviews pr
                LEFT JOIN Users u ON pr.UserId = u.Id
                WHERE pr.ProductId = @ProductId
                ORDER BY pr.CreatedAt DESC";
            
            try {
                var reviews = await connection.QueryAsync(sql, new { ProductId = productId });
                return Ok(new { success = true, data = reviews });
            } catch {
                return Ok(new { success = true, data = new object[] {} });
            }
        }

        [HttpPost]
        [Authorize]
        public async Task<IActionResult> SubmitReview([FromBody] ReviewDto dto)
        {
            var userId = GetUserId();
            using var connection = _db.CreateConnection();
            
            // Create table if not exists
            var createSql = @"
                CREATE TABLE IF NOT EXISTS ProductReviews (
                    Id UUID PRIMARY KEY, 
                    ProductId UUID REFERENCES Products(Id), 
                    UserId UUID REFERENCES Users(Id), 
                    Rating INT NOT NULL CHECK (Rating >= 1 AND Rating <= 5), 
                    Comment TEXT, 
                    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );";
            await connection.ExecuteAsync(createSql);

            // Insert review
            var insertSql = @"
                INSERT INTO ProductReviews (Id, ProductId, UserId, Rating, Comment)
                VALUES (@Id, @ProductId, @UserId, @Rating, @Comment)";
            
            await connection.ExecuteAsync(insertSql, new {
                Id = Guid.NewGuid(),
                ProductId = dto.ProductId,
                UserId = userId,
                Rating = dto.Rating,
                Comment = dto.Comment
            });

            return Ok(new { success = true, message = "Review submitted successfully" });
        }
    }
}
