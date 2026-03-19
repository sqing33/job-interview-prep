import { AppError, errorToResponse } from "@/lib/errors";
import { parseUploadedDocument } from "@/lib/documents";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new AppError(400, "MISSING_FILE", "请上传一个文件。");
    }

    const parsed = await parseUploadedDocument(file);
    return Response.json(parsed);
  } catch (error) {
    console.error("Failed to parse uploaded document", error);
    return errorToResponse(error);
  }
}
