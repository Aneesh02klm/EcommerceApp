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
    public class CartController : ControllerBase
    {
        private readonly ICartRepository _cartRepository;

        public CartController(ICartRepository cartRepository)
        {
            _cartRepository = cartRepository;
        }

        private Guid GetUserId() => Guid.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        [HttpGet]
        public async Task<IActionResult> GetCart()
        {
            var userId = GetUserId();
            var cart = await _cartRepository.GetCartByUserIdAsync(userId);

            if (cart == null)
            {
                cart = new Cart { Id = Guid.NewGuid(), UserId = userId };
                await _cartRepository.CreateCartAsync(cart);
            }

            return Ok(new { success = true, data = cart });
        }

        [HttpPost("items")]
        public async Task<IActionResult> AddItem([FromBody] AddCartItemRequest request)
        {
            var userId = GetUserId();
            var cart = await _cartRepository.GetCartByUserIdAsync(userId);
            
            if (cart == null)
            {
                cart = new Cart { Id = Guid.NewGuid(), UserId = userId };
                await _cartRepository.CreateCartAsync(cart);
            }

            await _cartRepository.AddItemAsync(cart.Id, request.ProductId, request.Quantity, request.VariantId);
            
            // Re-fetch to get updated totals
            cart = await _cartRepository.GetCartByUserIdAsync(userId);
            return Ok(new { success = true, data = cart });
        }

        [HttpPut("items/{productId}")]
        public async Task<IActionResult> UpdateItemQuantity(Guid productId, [FromBody] UpdateCartItemRequest request)
        {
            var userId = GetUserId();
            var cart = await _cartRepository.GetCartByUserIdAsync(userId);
            if (cart == null) return NotFound(new { success = false, message = "Cart not found." });

            if (request.Quantity <= 0)
            {
                await _cartRepository.RemoveItemAsync(cart.Id, productId);
            }
            else
            {
                await _cartRepository.UpdateItemQuantityAsync(cart.Id, productId, request.Quantity);
            }

            cart = await _cartRepository.GetCartByUserIdAsync(userId);
            return Ok(new { success = true, data = cart });
        }

        [HttpDelete("items/{productId}")]
        public async Task<IActionResult> RemoveItem(Guid productId)
        {
            var userId = GetUserId();
            var cart = await _cartRepository.GetCartByUserIdAsync(userId);
            if (cart == null) return NotFound();

            await _cartRepository.RemoveItemAsync(cart.Id, productId);
            
            cart = await _cartRepository.GetCartByUserIdAsync(userId);
            return Ok(new { success = true, data = cart });
        }

        [HttpDelete]
        public async Task<IActionResult> ClearCart()
        {
            var userId = GetUserId();
            var cart = await _cartRepository.GetCartByUserIdAsync(userId);
            if (cart == null) return NotFound();

            await _cartRepository.ClearCartAsync(cart.Id);
            return Ok(new { success = true, message = "Cart cleared." });
        }
        [HttpPost("sync")]
        public async Task<IActionResult> SyncCart([FromBody] SyncCartRequest request)
        {
            var userId = GetUserId();
            var cart = await _cartRepository.GetCartByUserIdAsync(userId);
            
            if (cart == null)
            {
                cart = new Cart { Id = Guid.NewGuid(), UserId = userId };
                await _cartRepository.CreateCartAsync(cart);
            }
            else
            {
                await _cartRepository.ClearCartAsync(cart.Id);
            }

            foreach (var item in request.Items)
            {
                await _cartRepository.AddItemAsync(cart.Id, item.ProductId, item.Quantity, item.VariantId);
            }
            
            cart = await _cartRepository.GetCartByUserIdAsync(userId);
            return Ok(new { success = true, data = cart });
        }
    }

    public class SyncCartRequest
    {
        public List<AddCartItemRequest> Items { get; set; } = new();
    }

    public class AddCartItemRequest
    {
        public Guid ProductId { get; set; }
        public int? VariantId { get; set; }
        public int Quantity { get; set; } = 1;
    }

    public class UpdateCartItemRequest
    {
        public int Quantity { get; set; }
    }
}
