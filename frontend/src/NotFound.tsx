import { Link } from "react-router"

// Shown for addresses that match no route, and for unknown swimmer IDs.
function NotFound({ message = "Page not found" }: { message?: string }) {
  return (
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col items-start gap-2 p-4 md:p-8">
      <h1 className="text-lg font-medium">{message}</h1>
      {/* h-15 keeps it a full-size touch target, like the buttons. */}
      <Link
        to="/"
        className="inline-flex h-15 items-center text-base underline underline-offset-4"
      >
        Back to swimmers
      </Link>
    </main>
  )
}

export default NotFound
