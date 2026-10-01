using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace Malieakal.Application.Abstractions
{
    public interface IFileStorageService
    {
        Task<string> SaveFileAsync(Stream fileStream, string fileName, string category, CancellationToken cancellationToken = default);
        Task DeleteFileAsync(string fileName, string category, CancellationToken cancellationToken = default);
        string GetFileUrl(string fileName, string category);
    }
}
