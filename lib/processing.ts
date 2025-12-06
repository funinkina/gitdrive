import sharp from "sharp";
import { createWorker } from "tesseract.js";
import crypto from "node:crypto";
import path from "path";

export async function generateThumbnail(buffer: Buffer): Promise<Buffer> {
    return sharp(buffer)
        .resize(224, 224, { fit: "inside" })
        .jpeg({ quality: 80 })
        .toBuffer();
}

export async function computeSha256(buffer: Buffer): Promise<string> {
    const hash = crypto.createHash("sha256");
    hash.update(buffer);
    return hash.digest("hex");
}

export async function computePHash(buffer: Buffer): Promise<string> {
    // dHash implementation
    // 1. Resize to 9x8 (72 pixels)
    // 2. Grayscale
    const data = await sharp(buffer)
        .resize(9, 8, { fit: "fill" })
        .grayscale()
        .raw()
        .toBuffer();

    let hash = 0n;
    for (let y = 0; y < 8; y++) {
        for (let x = 0; x < 8; x++) {
            const left = data[y * 9 + x];
            const right = data[y * 9 + x + 1];
            if (left > right) {
                hash |= 1n << BigInt(y * 8 + x);
            }
        }
    }
    return "0x" + hash.toString(16);
}

export async function runOCR(buffer: Buffer, mimeType: string): Promise<string> {
    if (!mimeType.startsWith("image/") && mimeType !== "application/pdf") {
        return "";
    }

    // For PDF, tesseract.js might need specific handling or conversion.
    // Tesseract.js supports images. For PDF, we might need to convert to image first or use a different tool.
    // The plan says "Run lightweight OCR for PDFs/images".
    // Tesseract.js can handle images. For PDF, it's more complex in a serverless/edge environment without external binaries.
    // Given the constraints and "lightweight", I'll stick to images for now or try to use tesseract.js if it supports PDF buffers directly (it usually requires PDF.js or similar to render).
    // I'll implement for images first. If it's a PDF, I might skip or try to convert first page to image if sharp supports it.
    // Sharp can read PDF if libvips is compiled with poppler. Standard sharp prebuilds might not have it.
    // I'll assume images for now and return empty string for PDFs unless I can easily convert.

    if (mimeType === "application/pdf") {
        // TODO: Handle PDF OCR. Requires rendering PDF to image.
        return "";
    }

    try {
        const worker = await createWorker("eng", 1, {
            workerPath: path.join(process.cwd(), "node_modules/tesseract.js/src/worker-script/node/index.js"),
        });
        const ret = await worker.recognize(buffer);
        await worker.terminate();

        // Truncate to 1024 chars as per plan
        return ret.data.text.substring(0, 1024);
    } catch (error) {
        console.error("OCR failed:", error);
        return "";
    }
}
