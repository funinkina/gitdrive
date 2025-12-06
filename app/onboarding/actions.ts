"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

export async function createRepository(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session?.user || !session.accessToken) {
        return { error: "Not authenticated" };
    }

    const repoName = formData.get("repoName") as string;

    if (!repoName) {
        return { error: "Repository name is required" };
    }

    try {
        // 1. Create repository on GitHub
        const response = await fetch("https://api.github.com/user/repos", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${session.accessToken}`,
                "Content-Type": "application/json",
                Accept: "application/vnd.github.v3+json",
            },
            body: JSON.stringify({
                name: repoName,
                private: true,
                description: "Storage for GitDrive",
                auto_init: true, // Initialize with README so we can commit files immediately
            }),
        });

        let repoData;

        if (!response.ok) {
            const error = await response.json();

            const isNameExistsError = error.errors?.some((e: any) =>
                e.resource === 'Repository' &&
                e.field === 'name' &&
                e.code === 'custom' &&
                e.message === 'name already exists on this account'
            );

            if (response.status === 422 && isNameExistsError) {
                const userResponse = await fetch("https://api.github.com/user", {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                });

                if (!userResponse.ok) return { error: "Failed to verify repository owner" };
                const user = await userResponse.json();

                const repoResponse = await fetch(`https://api.github.com/repos/${user.login}/${repoName}`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                });

                if (!repoResponse.ok) return { error: "Failed to fetch existing repository" };
                const existingRepo = await repoResponse.json();

                if (!existingRepo.private) {
                    return { error: "Repository with this name exists but is public. Please use a private repository." };
                }

                const contentsResponse = await fetch(`https://api.github.com/repos/${user.login}/${repoName}/contents`, {
                    headers: { Authorization: `Bearer ${session.accessToken}` },
                });

                let isBlank = false;
                if (contentsResponse.status === 404) {
                    isBlank = true;
                } else if (contentsResponse.ok) {
                    const contents = await contentsResponse.json();
                    if (Array.isArray(contents)) {
                        if (contents.length === 0) isBlank = true;
                        if (contents.length === 1 && contents[0].name === 'README.md') isBlank = true;
                    }
                }

                if (!isBlank) {
                    return { error: "Repository with this name exists but is not empty. Please use an empty repository." };
                }

                repoData = existingRepo;
            } else {
                console.error("GitHub API Error:", error);
                return { error: error.message || "Failed to create repository" };
            }
        } else {
            repoData = await response.json();
        }

        // 2. Save repo details to database
        await prisma.user.update({
            where: { email: session.user.email! },
            data: {
                repoName: repoData.name,
                repoOwner: repoData.owner.login,
            },
        });
    } catch (e: any) {
        console.error(e);
        return { error: e.message || "An unexpected error occurred" };
    }

    redirect("/");
}
