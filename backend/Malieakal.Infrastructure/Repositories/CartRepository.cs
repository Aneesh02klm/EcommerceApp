using Dapper;
using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace Malieakal.Infrastructure.Repositories
{
    public class CartRepository : ICartRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public CartRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<Cart?> GetCartByUserIdAsync(Guid userId)
        {
            using var connection = _connectionFactory.CreateConnection();
            var cartSql = "SELECT * FROM Carts WHERE UserId = @UserId";
            var cart = await connection.QuerySingleOrDefaultAsync<Cart>(cartSql, new { UserId = userId });

            if (cart != null)
            {
                var itemsSql = @"
                    SELECT ci.*, p.* 
                    FROM CartItems ci
                    INNER JOIN Products p ON ci.ProductId = p.Id
                    WHERE ci.CartId = @CartId";

                var items = await connection.QueryAsync<CartItem, Product, CartItem>(
                    itemsSql,
                    (cartItem, product) =>
                    {
                        cartItem.Product = product;
                        return cartItem;
                    },
                    new { CartId = cart.Id },
                    splitOn: "Id"
                );

                cart.Items = items.ToList();
            }

            return cart;
        }

        public async Task CreateCartAsync(Cart cart)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = "INSERT INTO Carts (Id, UserId) VALUES (@Id, @UserId)";
            await connection.ExecuteAsync(sql, new { cart.Id, cart.UserId });
        }

        public async Task AddItemAsync(Guid cartId, Guid productId, int quantity, int? variantId = null)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                INSERT INTO CartItems (CartId, ProductId, VariantId, Quantity) 
                VALUES (@CartId, @ProductId, @VariantId, @Quantity)
                ON CONFLICT (CartId, ProductId) 
                DO UPDATE SET Quantity = CartItems.Quantity + @Quantity;";
            await connection.ExecuteAsync(sql, new { CartId = cartId, ProductId = productId, VariantId = variantId, Quantity = quantity });
        }

        public async Task UpdateItemQuantityAsync(Guid cartId, Guid productId, int quantity)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = "UPDATE CartItems SET Quantity = @Quantity WHERE CartId = @CartId AND ProductId = @ProductId";
            await connection.ExecuteAsync(sql, new { CartId = cartId, ProductId = productId, Quantity = quantity });
        }

        public async Task RemoveItemAsync(Guid cartId, Guid productId)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = "DELETE FROM CartItems WHERE CartId = @CartId AND ProductId = @ProductId";
            await connection.ExecuteAsync(sql, new { CartId = cartId, ProductId = productId });
        }

        public async Task ClearCartAsync(Guid cartId)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = "DELETE FROM CartItems WHERE CartId = @CartId";
            await connection.ExecuteAsync(sql, new { CartId = cartId });
        }
    }
}
