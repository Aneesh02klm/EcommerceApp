using Malieakal.Domain.Entities;
using System.Collections.Generic;

namespace Malieakal.Application.Abstractions
{
    public interface IJwtService
    {
        string GenerateToken(User user, IEnumerable<Role> roles);
    }
}
