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
    <div className="flex flex-col gap-6 px-5 py-6 lg:px-7 lg:py-8">
      <section className="paper-panel rounded-[2rem] p-6 lg:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">{analysis.title}</h1>
            <p className="mt-2 text-sm text-foreground-soft">
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
        <section className="paper-panel rounded-[1.8rem] p-6">
          <p className="text-sm font-semibold text-foreground">生成提示</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-foreground-soft">
            {analysis.warnings.map((warning) => (
              <li key={warning}>- {warning}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="paper-panel rounded-[1.8rem] p-6 lg:p-8">
        <QuestionBank analysis={analysis} />
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <article className="paper-panel rounded-[1.8rem] p-6">
          <h2 className="text-lg font-semibold text-foreground">岗位 / 企业信息</h2>
          <pre className="analysis-text mt-4 rounded-[1.5rem] border border-border bg-white/62 p-5 text-sm leading-7 text-foreground-soft">
            {analysis.jobText}
          </pre>
        </article>

        <article className="paper-panel rounded-[1.8rem] p-6">
          <h2 className="text-lg font-semibold text-foreground">个人简历</h2>
          <pre className="analysis-text mt-4 rounded-[1.5rem] border border-border bg-white/62 p-5 text-sm leading-7 text-foreground-soft">
            {analysis.resumeText}
          </pre>
        </article>
      </section>
    </div>
  );
}
