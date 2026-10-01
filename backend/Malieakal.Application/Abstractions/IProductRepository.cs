using Malieakal.Application.Models;
using Malieakal.Domain.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Malieakal.Application.Abstractions
{
    public interface IProductRepository
    {
        Task<IEnumerable<Product>> GetAllAsync();
        Task<Product?> GetByIdAsync(Guid id);
        Task<Product?> GetBySlugAsync(string slug);
        Task CreateAsync(Product product);
        Task UpdateAsync(Product product);
        Task UpdateStockAsync(Guid productId, int quantityDelta);
        Task<IEnumerable<Product>> SearchAsync(ProductSearchQuery query);
    }
}
