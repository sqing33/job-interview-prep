import { getAnalysisById, deleteAnalysisById } from "@/lib/db";
import { AppError, errorToResponse } from "@/lib/errors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const analysis = getAnalysisById(id);

    if (!analysis) {
      throw new AppError(404, "ANALYSIS_NOT_FOUND", "没有找到这条历史记录。");
    }

    return Response.json({ analysis });
  } catch (error) {
    console.error("Failed to load analysis detail", error);
    return errorToResponse(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const deleted = deleteAnalysisById(id);

    if (!deleted) {
      throw new AppError(404, "ANALYSIS_NOT_FOUND", "没有找到这条历史记录。");
    }

    return Response.json({ deleted: true });
  } catch (error) {
    console.error("Failed to delete analysis", error);
    return errorToResponse(error);
  }
}
