import "server-only";

import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import { z } from "zod";

import {
  CATEGORY_LABELS,
  MAX_COMBINED_TEXT_LENGTH,
  MAX_SINGLE_TEXT_LENGTH,
  QUESTION_QUOTAS,
} from "@/lib/constants";
import { AppError } from "@/lib/errors";
import { CATEGORY_KEYS, type AnalysisResult, type CategoryKey } from "@/lib/types";
import { mergeUniqueStrings, normalizeMultilineText } from "@/lib/utils";

const questionCountSchema = z.union([z.literal(30), z.literal(40), z.literal(50)]);

export const analysisRequestSchema = z
  .object({
    model: z.string().trim().min(1).max(120),
    questionCount: questionCountSchema,
    companyText: z.string().trim().max(MAX_SINGLE_TEXT_LENGTH).default(""),
    jobText: z.string().trim().min(60, "招聘信息至少提供 60 个字符。").max(MAX_SINGLE_TEXT_LENGTH),
    resumeText: z.string().trim().min(60, "简历内容至少提供 60 个字符。").max(MAX_SINGLE_TEXT_LENGTH),
  })
  .superRefine((value, ctx) => {
    if (value.companyText.length + value.jobText.length + value.resumeText.length > MAX_COMBINED_TEXT_LENGTH) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `企业信息、招聘信息与简历总长度不能超过 ${MAX_COMBINED_TEXT_LENGTH} 个字符，请先裁剪材料。`,
        path: ["companyText"],
      });
    }
  });

const interviewProfileSchema = z.object({
  company: z.string().nullable(),
  role: z.string().nullable(),
  companyBusiness: z.array(z.string()).min(2).max(6),
  summary: z.string(),
  mustHaveSkills: z.array(z.string()).min(4).max(10),
  likelyResponsibilities: z.array(z.string()).min(4).max(10),
  resumeStrengths: z.array(z.string()).min(3).max(8),
  resumeGaps: z.array(z.string()).max(6),
  interviewFocus: z.array(z.string()).min(4).max(10),
});

const questionBankSchema = z.object({
  company: z.string().nullable(),
  role: z.string().nullable(),
  categories: z
    .array(
      z.object({
        key: z.enum(CATEGORY_KEYS),
        label: z.string(),
        items: z.array(
          z.object({
            question: z.string().min(12),
            answerMarkdown: z.string().min(28),
            exampleAnswer: z.string().min(40),
          }),
        ),
      }),
    )
    .length(4),
});

type InterviewProfile = z.infer<typeof interviewProfileSchema>;
type RawQuestionBank = z.infer<typeof questionBankSchema>;

function getOpenAIClient(apiKey: string, baseUrl?: string) {
  return new OpenAI({
    apiKey,
    baseURL: baseUrl || undefined,
  });
}

function formatMaterials(companyText: string, companyResearch: string, jobText: string, resumeText: string) {
  const sections = ["## 招聘信息", jobText];

  if (companyText.trim()) {
    sections.push("", "## 企业补充信息", companyText);
  }

  if (companyResearch.trim()) {
    sections.push("", "## 联网检索到的企业资料", companyResearch);
  }

  sections.push("", "## 用户简历", resumeText);

  return sections.join("\n");
}

function buildQuestionDistribution(questionCount: 30 | 40 | 50) {
  const quotas = QUESTION_QUOTAS[questionCount];

  return CATEGORY_KEYS.map((key) => `${CATEGORY_LABELS[key]}：${quotas[key]} 题`).join("；");
}

function buildProfilePrompt(companyText: string, companyResearch: string, jobText: string, resumeText: string) {
  return [
    "请基于下面的岗位资料、企业补充信息与简历，提炼出一份严谨的面试准备画像。",
    "要求：",
    "1. 只依据用户提供的内容，不要补造外部公司事实，也不要假装联网检索。",
    "2. 如果公司名或岗位名不明确，返回 null，不要猜测。",
    "3. 尽量总结企业是做什么的、业务方向是什么、团队更可能承担哪些工作；如果信息不足，要保守表达。",
    "4. likelyResponsibilities 要贴近候选人入职后可能承担的实际工作，不要只写抽象能力。",
    "5. 输出语言为中文。",
    "6. 数组内容应短句化，便于下一步生成题库。",
    "",
    formatMaterials(companyText, companyResearch, jobText, resumeText),
  ].join("\n");
}

