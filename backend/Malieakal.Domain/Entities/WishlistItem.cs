using System;

namespace Malieakal.Domain.Entities
{
    public class WishlistItem
    {
        public Guid UserId { get; set; }
        public Guid ProductId { get; set; }
        public DateTime AddedAt { get; set; }

        public Product? Product { get; set; }
    }
}
