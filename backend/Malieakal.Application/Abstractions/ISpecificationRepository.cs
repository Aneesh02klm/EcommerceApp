using Malieakal.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Malieakal.Application.Abstractions
{
    public interface ISpecificationRepository
    {
        Task<IEnumerable<SpecificationDefinition>> GetByCategoryIdAsync(int categoryId);
        Task<SpecificationDefinition?> GetByIdAsync(int id);
        Task<int> CreateAsync(SpecificationDefinition specification);
        Task UpdateAsync(SpecificationDefinition specification);
        Task DeleteAsync(int id);
    }
}
