import Link from "next/link";
import { JSX, SVGProps } from "react";
import { FileText, GitMerge, Share2 } from "lucide-react";
import AuthButtons from "@/components/shared/AuthButtons";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="w-full border-b">
        <div className="container mx-auto flex h-14 items-center px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center justify-center" href="#">
            <MountainIcon className="h-6 w-6" />
            <span className="sr-only">pagespace</span>
          </Link>
          <nav className="ml-auto flex gap-4 sm:gap-6">
            <AuthButtons />
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-20 md:py-32 lg:py-40 bg-[#1a1a1a] text-[#f2f2f2]">
          <div className="container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl/none">
                  Your entire world, organized.
                </h1>
                <p className="mx-auto max-w-[700px] text-lg text-[#f2f2f2]/80 md:text-xl">
                  A new kind of workspace where everything is a flexible page,
                  anything can be nested, and anything can be mentioned.
                </p>
              </div>
              <div className="space-y-2">
                <Link
                  className="inline-flex h-12 items-center justify-center rounded-md bg-[#f2f2f2] px-8 text-sm font-medium text-[#1a1a1a] shadow transition-colors hover:bg-[#f2f2f2]/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4c4c4c] disabled:pointer-events-none disabled:opacity-50"
                  href="/dashboard"
                >
                  Start Building
                </Link>
                <p className="text-xs text-[#f2f2f2]/60">
                  Sign up for alpha testing.
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-20 md:py-32 lg:py-40 bg-[#f2f2f2] text-[#1a1a1a]">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <FileText className="w-12 h-12" />
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">Everything is a Page</h3>
                  <p className="text-[#1a1a1a]/80">
                    Documents, folders, chats, and even AI assistants are all
                    flexible pages. Mix and match them to create the perfect
                    workflow.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <GitMerge className="w-12 h-12" />
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">The Infinite Tree</h3>
                  <p className="text-[#1a1a1a]/80">
                    Nest anything inside anything. Give your work structure and
                    context that evolves with your ideas.
                  </p>
                </div>
              </div>
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <Share2 className="w-12 h-12" />
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold">
                    Mention Anything, Anywhere
                  </h3>
                  <p className="text-[#1a1a1a]/80">
                    Link pages, people, or conversations to create a web of
                    knowledge. Your AI understands the context of every mention.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <section className="w-full py-20 md:py-32 lg:py-40 bg-[#1a1a1a] text-[#f2f2f2]">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center space-y-6 text-center">
            <div className="space-y-4">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                Ready to build your new workspace?
              </h2>
              <p className="mx-auto max-w-[600px] text-lg text-[#f2f2f2]/80 md:text-xl">
                Sign up for free and start organizing your world.
              </p>
            </div>
            <div className="space-y-2">
              <Link
                className="inline-flex h-12 items-center justify-center rounded-md bg-[#f2f2f2] px-8 text-sm font-medium text-[#1a1a1a] shadow transition-colors hover:bg-[#f2f2f2]/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#4c4c4c] disabled:pointer-events-none disabled:opacity-50"
                href="/dashboard"
              >
                Start Building
              </Link>
            </div>
          </div>
        </div>
      </section>
      <footer className="w-full border-t border-[#4c4c4c] bg-[#1a1a1a] text-[#f2f2f2]">
        <div className="container mx-auto flex flex-col gap-2 sm:flex-row py-6 shrink-0 items-center px-4 md:px-6">
          <p className="text-xs text-[#f2f2f2]/80">
            © 2025 pagespace. All rights reserved.
          </p>
          <nav className="sm:ml-auto flex gap-4 sm:gap-6">
            <Link
              className="text-xs hover:underline underline-offset-4 text-[#f2f2f2]/80"
              href="#"
            >
              Terms of Service
            </Link>
            <Link
              className="text-xs hover:underline underline-offset-4 text-[#f2f2f2]/80"
              href="#"
            >
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

function MountainIcon(props: JSX.IntrinsicAttributes & SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m8 3 4 8 5-5 5 15H2L8 3z" />
    </svg>
  );
}

