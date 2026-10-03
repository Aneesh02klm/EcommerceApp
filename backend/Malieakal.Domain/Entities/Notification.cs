using System;

namespace Malieakal.Domain.Entities
{
    public class Notification
    {
        public int Id { get; set; }
        public Guid? UserId { get; set; }
        public string Role { get; set; } = "Customer";
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public string? LinkUrl { get; set; }
        public bool IsRead { get; set; }
        public bool IsCleared { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