function buildQuestionPrompt(
  profile: InterviewProfile,
  questionCount: 30 | 40 | 50,
  companyText: string,
  companyResearch: string,
  jobText: string,
  resumeText: string,
) {
  return [
    "基于下面的结构化画像和原始材料，生成一套面试学习题库。",
    `必须总共输出 ${questionCount} 道题，分类配额固定为：${buildQuestionDistribution(questionCount)}。`,
    "要求：",
    "1. 问题要像真实面试官会问的表述，不要写成学习纲要。",
    "2. 参考答案用 Markdown 分点，控制在 2-4 个要点，强调答题思路、可讲的证据和表达方式。每道题额外提供一段 exampleAnswer（回答示例），模拟候选人的真实口述回答，控制在 150-250 字。",
    "3. 如果用户材料中缺少某个具体经历，答案里明确提醒\"请替换为你的真实经历\"，不要虚构细节。",
    "4. 技术题聚焦技能栈、架构、排障、性能、工程化，但不要挤占岗位匹配题的空间。",
    "5. 项目题聚焦项目经历和取舍；行为题聚焦沟通协作与复盘；岗位匹配题必须优先围绕入职后可能承担的具体工作任务来出题，而不是泛泛问匹配度。",
    "6. 岗位匹配题要尽量落到实际工作内容，例如后台管理、表格渲染与编辑、复杂表单、权限控制、数据流转、接口联调、列表性能、搜索筛选、导入导出、图表看板、运营配置等真实业务模块。",
    "7. 如果从企业信息和 JD 能推断岗位主要是后台管理、企业网站、内容平台、运营系统或数据工具，就要让岗位匹配题明显贴近这些场景下的具体技术和业务问题，例如表格性能优化、复杂筛选、批量操作、权限模型、状态流转、可维护性和交互取舍。",
    "8. 如果企业补充信息里给了名称、地址、背景、产品或业务线，优先据此推断企业业务和岗位落点；如果信息有限，也要结合 JD 尽量推断入职后的工作重点，但表达要克制。",
    `9. 每个分类的 items 数组必须恰好包含对应配额数量的题目，一题都不能少，也不要超出配额。如果某个分类数量不够，先继续补足该分类，再考虑其他分类。`,
    "",
    "## 结构化岗位画像",
    JSON.stringify(profile, null, 2),
    "",
    formatMaterials(companyText, companyResearch, jobText, resumeText),
  ].join("\n");
}

function normalizeQuestionBank(raw: RawQuestionBank, questionCount: 30 | 40 | 50): { result: AnalysisResult; shortfall: string[] } {
  const quotas = QUESTION_QUOTAS[questionCount];
  const categoriesByKey = new Map<CategoryKey, RawQuestionBank["categories"][number]>();
  const shortfall: string[] = [];

  for (const category of raw.categories) {
    categoriesByKey.set(category.key, category);
  }

  const normalizedCategories = CATEGORY_KEYS.map((key) => {
    const category = categoriesByKey.get(key);

    if (!category) {
      throw new AppError(502, "INVALID_CATEGORY_SET", "模型返回的分类集合不完整，请重试。");
    }

    if (category.items.length < quotas[key]) {
      shortfall.push(`${CATEGORY_LABELS[key]} 仅返回 ${category.items.length} 题（配额 ${quotas[key]} 题），已使用现有结果。`);
    }

    const items = category.items.slice(0, quotas[key]).map((item, index) => ({
      id: `${key}-${index + 1}`,
      question: normalizeMultilineText(item.question).replace(/\n+/g, " "),
      answerMarkdown: normalizeMultilineText(item.answerMarkdown),
      exampleAnswer: normalizeMultilineText(item.exampleAnswer),
    }));

    return {
      key,
      label: CATEGORY_LABELS[key],
      items,
    };
  });

  return {
    result: {
      company: raw.company?.trim() || null,
      role: raw.role?.trim() || null,
      categories: normalizedCategories,
    },
    shortfall,
  };
}

function buildWarnings(profile: InterviewProfile, result: AnalysisResult) {
  const warnings: string[] = [];

  if (!result.company) {
    warnings.push("未能从岗位材料中稳定识别企业名称，岗位匹配题会更多依赖 JD 自身要求。");
  }

  if (!result.role) {
    warnings.push("未能从岗位材料中稳定识别岗位名称，建议补充更明确的岗位标题。");
  }

  if (profile.resumeGaps.length > 0) {
    warnings.push(`AI 识别到的简历薄弱点：${profile.resumeGaps.slice(0, 3).join("；")}。`);
  }

  return mergeUniqueStrings(warnings);
}

export function getQuestionPlan(questionCount: 30 | 40 | 50) {
  const quotas = QUESTION_QUOTAS[questionCount];

  return CATEGORY_KEYS.map((key) => ({
    key,
    label: CATEGORY_LABELS[key],
    count: quotas[key],
  }));
}

