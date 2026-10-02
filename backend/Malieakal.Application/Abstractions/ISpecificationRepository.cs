using Malieakal.Domain.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Malieakal.Application.Abstractions
{
    public interface ISpecificationRepository
    {
        Task<IEnumerable<SpecificationDefinition>> GetByCategoryIdAsync(int categoryId);
        Task<SpecificationDefinition?> GetByIdAsync(int id);
        Task<IEnumerable<SpecificationDefinition>> GetAllAsync();
        Task<IEnumerable<SpecificationGroup>> GetGroupsAsync();
        Task<int> CreateGroupAsync(SpecificationGroup group);
        Task UpdateGroupAsync(SpecificationGroup group);
        Task DeleteGroupAsync(int id);
        Task<bool> IsGroupInUseAsync(int id);
        Task<int> CreateAsync(SpecificationDefinition specification);
        Task UpdateAsync(SpecificationDefinition specification);
        Task DeleteAsync(int id);
    }
}
