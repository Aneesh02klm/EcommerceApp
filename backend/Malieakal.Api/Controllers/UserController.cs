using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace Malieakal.Api.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize]
    public class UserController : ControllerBase
    {
        private readonly IUserRepository _userRepository;
        private readonly IOrderRepository _orderRepository;

        public UserController(IUserRepository userRepository, IOrderRepository orderRepository)
        {
            _userRepository = userRepository;
            _orderRepository = orderRepository;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            var userId = GetUserId();
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null) return NotFound();

            return Ok(new
            {
                success = true,
                data = new { user.Id, user.FirstName, user.LastName, user.Email, user.Phone, user.CreatedAt }
            });
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileRequest request)
        {
            var userId = GetUserId();
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null) return NotFound();

            user.FirstName = request.FirstName;
            user.LastName = request.LastName;
            user.Phone = request.Phone;
            user.UpdatedAt = DateTime.UtcNow;

            await _userRepository.UpdateUserAsync(user);

            return Ok(new { success = true, message = "Profile updated." });
        }

        [HttpGet("orders")]
        public async Task<IActionResult> GetOrders()
        {
            var userId = GetUserId();
            var orders = await _orderRepository.GetOrdersByUserIdAsync(userId);
            return Ok(new { success = true, data = orders });
        }

        [HttpGet("addresses")]
        public async Task<IActionResult> GetAddresses()
        {
            var userId = GetUserId();
            var addresses = await _orderRepository.GetAddressesByUserIdAsync(userId);
            return Ok(new { success = true, data = addresses });
        }

        [HttpPost("addresses")]
        public async Task<IActionResult> AddAddress([FromBody] Address request)
        {
            var userId = GetUserId();
            request.UserId = userId;
            var addressId = await _orderRepository.CreateAddressAsync(request);
            request.Id = addressId;
            return Ok(new { success = true, data = request });
        }
    }

    public class UpdateProfileRequest
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? Phone { get; set; }
    }
}
