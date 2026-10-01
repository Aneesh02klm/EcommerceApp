using Dapper;
using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Malieakal.Infrastructure.Repositories
{
    public class WishlistRepository : IWishlistRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public WishlistRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<IEnumerable<WishlistItem>> GetWishlistByUserIdAsync(Guid userId)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                SELECT w.*, p.* 
                FROM Wishlists w
                INNER JOIN Products p ON w.ProductId = p.Id
                WHERE w.UserId = @UserId
                ORDER BY w.AddedAt DESC";

            return await connection.QueryAsync<WishlistItem, Product, WishlistItem>(
                sql,
                (wishlistItem, product) =>
                {
                    wishlistItem.Product = product;
                    return wishlistItem;
                },
                new { UserId = userId },
                splitOn: "Id"
            );
        }

        public async Task AddToWishlistAsync(Guid userId, Guid productId)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = "INSERT INTO Wishlists (UserId, ProductId) VALUES (@UserId, @ProductId) ON CONFLICT DO NOTHING";
            await connection.ExecuteAsync(sql, new { UserId = userId, ProductId = productId });
        }

        public async Task RemoveFromWishlistAsync(Guid userId, Guid productId)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = "DELETE FROM Wishlists WHERE UserId = @UserId AND ProductId = @ProductId";
            await connection.ExecuteAsync(sql, new { UserId = userId, ProductId = productId });
        }
    }
}
