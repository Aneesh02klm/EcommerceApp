using Malieakal.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Malieakal.Application.Abstractions
{
    public interface IWishlistRepository
    {
        Task<IEnumerable<WishlistItem>> GetWishlistByUserIdAsync(Guid userId);
        Task AddToWishlistAsync(Guid userId, Guid productId);
        Task RemoveFromWishlistAsync(Guid userId, Guid productId);
    }
}
