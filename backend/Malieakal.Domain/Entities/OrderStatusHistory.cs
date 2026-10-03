using System;

namespace Malieakal.Domain.Entities
{
    public class OrderStatusHistory
    {
        public int Id { get; set; }
        public Guid OrderId { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Comments { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
