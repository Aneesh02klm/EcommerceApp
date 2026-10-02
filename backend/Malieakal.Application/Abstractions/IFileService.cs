using System.IO;
using System.Threading.Tasks;

namespace Malieakal.Application.Abstractions
{
    public interface IFileService
    {
        Task<string> UploadAsync(Stream fileStream, string fileName, string subFolder);
        void DeleteFile(string relativePath);
        Task<string> ReplaceFileAsync(Stream newFileStream, string fileName, string oldRelativePath, string subFolder);
    }
}
