import "server-only";

interface TavilySearchResult {
  title?: string;
  url?: string;
  content?: string;
}

interface TavilySearchResponse {
  answer?: string;
  results?: TavilySearchResult[];
}

function buildCompanyQuery(companyText: string, jobText: string) {
  const companyHint = companyText.trim() || jobText.split("\n").find((line) => line.trim())?.trim() || "";
  return `${companyHint} 公司简介 业务 产品 团队 招聘 技术`;
}

function normalizeSnippet(value: string, limit = 240) {
  return value.replace(/\s+/g, " ").trim().slice(0, limit);
}

export async function researchCompanyBackground(input: {
  tavilyApiKey?: string;
  companyText: string;
  jobText: string;
}) {
  if (!input.tavilyApiKey?.trim() || !input.companyText.trim()) {
    return "";
  }

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.tavilyApiKey.trim()}`,
    },
    body: JSON.stringify({
      query: buildCompanyQuery(input.companyText, input.jobText),
      topic: "general",
      search_depth: "basic",
      include_answer: true,
      max_results: 5,
    }),
  });

  if (!response.ok) {
    throw new Error(`Tavily search failed with status ${response.status}`);
  }

  const payload = (await response.json()) as TavilySearchResponse;
  const sections: string[] = [];

  if (payload.answer?.trim()) {
    sections.push("概览摘要：", normalizeSnippet(payload.answer, 400));
  }

  const resultLines = (payload.results || [])
    .filter((item) => item.title?.trim() || item.content?.trim())
    .slice(0, 4)
    .map((item, index) => {
      const title = item.title?.trim() || `结果 ${index + 1}`;
      const snippet = normalizeSnippet(item.content || "");
      const url = item.url?.trim() ? ` (${item.url.trim()})` : "";
      return `${index + 1}. ${title}${url}${snippet ? `：${snippet}` : ""}`;
    });

  if (resultLines.length > 0) {
    sections.push("搜索结果：", ...resultLines);
  }

  return sections.join("\n");
}
