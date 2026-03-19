export const CATEGORY_KEYS = ["technical", "project", "behavioral", "fit"] as const;

export type CategoryKey = (typeof CATEGORY_KEYS)[number];

export interface AnalysisQuestion {
  id: string;
  question: string;
  answerMarkdown: string;
  exampleAnswer: string;
}

export interface AnalysisCategory {
  key: CategoryKey;
  label: string;
  items: AnalysisQuestion[];
}

export interface AnalysisResult {
  company: string | null;
  role: string | null;
  categories: AnalysisCategory[];
}

export interface AnalysisSummary {
  id: string;
  title: string;
  model: string;
  questionCount: number;
  createdAt: number;
}

export interface AnalysisRecord extends AnalysisSummary {
  jobText: string;
  resumeText: string;
  warnings: string[];
  result: AnalysisResult;
  updatedAt: number;
}

export interface ParsedDocumentResponse {
  filename: string;
  sourceType: "pdf" | "docx" | "text" | "markdown";
  text: string;
  warnings: string[];
}

export interface CreateAnalysisRequest {
  model: string;
  questionCount: 30 | 40 | 50;
  jobText: string;
  resumeText: string;
}

export interface CreateAnalysisResponse {
  analysisId: string;
  result: AnalysisResult;
  analysis: AnalysisRecord;
}

export interface AppSettings {
  apiKey: string;
  apiBaseUrl: string;
  defaultModel: string;
  resumeText: string;
  updatedAt: number | null;
}
