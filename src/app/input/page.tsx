import { getAnalysisById } from "@/lib/db";
import { MODEL_PRESETS } from "@/lib/constants";

import { InputForm } from "./InputForm";

export const dynamic = "force-dynamic";

export default async function InputPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;

  let initialModel = MODEL_PRESETS[0];
  let initialQuestionCount: 30 | 40 | 50 = 40;
  let initialJobText = "";
  let initialResumeText = "";

  if (from) {
    const analysis = getAnalysisById(from);

    if (analysis) {
      initialModel = analysis.model;
      initialQuestionCount = analysis.questionCount as 30 | 40 | 50;
      initialJobText = analysis.jobText;
      initialResumeText = analysis.resumeText;
    }
  }

  return (
    <InputForm
      initialModel={initialModel}
      initialQuestionCount={initialQuestionCount}
      initialJobText={initialJobText}
      initialResumeText={initialResumeText}
    />
  );
}