export async function generateInterviewAnalysis(input: {
  apiKey: string;
  baseUrl?: string;
  model: string;
  questionCount: 30 | 40 | 50;
  companyText: string;
  companyResearch?: string;
  jobText: string;
  resumeText: string;
}) {
  const client = getOpenAIClient(input.apiKey, input.baseUrl);

  const profileResponse = await client.responses.parse({
    model: input.model as never,
    store: false,
    instructions:
      "你是求职面试准备助手。你的任务是从岗位材料和简历中提炼可信的面试画像，并保持结论克制。",
    input: buildProfilePrompt(input.companyText, input.companyResearch || "", input.jobText, input.resumeText),
    text: {
      format: zodTextFormat(interviewProfileSchema, "interview_profile"),
    },
  });

  const profile = profileResponse.output_parsed;

  if (!profile) {
    throw new AppError(502, "EMPTY_PROFILE", "AI 没有返回可解析的岗位画像。");
  }

  const questionBankResponse = await client.responses.parse({
    model: input.model as never,
    store: false,
    instructions:
      "你是资深技术面试官和职业教练。请输出一份适合正式面试前学习的题库，语言精准，结构严格。",
    input: buildQuestionPrompt(profile, input.questionCount, input.companyText, input.companyResearch || "", input.jobText, input.resumeText),
    text: {
      format: zodTextFormat(questionBankSchema, "interview_question_bank"),
    },
  });

  const rawQuestionBank = questionBankResponse.output_parsed;

  if (!rawQuestionBank) {
    throw new AppError(502, "EMPTY_QUESTION_BANK", "AI 没有返回可解析的题库结果。");
  }

  const { result, shortfall } = normalizeQuestionBank(rawQuestionBank, input.questionCount);
  const allWarnings = [...buildWarnings(profile, result), ...shortfall];

  return {
    result,
    warnings: allWarnings,
  };
}

// --- Streaming version ---

export interface StreamEvent {
  type: "status" | "text" | "done" | "error";
  message?: string;
  delta?: string;
  phase?: "thinking" | "profile" | "questions";
  analysisId?: string;
  title?: string;
  result?: AnalysisResult;
  warnings?: string[];
}

export async function* generateInterviewAnalysisStream(input: {
  apiKey: string;
  baseUrl?: string;
  model: string;
  questionCount: 30 | 40 | 50;
  companyText: string;
  companyResearch?: string;
  jobText: string;
  resumeText: string;
}): AsyncGenerator<StreamEvent, void, unknown> {
  const client = getOpenAIClient(input.apiKey, input.baseUrl);

  // Phase 1: Streaming thinking analysis
  yield { type: "status", message: "正在分析材料..." };

  const chatStream = await client.chat.completions.create({
    model: input.model,
    stream: true,
    messages: [
      {
        role: "system",
        content:
          "你是求职面试准备助手。请用中文分析以下企业信息、岗位信息和简历，说明：\n1. 企业可能在做什么业务，以及这个岗位可能服务什么场景\n2. 该岗位的核心技术要求和软技能要求\n3. 候选人的优势和需要补充的方面\n4. 入职后可能承担的实际工作和面试准备重点方向\n\n语言简洁实用，不要输出格式化的 JSON。",
      },
      {
        role: "user",
        content: formatMaterials(input.companyText, input.companyResearch || "", input.jobText, input.resumeText),
      },
    ],
  });

  for await (const chunk of chatStream) {
    const delta = chunk.choices[0]?.delta;
    if (delta?.content) {
      yield { type: "text", delta: delta.content, phase: "thinking" };
    }
  }

  // Phase 2: Structured profile generation
  yield { type: "status", message: "画像分析完成，正在生成结构化数据..." };

  const profileResponse = await client.responses.parse({
    model: input.model as never,
    store: false,
    instructions:
      "你是求职面试准备助手。你的任务是从岗位材料和简历中提炼可信的面试画像，并保持结论克制。",
    input: buildProfilePrompt(input.companyText, input.companyResearch || "", input.jobText, input.resumeText),
    text: {
      format: zodTextFormat(interviewProfileSchema, "interview_profile"),
    },
  });

  const profile = profileResponse.output_parsed;

  if (!profile) {
    throw new AppError(502, "EMPTY_PROFILE", "AI 没有返回可解析的岗位画像。");
  }

  // Phase 3: Question bank generation
  yield { type: "status", message: "正在生成题库..." };

  const questionBankResponse = await client.responses.parse({
    model: input.model as never,
    store: false,
    instructions:
      "你是资深技术面试官和职业教练。请输出一份适合正式面试前学习的题库，语言精准，结构严格。",
    input: buildQuestionPrompt(profile, input.questionCount, input.companyText, input.companyResearch || "", input.jobText, input.resumeText),
    text: {
      format: zodTextFormat(questionBankSchema, "interview_question_bank"),
    },
  });

  const rawQuestionBank = questionBankResponse.output_parsed;

  if (!rawQuestionBank) {
    throw new AppError(502, "EMPTY_QUESTION_BANK", "AI 没有返回可解析的题库结果。");
  }

  const { result, shortfall } = normalizeQuestionBank(rawQuestionBank, input.questionCount);
  const warnings = [...buildWarnings(profile, result), ...shortfall];

  yield {
    type: "done",
    result,
    warnings,
  };
}
