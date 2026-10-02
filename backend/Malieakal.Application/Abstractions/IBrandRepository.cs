using Malieakal.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Malieakal.Application.Abstractions
{
    public interface IBrandRepository
    {
        Task<IEnumerable<Brand>> GetAllAsync();
        Task<Brand?> GetByIdAsync(int id);
        Task<int> CreateAsync(Brand brand);
        Task UpdateAsync(Brand brand);
        Task DeleteAsync(int id);
    }
}
