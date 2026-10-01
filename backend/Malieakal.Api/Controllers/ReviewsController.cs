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
    [Authorize]
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

        [HttpPost]
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
                    CreatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
