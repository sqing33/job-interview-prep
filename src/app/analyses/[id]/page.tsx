import { notFound } from "next/navigation";

import { DetailActions } from "@/components/detail-actions";
import { QuestionBank } from "@/components/question-bank";
import { Badge } from "@/components/ui";
import { getAnalysisById } from "@/lib/db";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AnalysisDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const analysis = getAnalysisById(id);

  if (!analysis) {
    notFound();
  }

  return (
    <div style={{ position: "fixed", top: "56px", left: 0, right: 0, bottom: 0, overflowY: "auto" }}>
      <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-3 py-4 pb-10 sm:gap-5 sm:px-4 sm:py-5 sm:pb-12 lg:gap-6 lg:px-7 lg:py-8">
        <section className="paper-panel rounded-[1.5rem] p-4 sm:rounded-[1.75rem] sm:p-5 lg:rounded-[2rem] lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <h1 className="text-[1.9rem] font-semibold tracking-tight text-foreground sm:text-[2.1rem] lg:text-4xl">
                {analysis.title}
              </h1>
              <p className="mt-2 text-[15px] leading-6 text-foreground-soft sm:text-base">
                {formatDateTime(analysis.createdAt)} · {analysis.model} · {analysis.questionCount} 题
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {analysis.result.company ? <Badge tone="accent">{analysis.result.company}</Badge> : null}
              {analysis.result.role ? <Badge tone="teal">{analysis.result.role}</Badge> : null}
            </div>
          </div>

          <div className="mt-6">
            <DetailActions analysisId={analysis.id} />
          </div>
        </section>

        {analysis.warnings.length ? (
          <section className="paper-panel rounded-[1.5rem] p-4 sm:rounded-[1.7rem] sm:p-5 lg:rounded-[1.8rem] lg:p-6">
            <p className="text-[15px] font-semibold text-foreground sm:text-base">生成提示</p>
            <ul className="mt-3 space-y-2 text-[15px] leading-7 text-foreground-soft sm:text-base">
              {analysis.warnings.map((warning) => (
                <li key={warning}>- {warning}</li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="paper-panel rounded-[1.5rem] p-4 sm:rounded-[1.7rem] sm:p-5 lg:rounded-[1.8rem] lg:p-8">
          <QuestionBank analysis={analysis} />
        </section>

        <section className={`grid gap-6 ${analysis.companyText ? "xl:grid-cols-3" : "xl:grid-cols-2"}`}>
          {analysis.companyText ? (
            <article className="paper-panel rounded-[1.5rem] p-4 sm:rounded-[1.7rem] sm:p-5 lg:rounded-[1.8rem] lg:p-6">
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">企业补充信息</h2>
              <pre className="analysis-text mt-4 rounded-[1.2rem] border border-border bg-white/62 p-4 text-[15px] leading-7 text-foreground-soft sm:rounded-[1.35rem] sm:p-5 sm:text-base sm:leading-8">
                {analysis.companyText}
              </pre>
            </article>
          ) : null}

          <article className="paper-panel rounded-[1.5rem] p-4 sm:rounded-[1.7rem] sm:p-5 lg:rounded-[1.8rem] lg:p-6">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">岗位 / 企业信息</h2>
            <pre className="analysis-text mt-4 rounded-[1.2rem] border border-border bg-white/62 p-4 text-[15px] leading-7 text-foreground-soft sm:rounded-[1.35rem] sm:p-5 sm:text-base sm:leading-8">
              {analysis.jobText}
            </pre>
          </article>

          <article className="paper-panel rounded-[1.5rem] p-4 sm:rounded-[1.7rem] sm:p-5 lg:rounded-[1.8rem] lg:p-6">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">个人简历</h2>
            <pre className="analysis-text mt-4 rounded-[1.2rem] border border-border bg-white/62 p-4 text-[15px] leading-7 text-foreground-soft sm:rounded-[1.35rem] sm:p-5 sm:text-base sm:leading-8">
              {analysis.resumeText}
            </pre>
          </article>
        </section>
      </div>
    </div>
  );
}
