using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using Malieakal.Application.Abstractions;
using Dapper;
using Microsoft.AspNetCore.Authorization;
using System;
using Malieakal.Domain.Entities;
using System.ComponentModel.DataAnnotations;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/admin/staff")]
    [Authorize(Roles = "Admin")]
    public class AdminStaffController : ControllerBase
    {
        private readonly IDbConnectionFactory _db;
        private readonly IUserRepository _userRepository;
        private readonly IPasswordHasher _passwordHasher;

        public AdminStaffController(IDbConnectionFactory db, IUserRepository userRepository, IPasswordHasher passwordHasher)
        {
            _db = db;
            _userRepository = userRepository;
            _passwordHasher = passwordHasher;
        }

        [HttpGet]
        public async Task<IActionResult> GetStaff()
        {
            using var c = _db.CreateConnection();
            var sql = @"
                SELECT u.Id, u.FirstName, u.LastName, u.Email, u.CreatedAt, r.Name as Role 
                FROM Users u 
                JOIN UserRoles ur ON u.Id = ur.UserId 
                JOIN Roles r ON ur.RoleId = r.Id 
                WHERE r.Name IN ('Support', 'Delivery', 'Admin')
                ORDER BY u.CreatedAt DESC";
            return Ok(new { success = true, data = await c.QueryAsync(sql) });
        }

        public class CreateStaffRequest
        {
            [Required] public string FirstName { get; set; } = string.Empty;
            [Required] public string LastName { get; set; } = string.Empty;
            [Required, EmailAddress] public string Email { get; set; } = string.Empty;
            [Required] public string Password { get; set; } = string.Empty;
            [Required] public string Role { get; set; } = "Support";
        }

        [HttpPost]
        public async Task<IActionResult> CreateStaff([FromBody] CreateStaffRequest request)
        {
            if (request.Role != "Support" && request.Role != "Delivery" && request.Role != "Admin")
                return BadRequest(new { success = false, message = "Invalid role" });

            var existing = await _userRepository.GetByEmailAsync(request.Email);
            if (existing != null) return BadRequest(new { success = false, message = "Email already in use" });

            var user = new User
            {
                Id = Guid.NewGuid(),
                FirstName = request.FirstName,
                LastName = request.LastName,
                Email = request.Email,
                PasswordHash = _passwordHasher.HashPassword(request.Password),
                IsActive = true
            };

            await _userRepository.CreateUserAsync(user, request.Role);
            return Ok(new { success = true, message = "Staff member created successfully" });
        }
    }
}
