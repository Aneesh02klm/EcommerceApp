using System;
using System.Linq;
using System.Threading.Tasks;
using Dapper;
using Malieakal.Application.Abstractions;
using Malieakal.Application.Models;
using Malieakal.Infrastructure.Data;

namespace Malieakal.Infrastructure.Repositories
{
    public class AccountRepository : IAccountRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public AccountRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<AccountDashboardDto> GetDashboardAsync(Guid userId)
        {
            using var connection = _connectionFactory.CreateConnection();

            var userSql = @"
                SELECT FirstName, LastName, Email, Phone, AvatarUrl, MemberTier, CreatedAt 
                FROM Users 
                WHERE Id = @UserId";
            var user = await connection.QuerySingleOrDefaultAsync<UserProfileDto>(userSql, new { UserId = userId });

            if (user == null) return null;

            var statsSql = @"
                SELECT 
                    (SELECT COUNT(*) FROM Orders WHERE UserId = @UserId) AS TotalOrders,
                    (SELECT COUNT(*) FROM UserWarranties WHERE UserId = @UserId AND Status = 'Active') AS ActiveWarranties,
                    (SELECT COUNT(*) FROM UserCoupons WHERE UserId = @UserId AND Status = 'Available') AS UnusedCoupons,
                    (SELECT COUNT(*) FROM UserComplaints WHERE UserId = @UserId AND Status = 'Open') AS OpenComplaints";
            
            var stats = await connection.QuerySingleAsync<AccountStatsDto>(statsSql, new { UserId = userId });

            var ordersSql = @"
                SELECT Id, OrderNumber, CreatedAt, TotalAmount, Status 
                FROM Orders 
                WHERE UserId = @UserId 
                ORDER BY CreatedAt DESC 
                LIMIT 3";
            var recentOrders = (await connection.QueryAsync<RecentOrderDto>(ordersSql, new { UserId = userId })).ToList();

            return new AccountDashboardDto
            {
                User = user,
                Stats = stats,
                RecentOrders = recentOrders
            };
        }

        public async Task<object> GetAddressesAsync(Guid userId)
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync("SELECT * FROM Addresses WHERE UserId = @UserId ORDER BY IsDefault DESC", new { UserId = userId });
        }

        public async Task<object> GetCouponsAsync(Guid userId)
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync("SELECT * FROM UserCoupons WHERE UserId = @UserId ORDER BY ExpiryDate DESC", new { UserId = userId });
        }

        public async Task<object> GetRewardsAsync(Guid userId)
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync("SELECT * FROM UserRewards WHERE UserId = @UserId ORDER BY CreatedAt DESC", new { UserId = userId });
        }

        public async Task<object> GetWarrantiesAsync(Guid userId)
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync(@"
                SELECT w.*, p.Name as ProductName 
                FROM UserWarranties w
                JOIN Products p ON p.Id = w.ProductId
                WHERE w.UserId = @UserId 
                ORDER BY w.ExpiryDate DESC", new { UserId = userId });
        }

        public async Task<object> GetComplaintsAsync(Guid userId)
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync("SELECT * FROM UserComplaints WHERE UserId = @UserId ORDER BY CreatedAt DESC", new { UserId = userId });
        }

        public async Task<object> GetNotificationsAsync(Guid userId)
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync("SELECT * FROM UserNotifications WHERE UserId = @UserId ORDER BY CreatedAt DESC", new { UserId = userId });
        }

        public async Task<object> GetSettingsAsync(Guid userId)
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QuerySingleOrDefaultAsync("SELECT * FROM UserSettings WHERE UserId = @UserId", new { UserId = userId });
        }

        public async Task<object> GetPaymentMethodsAsync(Guid userId)
        {
            using var connection = _connectionFactory.CreateConnection();
            return await connection.QueryAsync("SELECT * FROM SavedPaymentMethods WHERE UserId = @UserId ORDER BY IsDefault DESC", new { UserId = userId });
        }
    }
}
