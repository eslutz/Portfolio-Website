using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using PortfolioApi.Models;

namespace PortfolioApi.Services;

public class MediaStorageService
{
  private const long MaxUploadBytes = 50 * 1024 * 1024;
  private static readonly Dictionary<string, string[]> AllowedExtensionsByContentType = new(StringComparer.OrdinalIgnoreCase)
  {
    ["image/png"] = [".png"],
    ["image/jpeg"] = [".jpg", ".jpeg"],
    ["image/webp"] = [".webp"],
    ["image/gif"] = [".gif"],
    ["video/mp4"] = [".mp4"],
  };

  private readonly string? _connectionString;
  private readonly string? _containerName;
  private readonly string? _mediaBaseUrl;

  public MediaStorageService(IConfiguration configuration)
  {
    _connectionString = configuration["BLOB_STORAGE_CONNECTION_STRING"];
    _containerName = configuration["BLOB_CONTAINER"];
    _mediaBaseUrl = configuration["MEDIA_BASE_URL"];
  }

  public async Task<MediaUploadResult> UploadAsync(
    IFormFile file,
    string? category,
    CancellationToken cancellationToken)
  {
    if (string.IsNullOrWhiteSpace(_connectionString) || string.IsNullOrWhiteSpace(_containerName))
    {
      throw new InvalidOperationException("Blob storage is not configured");
    }

    ValidateFile(file);

    var safeCategory = NormalizeCategory(category);
    var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
    var blobName = $"{safeCategory}/{DateTimeOffset.UtcNow:yyyy}/{Guid.NewGuid():N}{extension}";
    var container = new BlobContainerClient(_connectionString, _containerName);
    await container.CreateIfNotExistsAsync(PublicAccessType.Blob, cancellationToken: cancellationToken);

    var blob = container.GetBlobClient(blobName);
    await using var stream = file.OpenReadStream();
    await blob.UploadAsync(
      stream,
      new BlobUploadOptions
      {
        HttpHeaders = new BlobHttpHeaders
        {
          ContentType = file.ContentType,
          CacheControl = "public, max-age=31536000, immutable",
        },
      },
      cancellationToken);

    var url = string.IsNullOrWhiteSpace(_mediaBaseUrl)
      ? blob.Uri.ToString()
      : $"{_mediaBaseUrl.TrimEnd('/')}/{blobName}";

    return new MediaUploadResult
    {
      Url = url,
      BlobName = blobName,
      ContentType = file.ContentType,
      Size = file.Length,
    };
  }

  private static void ValidateFile(IFormFile file)
  {
    if (file.Length == 0)
    {
      throw new InvalidOperationException("Upload file is empty");
    }

    if (file.Length > MaxUploadBytes)
    {
      throw new InvalidOperationException("Upload file exceeds 50 MB");
    }

    if (!AllowedExtensionsByContentType.TryGetValue(file.ContentType, out var allowedExtensions))
    {
      throw new InvalidOperationException("Unsupported media content type");
    }

    var extension = Path.GetExtension(file.FileName);
    if (!allowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
    {
      throw new InvalidOperationException("Media extension does not match content type");
    }
  }

  private static string NormalizeCategory(string? category)
  {
    return category?.Trim().ToLowerInvariant() switch
    {
      "recognition" => "recognition",
      _ => "projects",
    };
  }
}
