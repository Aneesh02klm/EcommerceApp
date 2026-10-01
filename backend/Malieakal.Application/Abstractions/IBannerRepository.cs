using Malieakal.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Malieakal.Application.Abstractions
{
    public interface IBannerRepository
    {
        Task<IEnumerable<Banner>> GetAllAsync();
        Task<Banner?> GetByIdAsync(int id);
        Task<int> CreateAsync(Banner banner);
        Task UpdateAsync(Banner banner);
        Task DeleteAsync(int id);
        Task<IEnumerable<Banner>> GetActiveBannersAsync(string? categorySlug, string? brandSlug);
    }
}
