using System;
using System.Data;
using System.Threading.Tasks;
using Dapper;
using Npgsql;

class Program
{
    static async Task Main()
    {
        var connectionString = "Host=localhost;Port=5432;Database=ecommerce_db;Username=postgres;Password=123";
        using var connection = new NpgsqlConnection(connectionString);
        connection.Open();
        
        var cartId = Guid.NewGuid();
        var productId = Guid.Parse("66666666-0000-0000-0000-000000000005");
        
        // Insert dummy cart
        await connection.ExecuteAsync("INSERT INTO Users (Id, FirstName, LastName, Email, PasswordHash, Role) VALUES (@Id, 'T', 'T', 't@t.com', 'h', 'User') ON CONFLICT DO NOTHING", new { Id = Guid.Empty });
        await connection.ExecuteAsync("INSERT INTO Carts (Id, UserId) VALUES (@Id, @UserId) ON CONFLICT DO NOTHING", new { Id = cartId, UserId = Guid.Empty });

        try {
            var sql = @"
                INSERT INTO CartItems (CartId, ProductId, VariantId, Quantity) 
                VALUES (@CartId, @ProductId, @VariantId, @Quantity)
                ON CONFLICT (CartId, ProductId) 
                DO UPDATE SET Quantity = CartItems.Quantity + @Quantity;";
            await connection.ExecuteAsync(sql, new { CartId = cartId, ProductId = productId, VariantId = (int?)null, Quantity = 1 });
            Console.WriteLine("Success!");
        }
        catch (Exception ex)
        {
            Console.WriteLine(ex.ToString());
        }
    }
}
