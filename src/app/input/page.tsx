import { getAnalysisById } from "@/lib/db";
import { getAppSettings } from "@/lib/settings";

import { InputForm } from "./InputForm";

export const dynamic = "force-dynamic";

export default async function InputPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  const { from } = await searchParams;
  const settings = getAppSettings();

  let initialModel = settings.defaultModel;
  let initialJobText = "";
  let initialResumeText = settings.resumeText;

  if (from) {
    const analysis = getAnalysisById(from);

    if (analysis) {
      initialModel = analysis.model;
      initialJobText = analysis.jobText;
      initialResumeText = analysis.resumeText;
    }
  }

  return (
    <InputForm
      initialModel={initialModel}
      initialJobText={initialJobText}
      initialResumeText={initialResumeText}
    />
  );
}
