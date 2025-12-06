import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { deleteFromRepo } from "@/lib/github";
import path from "path";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
        return NextResponse.json({ error: "Path required" }, { status: 400 });
    }

    const userId = session.user.email?.replace(/[^a-zA-Z0-9]/g, "_") || "unknown";

    // Security check: Ensure path belongs to user
    // Expected path: uploads/{userId}/... or thumbs/{userId}/...
    if (!filePath.startsWith(`uploads/${userId}/`) && !filePath.startsWith(`thumbs/${userId}/`)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
    });

    if (!user || !user.repoOwner || !user.repoName) {
        return NextResponse.json({ error: "User repository not configured" }, { status: 400 });
    }

    const owner = user.repoOwner;
    const repo = user.repoName;

    // Construct Raw URL
    // https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}
    // Or use API: https://api.github.com/repos/{owner}/{repo}/contents/{path} with Accept: application/vnd.github.v3.raw

    // Using API is better with token
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

    try {
        const res = await fetch(apiUrl, {
            headers: {
                Authorization: `token ${session.accessToken}`,
                Accept: "application/vnd.github.v3.raw"
            }
        });

        if (!res.ok) {
            return NextResponse.json({ error: "File not found or error fetching" }, { status: res.status });
        }

        // Stream the response back
        const headers = new Headers(res.headers);
        headers.set("Content-Disposition", `inline; filename="${filePath.split('/').pop()}"`);

        return new NextResponse(res.body, {
            status: 200,
            headers
        });

    } catch (e) {
        console.error("Proxy error", e);
        return NextResponse.json({ error: "Proxy error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get("path");

    if (!filePath) {
        return NextResponse.json({ error: "Path required" }, { status: 400 });
    }

    const userId = session.user.email?.replace(/[^a-zA-Z0-9]/g, "_") || "unknown";

    // Security check
    if (!filePath.startsWith(`uploads/${userId}/`)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
    });

    if (!user || !user.repoOwner || !user.repoName) {
        return NextResponse.json({ error: "User repository not configured" }, { status: 400 });
    }

    const owner = user.repoOwner;
    const repo = user.repoName;    // Calculate other paths
    // filePath: uploads/user/YYYY/MM/DD/filename.ext
    // We need to replace 'uploads' with 'meta' and 'thumbs' and change extension

    const parts = filePath.split("/");
    // parts: [uploads, user, YYYY, MM, DD, filename]
    if (parts.length < 6) {
        return NextResponse.json({ error: "Invalid path format" }, { status: 400 });
    }

    const filename = parts[parts.length - 1];
    const filenameNoExt = path.parse(filename).name; // e.g. 2025..._uuid

    // Reconstruct directory path relative to root
    const dirPath = parts.slice(1, parts.length - 1).join("/"); // user/YYYY/MM/DD

    const metaPath = `meta/${dirPath}/${filenameNoExt}.json`;
    const thumbPath = `thumbs/${dirPath}/${filenameNoExt}.jpg`;

    try {
        await deleteFromRepo(
            session.accessToken,
            owner,
            repo,
            [filePath, metaPath, thumbPath],
            `Delete ${filename}`
        );
        return NextResponse.json({ success: true });
    } catch (e: any) {
        console.error("Delete failed", e);
        return NextResponse.json({ error: e.message || "Delete failed" }, { status: 500 });
    }
}
