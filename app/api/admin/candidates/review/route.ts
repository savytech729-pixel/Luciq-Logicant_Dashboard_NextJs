import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await prisma.$runCommandRaw({
      find: "Candidate",
      filter: { parseNeedsReview: true },
      sort: { createdAt: -1 },
      limit: 500,
    });

    const docs = (result as any)?.cursor?.firstBatch ?? [];
    const candidates = docs.map((c: any) => ({
      id: c._id?.$oid ?? String(c._id),
      name: c.name,
      email: c.email,
      currentRole: c.currentRole,
      totalExperience: c.totalExperience,
      skills: c.skills ?? [],
      parseConfidence: c.parseConfidence ?? 0,
      parseIssues: c.parseIssues ?? [],
      parseSourceFile: c.parseSourceFile ?? null,
      createdAt: c.createdAt?.$date ?? c.createdAt,
    }));

    return NextResponse.json({ count: candidates.length, candidates });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
