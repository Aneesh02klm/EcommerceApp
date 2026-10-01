using System;
using System.Collections.Generic;

namespace Malieakal.Application.Models
{
    public class AccountDashboardDto
    {
        public UserProfileDto User { get; set; } = new();
        public AccountStatsDto Stats { get; set; } = new();
        public List<RecentOrderDto> RecentOrders { get; set; } = new();
    }

    public class UserProfileDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Phone { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string? MemberTier { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AccountStatsDto
    {
        public int ActiveWarranties { get; set; }
        public int UnusedCoupons { get; set; }
        public int OpenComplaints { get; set; }
    }

    public class RecentOrderDto
    {
        public string OrderNumber { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public decimal TotalAmount { get; set; }
        public string Status { get; set; } = string.Empty;
    }
}
