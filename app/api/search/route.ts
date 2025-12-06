import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { searchMetadata } from "@/lib/search";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";
    const fromStr = searchParams.get("from");
    const toStr = searchParams.get("to");
    const page = parseInt(searchParams.get("page") || "1");
    const per = parseInt(searchParams.get("per") || "50");

    if (!fromStr || !toStr) {
        return NextResponse.json(
            { error: "Date range (from, to) is required" },
            { status: 400 }
        );
    }

    const fromDate = new Date(fromStr);
    const toDate = new Date(toStr);

    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    const userId = session.user.email?.replace(/[^a-zA-Z0-9]/g, "_") || "unknown";

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
    });

    if (!user || !user.repoOwner || !user.repoName) {
        return NextResponse.json(
            { error: "User repository not configured" },
            { status: 400 }
        );
    }

    const owner = user.repoOwner;
    const repo = user.repoName;

    try {
        const allResults = await searchMetadata(
            session.accessToken,
            owner,
            repo,
            userId,
            q,
            fromDate,
            toDate
        );

        // Sort by timestamp descending
        allResults.sort((a, b) => {
            return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });

        // Pagination
        const start = (page - 1) * per;
        const end = start + per;
        const pagedResults = allResults.slice(start, end);

        return NextResponse.json({
            results: pagedResults,
            total: allResults.length,
            page,
            per,
        });
    } catch (error: any) {
        console.error("Search failed", error);
        return NextResponse.json(
            { error: error.message || "Search failed" },
            { status: 500 }
        );
    }
}
