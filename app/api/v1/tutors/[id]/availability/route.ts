import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/api-response";
import { getTutorAvailableSlots } from "@/lib/scheduling/availability";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: tutorId } = await params;
    const { searchParams } = new URL(req.url);

    const fromParam = searchParams.get("from");
    const toParam = searchParams.get("to");
    const duration = Number(searchParams.get("duration")) || 30;

    const startDate = fromParam ? new Date(fromParam) : new Date();
    const endDate = toParam
      ? new Date(toParam)
      : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 أيام افتراضياً

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return apiError("Invalid date parameters (use ISO format)", 400);
    }

    const slots = await getTutorAvailableSlots(tutorId, startDate, endDate, duration);

    return apiSuccess({
      tutor_id: tutorId,
      range: {
        from: startDate.toISOString(),
        to: endDate.toISOString(),
      },
      slots,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return apiError(message, 500);
  }
}