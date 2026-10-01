using Malieakal.Application.Abstractions;
using Microsoft.Extensions.Configuration;
using System;
using System.IO;
using System.Threading;
using System.Threading.Tasks;

namespace Malieakal.Infrastructure.Storage
{
    public class FileStorageService : IFileStorageService
    {
        private readonly string _rootPath;

        public FileStorageService(IConfiguration configuration)
        {
            _rootPath = configuration["FileStorage:RootPath"] ?? "wwwroot/uploads";
        }

        public async Task<string> SaveFileAsync(Stream fileStream, string fileName, string category, CancellationToken cancellationToken = default)
        {
            var folderPath = Path.Combine(_rootPath, category);
            if (!Directory.Exists(folderPath))
            {
                Directory.CreateDirectory(folderPath);
            }

            var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(fileName)}";
            var filePath = Path.Combine(folderPath, uniqueFileName);

            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await fileStream.CopyToAsync(stream, cancellationToken);
            }

            return uniqueFileName;
        }

        public Task DeleteFileAsync(string fileName, string category, CancellationToken cancellationToken = default)
        {
            var filePath = Path.Combine(_rootPath, category, fileName);
            if (File.Exists(filePath))
            {
                File.Delete(filePath);
            }
            return Task.CompletedTask;
        }

        public string GetFileUrl(string fileName, string category)
        {
            // Assume the public URL aligns with the wwwroot setup
            // Usually this requires knowing the base URL, but returning relative URL is safer
            return $"/uploads/{category}/{fileName}";
        }
    }
}
