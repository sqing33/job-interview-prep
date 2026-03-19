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
  let initialCompanyText = "";
  let initialJobText = "";
  let initialResumeText = settings.resumeText;

  if (from) {
    const analysis = getAnalysisById(from);

    if (analysis) {
      initialModel = analysis.model;
      initialCompanyText = analysis.companyText;
      initialJobText = analysis.jobText;
      initialResumeText = analysis.resumeText;
    }
  }

  return (
    <InputForm
      initialModel={initialModel}
      initialCompanyText={initialCompanyText}
      initialJobText={initialJobText}
      initialResumeText={initialResumeText}
    />
  );
}
