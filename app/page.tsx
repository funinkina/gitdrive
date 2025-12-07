import { auth, signIn } from "@/lib/auth";
import { SignOut } from "@/components/auth-buttons";
import { Dashboard } from "@/components/dashboard";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { GitBranch } from "lucide-react";

export default async function Home() {
  const session = await auth();

  if (session?.user?.email) {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (user && !user.repoName) {
      redirect("/onboarding");
    }
  }

  if (session?.user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <GitBranch className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">GitDrive</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 pr-4 border-r border-border">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-medium leading-none">{session.user.name}</span>
                  <span className="text-xs text-muted-foreground leading-none mt-1">{session.user.email}</span>
                </div>
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={32}
                    height={32}
                    className="rounded-full ring-2 ring-border"
                  />
                )}
              </div>
              <SignOut />
            </div>
          </div>
        </header>

        <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-card rounded-xl border border-border p-6">
            <Dashboard />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <GitBranch className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">GitDrive</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-2xl w-full text-center">
          {/* Logo and Name */}
          <div className="mb-12">
            <div className="inline-flex items-center justify-center mb-6">
              <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center">
                <GitBranch className="w-10 h-10 text-primary-foreground" />
              </div>
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold text-foreground mb-4 tracking-tight">GitDrive</h1>
            <p className="text-lg text-muted-foreground">Your GitHub repositories as cloud storage</p>
          </div>

          {/* Description */}
          <div className="mb-12 space-y-4">
            <p className="text-base text-muted-foreground leading-relaxed">
              Transform your GitHub repositories into powerful cloud storage. Store files, sync seamlessly, and access
              everything from anywhere with the simplicity and security of GitHub.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              GitDrive leverages the reliability of GitHub infrastructure to give you unlimited storage backed by the
              world's leading developer platform. No additional servers, no complex setup—just your code and files in
              one place.
            </p>
          </div>

          {/* CTA Button */}
          <div className="mb-8">
            <form
              action={async () => {
                "use server";
                await signIn("github");
              }}
            >
              <Button size="lg" className="gap-2 px-8 py-6 text-base font-medium">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.868-.013-1.703-2.782.603-3.369-1.343-3.369-1.343-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.547 2.91 1.186.092-.923.35-1.546.636-1.903-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0110 4.817c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.138 18.193 20 14.431 20 10.017 20 4.484 15.522 0 10 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Login with GitHub
              </Button>
            </form>
          </div>

          {/* Trust Badge */}
          <div className="pt-8 border-t border-border">
            <p className="text-sm text-muted-foreground">Secure • Unlimited Storage • Built on GitHub</p>
          </div>
        </div>
      </main>
    </div>
  );
}
