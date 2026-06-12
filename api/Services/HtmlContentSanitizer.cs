using System.Text.RegularExpressions;
using PortfolioApi.Models;

namespace PortfolioApi.Services;

public class HtmlContentSanitizer
{
  private static readonly Regex DangerousElementRegex = new(
    @"<\s*(script|style|iframe|object|embed)\b[^>]*>.*?<\s*/\s*\1\s*>",
    RegexOptions.IgnoreCase | RegexOptions.Singleline | RegexOptions.Compiled);

  private static readonly Regex EventHandlerRegex = new(
    @"\s+on[a-z]+\s*=\s*(""[^""]*""|'[^']*'|[^\s>]+)",
    RegexOptions.IgnoreCase | RegexOptions.Compiled);

  private static readonly Regex JavaScriptUrlRegex = new(
    @"javascript\s*:",
    RegexOptions.IgnoreCase | RegexOptions.Compiled);

  public string Sanitize(string html)
  {
    var withoutDangerousElements = DangerousElementRegex.Replace(html, string.Empty);
    var withoutEventHandlers = EventHandlerRegex.Replace(withoutDangerousElements, string.Empty);
    return JavaScriptUrlRegex.Replace(withoutEventHandlers, string.Empty).Trim();
  }

  public Project Sanitize(Project project)
  {
    project.Description = Sanitize(project.Description);
    return project;
  }

  public Home Sanitize(Home home)
  {
    home.Content = Sanitize(home.Content);
    return home;
  }

  public WorkRecognition Sanitize(WorkRecognition recognition)
  {
    if (recognition.Companies is null)
    {
      return recognition;
    }

    foreach (var company in recognition.Companies)
    {
      if (company.Recognitions is null)
      {
        continue;
      }

      foreach (var item in company.Recognitions)
      {
        if (!string.IsNullOrWhiteSpace(item.Description))
        {
          item.Description = Sanitize(item.Description);
        }
      }
    }

    return recognition;
  }
}
