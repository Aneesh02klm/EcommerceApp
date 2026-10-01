using System.Collections.Generic;
using System.Threading.Tasks;
using Malieakal.Domain.Entities;

namespace Malieakal.Application.Abstractions
{
    public interface ICouponRepository
    {
        Task<Coupon?> GetByCodeAsync(string code);
        Task<IEnumerable<Coupon>> GetActiveCouponsAsync();
    }
}
