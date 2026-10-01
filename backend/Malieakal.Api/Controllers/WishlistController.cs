using Malieakal.Application.Abstractions;
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
    public class WishlistController : ControllerBase
    {
        private readonly IWishlistRepository _wishlistRepository;

        public WishlistController(IWishlistRepository wishlistRepository)
        {
            _wishlistRepository = wishlistRepository;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet]
        public async Task<IActionResult> GetWishlist()
        {
            var userId = GetUserId();
            var items = await _wishlistRepository.GetWishlistByUserIdAsync(userId);
            return Ok(new { success = true, data = items });
        }

        [HttpPost("{productId}")]
        public async Task<IActionResult> AddToWishlist(Guid productId)
        {
            var userId = GetUserId();
            await _wishlistRepository.AddToWishlistAsync(userId, productId);
            return Ok(new { success = true, message = "Added to wishlist." });
        }

        [HttpDelete("{productId}")]
        public async Task<IActionResult> RemoveFromWishlist(Guid productId)
        {
            var userId = GetUserId();
            await _wishlistRepository.RemoveFromWishlistAsync(userId, productId);
            return Ok(new { success = true, message = "Removed from wishlist." });
        }
    }
}
