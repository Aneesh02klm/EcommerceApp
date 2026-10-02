using System.Collections.Generic;
using System.Threading.Tasks;
using Malieakal.Domain.Entities;

namespace Malieakal.Application.Abstractions
{
    public interface ICouponRepository
    {
        Task<Coupon?> GetByCodeAsync(string code, System.Guid? userId = null);
        Task<IEnumerable<Coupon>> GetActiveCouponsAsync();
    }
}
