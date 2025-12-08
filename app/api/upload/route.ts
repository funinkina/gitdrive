import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { uploadToRepo } from "@/lib/github";
import {
    computePHash,
    computeSha256,
    generateThumbnail,
    runOCR,
} from "@/lib/processing";
import { nanoid } from "nanoid";
import { NextRequest, NextResponse } from "next/server";
import path from "path";

export const maxDuration = 60; // Allow longer timeout for processing

export async function POST(req: NextRequest) {
    const session = await auth();
    if (!session || !session.user || !session.accessToken) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email! },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const tags = formData.get("tags") as string; // Comma separated or JSON
    const clientSha256 = formData.get("sha256") as string;
    // const clientPhash = formData.get("phash") as string; // Optional client-side phash

    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check storage quota (1GB)
    const MAX_STORAGE = 1024 * 1024 * 1024; // 1GB
    if ((user.storageUsed || 0) + file.size > MAX_STORAGE) {
        return NextResponse.json({ error: "Storage quota exceeded (1GB limit)" }, { status: 400 });
    }

    // 1. Validate file type and size (Basic check)
    if (file.size > 40 * 1024 * 1024) { // 50MB limit
        return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = file.type;

    // 2. Compute SHA256 and pHash
    const sha256 = await computeSha256(buffer);
    if (clientSha256 && clientSha256 !== sha256) {
        return NextResponse.json({ error: "SHA256 mismatch" }, { status: 400 });
    }

    let phash = "";
    if (mimeType.startsWith("image/")) {
        try {
            phash = await computePHash(buffer);
        } catch (e) {
            console.warn("Failed to compute pHash", e);
        }
    }

    // 3. Create thumbnail
    let thumbnailBuffer: Buffer | null = null;
    if (mimeType.startsWith("image/")) {
        try {
            thumbnailBuffer = await generateThumbnail(buffer);
        } catch (e) {
            console.error("Thumbnail generation failed", e);
        }
    }

    // 4. Run OCR
    const ocrText = await runOCR(buffer, mimeType);

    // 5. Prepare paths and metadata
    const now = new Date();
    const yyyy = now.getUTCFullYear().toString();
    const mm = (now.getUTCMonth() + 1).toString().padStart(2, "0");
    const dd = now.getUTCDate().toString().padStart(2, "0");
    const timestamp = now.toISOString().replace(/[-:.]/g, ""); // YYYYMMDDThhmmssZ... roughly
    // Better timestamp format as per plan: YYYYMMDDThhmmssZ
    const tsStr = now.toISOString().replace(/\.\d+Z$/, "Z").replace(/[-:]/g, "");

    const shortUuid = nanoid(6);
    const ext = path.extname(file.name) || ".bin";
    const userId = session.user.email?.replace(/[^a-zA-Z0-9]/g, "_") || "unknown"; // Use sanitized email as user_id

    const filename = `${tsStr}_${shortUuid}${ext}`;
    const metaFilename = `${tsStr}_${shortUuid}.json`;
    const thumbFilename = `${tsStr}_${shortUuid}.jpg`;

    const uploadPath = `uploads/${userId}/${yyyy}/${mm}/${dd}/${filename}`;
    const metaPath = `meta/${userId}/${yyyy}/${mm}/${dd}/${metaFilename}`;
    const thumbPath = `thumbs/${userId}/${yyyy}/${mm}/${dd}/${thumbFilename}`;

    const metadata = {
        path: uploadPath,
        name: file.name,
        timestamp: now.toISOString(),
        size: file.size,
        mime: mimeType,
        sha256,
        phash,
        tags: tags ? tags.split(",").map((t) => t.trim()) : [],
        ocr_text: ocrText,
    };

    // 6. Upload to GitHub
    // User already fetched above
    if (!user.repoOwner || !user.repoName) {
        return NextResponse.json(
            { error: "User repository not configured" },
            { status: 400 }
        );
    }

    const owner = user.repoOwner;
    const repo = user.repoName; const filesToUpload: { path: string; content: any; encoding: "utf-8" | "base64" }[] = [
        { path: uploadPath, content: buffer, encoding: "base64" as const },
        { path: metaPath, content: JSON.stringify(metadata, null, 2), encoding: "utf-8" as const },
    ]; if (thumbnailBuffer) {
        filesToUpload.push({
            path: thumbPath,
            content: thumbnailBuffer as unknown as Buffer,
            encoding: "base64" as const,
        });
    }

    try {
        const commitSha = await uploadToRepo(
            session.accessToken,
            owner,
            repo,
            filesToUpload,
            `Upload ${filename}`
        );

        // Update storage usage
        await prisma.user.update({
            where: { id: user.id },
            data: { storageUsed: { increment: file.size } },
        });

        return NextResponse.json({
            success: true,
            metadata,
            commit: commitSha,
        });
    } catch (error: any) {
        console.error("Upload failed", error);
        return NextResponse.json({ error: error.message || "Upload failed" }, { status: 500 });
    }
}
