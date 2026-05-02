import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const ids = Array.isArray(body?.ids) ? body.ids.filter((id: unknown) => typeof id === "string" && id.length > 0) : [];
    if (!ids.length) {
      return NextResponse.json({ error: "No candidate ids provided" }, { status: 400 });
    }

    await prisma.pipelineMatch.deleteMany({
      where: { candidateId: { in: ids } },
    });
    const result = await prisma.candidate.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ success: true, deleted: result.count });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
