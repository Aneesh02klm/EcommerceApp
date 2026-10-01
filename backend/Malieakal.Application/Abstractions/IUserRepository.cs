using Malieakal.Domain.Entities;
using System.Threading.Tasks;

namespace Malieakal.Application.Abstractions
{
    public interface IUserRepository
    {
        Task<User?> GetByIdAsync(System.Guid id);
        Task<User?> GetByEmailAsync(string email);
        Task CreateUserAsync(User user, string roleName);
        Task UpdateUserAsync(User user);
    }
}
