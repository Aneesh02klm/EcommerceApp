using Malieakal.Domain.Entities;
using System;
using System.Threading.Tasks;

namespace Malieakal.Application.Abstractions
{
    public interface ICartRepository
    {
        Task<Cart?> GetCartByUserIdAsync(Guid userId);
        Task CreateCartAsync(Cart cart);
        Task AddItemAsync(Guid cartId, Guid productId, int quantity, int? variantId = null);
        Task UpdateItemQuantityAsync(Guid cartId, Guid productId, int quantity);
        Task RemoveItemAsync(Guid cartId, Guid productId);
        Task ClearCartAsync(Guid cartId);
    }
}
