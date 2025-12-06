import { auth } from "@/lib/auth";
import { SignIn, SignOut } from "@/components/auth-buttons";
import { UploadZone } from "@/components/upload-zone";
import Image from "next/image";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";

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

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-linear-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto  lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          GitDrive - Your Repo as a Drive
        </p>
        <div className="fixed bottom-0 left-0 flex h-48 w-full items-end justify-center bg-linear-to-t from-white via-white dark:from-black dark:via-black lg:static lg:h-auto lg:w-auto lg:bg-none">
          {session?.user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {session.user.image && (
                  <Image
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                )}
                <span>{session.user.name}</span>
              </div>
              <SignOut />
            </div>
          ) : (
            <SignIn />
          )}
        </div>
      </div>

      <div className="relative flex place-items-center before:absolute before:h-[300px] before:w-[480px] before:-translate-x-1/2 before:rounded-full before:bg-linear-to-br before:from-transparent before:to-blue-700 before:opacity-10 before:blur-2xl before:content-[''] after:absolute after:-z-20 after:h-[180px] after:w-60 after:translate-x-1/3 after:bg-linear-to-t after:from-blue-900 after:via-blue-800 after:opacity-40 after:blur-2xl after:content-[''] before:dark:bg-linear-to-br before:dark:from-transparent before:dark:to-blue-700 before:dark:opacity-10 after:dark:from-blue-900 after:dark:via-[#0141ff] after:dark:opacity-40 before:lg:h-[360px] z-[-1]">
        <h1 className="text-6xl font-bold text-center">
          GitDrive
        </h1>
      </div>

      <div className="mb-32 grid text-center lg:max-w-5xl lg:w-full lg:mb-0 lg:grid-cols-4 lg:text-left mt-20">
        {session?.user ? (
          <div className="col-span-4 p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-semibold mb-4">Welcome back!</h2>
            <p className="mb-4">You are logged in. Your drive is ready.</p>
            <UploadZone />
            {/* Drive interface will go here */}
            <div className="p-4 border border-dashed border-gray-300 rounded text-gray-500 mt-8">
              Drive contents will appear here.
            </div>
          </div>
        ) : (
          <div className="col-span-4 text-center">
            <p className="text-xl mb-8">
              Store your files securely in your GitHub repositories.
              <br />
              Log in to get started.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
