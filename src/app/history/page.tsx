import { listAnalysisSummaries } from "@/lib/db";

import { HistoryContent } from "./HistoryContent";

export const dynamic = "force-dynamic";

export default function HistoryPage() {
  const history = listAnalysisSummaries();

  return (
    <div className="px-5 py-6 lg:px-7 lg:py-8">
      <HistoryContent initialHistory={history} />
    </div>
  );
}
