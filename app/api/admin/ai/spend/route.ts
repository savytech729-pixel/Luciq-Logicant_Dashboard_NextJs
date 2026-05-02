import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getAiSpendMetrics } from "@/lib/ai";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(getAiSpendMetrics());
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
