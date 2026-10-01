using Dapper;
using Malieakal.Application.Abstractions;
using Malieakal.Domain.Entities;
using System.Linq;
using System.Threading.Tasks;

namespace Malieakal.Infrastructure.Repositories
{
    public class UserRepository : IUserRepository
    {
        private readonly IDbConnectionFactory _connectionFactory;

        public UserRepository(IDbConnectionFactory connectionFactory)
        {
            _connectionFactory = connectionFactory;
        }

        public async Task<User?> GetByIdAsync(System.Guid id)
        {
            using var connection = _connectionFactory.CreateConnection();
            var userSql = "SELECT * FROM Users WHERE Id = @Id";
            var user = await connection.QuerySingleOrDefaultAsync<User>(userSql, new { Id = id });
            
            if (user != null)
            {
                var rolesSql = @"
                    SELECT r.* FROM Roles r
                    INNER JOIN UserRoles ur ON r.Id = ur.RoleId
                    WHERE ur.UserId = @UserId";
                var roles = await connection.QueryAsync<Role>(rolesSql, new { UserId = user.Id });
                user.Roles = roles.ToList();
            }

            return user;
        }

        public async Task<User?> GetByEmailAsync(string email)
        {
            using var connection = _connectionFactory.CreateConnection();
            
            var userSql = "SELECT * FROM Users WHERE Email = @Email";
            var user = await connection.QuerySingleOrDefaultAsync<User>(userSql, new { Email = email });
            
            if (user != null)
            {
                var rolesSql = @"
                    SELECT r.* FROM Roles r
                    INNER JOIN UserRoles ur ON r.Id = ur.RoleId
                    WHERE ur.UserId = @UserId";
                var roles = await connection.QueryAsync<Role>(rolesSql, new { UserId = user.Id });
                user.Roles = roles.ToList();
            }

            return user;
        }

        public async Task CreateUserAsync(User user, string roleName)
        {
            using var connection = _connectionFactory.CreateConnection();
            connection.Open();
            using var transaction = connection.BeginTransaction();

            try
            {
                var insertUserSql = @"
                    INSERT INTO Users (Id, FirstName, LastName, Email, PasswordHash, Phone, IsActive, CreatedAt, UpdatedAt)
                    VALUES (@Id, @FirstName, @LastName, @Email, @PasswordHash, @Phone, @IsActive, @CreatedAt, @UpdatedAt)";
                
                await connection.ExecuteAsync(insertUserSql, user, transaction);

                var roleIdSql = "SELECT Id FROM Roles WHERE Name = @RoleName";
                var roleId = await connection.QuerySingleOrDefaultAsync<int?>(roleIdSql, new { RoleName = roleName }, transaction);

                if (roleId.HasValue)
                {
                    var insertUserRoleSql = "INSERT INTO UserRoles (UserId, RoleId) VALUES (@UserId, @RoleId)";
                    await connection.ExecuteAsync(insertUserRoleSql, new { UserId = user.Id, RoleId = roleId.Value }, transaction);
                }

                transaction.Commit();
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task UpdateUserAsync(User user)
        {
            using var connection = _connectionFactory.CreateConnection();
            var sql = @"
                UPDATE Users 
                SET FirstName = @FirstName, LastName = @LastName, Phone = @Phone, PasswordHash = @PasswordHash, UpdatedAt = @UpdatedAt
                WHERE Id = @Id";
            await connection.ExecuteAsync(sql, user);
        }
    }
}
