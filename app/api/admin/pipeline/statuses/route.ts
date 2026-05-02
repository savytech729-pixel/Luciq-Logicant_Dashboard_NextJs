import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await (prisma as any).$runCommandRaw({
      find: "PipelineMatch",
      projection: { candidateId: 1, status: 1, updatedAt: 1 },
      sort: { updatedAt: -1 },
      limit: 5000,
    });

    const docs = (result as any)?.cursor?.firstBatch ?? [];
    const statusMap: Record<string, string> = {};
    for (const doc of docs) {
      const candidateId = doc.candidateId?.$oid ?? String(doc.candidateId || "");
      if (!candidateId) continue;
      if (!statusMap[candidateId]) {
        statusMap[candidateId] = String(doc.status || "");
      }
    }

    return NextResponse.json({ statusMap });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
