using Dapper;
using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Malieakal.Infrastructure.Repositories
{
    public class NotificationRepository : INotificationRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public NotificationRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task AddNotificationAsync(Notification notification)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                INSERT INTO Notifications (UserId, Role, Title, Message, LinkUrl) 
                VALUES (@UserId, @Role, @Title, @Message, @LinkUrl)";
            await connection.ExecuteAsync(sql, notification);
        }

        public async Task ClearAllAsync(Guid? userId, string role)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                UPDATE Notifications 
                SET IsCleared = true 
                WHERE Role = @Role AND (UserId = @UserId OR (UserId IS NULL AND @UserId IS NULL))";
            await connection.ExecuteAsync(sql, new { UserId = userId, Role = role });
        }

        public async Task ClearNotificationAsync(int id)
        {
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync("UPDATE Notifications SET IsCleared = true WHERE Id = @Id", new { Id = id });
        }

        public async Task<IEnumerable<Notification>> GetUserNotificationsAsync(Guid? userId, string role)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                SELECT * FROM Notifications 
                WHERE IsCleared = false 
                AND Role = @Role AND (UserId = @UserId OR (UserId IS NULL AND @UserId IS NULL)) 
                ORDER BY CreatedAt DESC LIMIT 20";
            return await connection.QueryAsync<Notification>(sql, new { UserId = userId, Role = role });
        }

        public async Task MarkAsReadAsync(int id)
        {
            using var connection = _connectionFactory.CreateConnection();
            await connection.ExecuteAsync("UPDATE Notifications SET IsRead = true WHERE Id = @Id", new { Id = id });
        }
    }
}
