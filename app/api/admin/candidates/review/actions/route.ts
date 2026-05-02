import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const session = await getSession();
    if (!session || session.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const action = String(body?.action || "");
    const ids: string[] = Array.isArray(body?.ids) ? body.ids.filter((id: unknown) => typeof id === "string" && id.length > 0) : [];
    if (!ids.length) {
      return NextResponse.json({ error: "No candidates selected" }, { status: 400 });
    }

    if (action === "approve") {
      await (prisma as any).$runCommandRaw({
        update: "Candidate",
        updates: [{
          q: { _id: { $in: ids.map((id) => ({ $oid: id })) } },
          u: { $set: { parseNeedsReview: false, parseIssues: [] } },
          multi: true,
        }],
      });
      return NextResponse.json({ success: true });
    }

    if (action === "reject") {
      await (prisma as any).$runCommandRaw({
        update: "Candidate",
        updates: [{
          q: { _id: { $in: ids.map((id) => ({ $oid: id })) } },
          u: { $set: { parseNeedsReview: false, parseIssues: ["Rejected by reviewer"], parseConfidence: 0 } },
          multi: true,
        }],
      });
      return NextResponse.json({ success: true });
    }

    if (action === "edit") {
      const updates = body?.updates || {};
      const payload: Record<string, unknown> = {};
      if (typeof updates.name === "string") payload.name = updates.name.trim();
      if (typeof updates.currentRole === "string") payload.currentRole = updates.currentRole.trim();
      if (typeof updates.totalExperience === "string" || typeof updates.totalExperience === "number") {
        payload.totalExperience = Number(updates.totalExperience) || 0;
      }
      if (typeof updates.skills === "string") {
        payload.skills = updates.skills.split(",").map((s: string) => s.trim()).filter(Boolean);
      }
      payload.parseNeedsReview = false;
      payload.parseIssues = [];

      await (prisma as any).$runCommandRaw({
        update: "Candidate",
        updates: [{
          q: { _id: { $in: ids.map((id) => ({ $oid: id })) } },
          u: { $set: payload },
          multi: true,
        }],
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
