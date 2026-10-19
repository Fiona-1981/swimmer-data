import { useEffect, useState } from "react"
import { ChevronRight } from "lucide-react"
import { Link } from "react-router"
import { Card, CardTitle } from "@/components/ui/card"
import { getSwimmers, type Swimmer } from "@/lib/swimmers"

// Where a coach picks who they're recording reps for.
function SwimmerList() {
  // null until getSwimmers() answers, so "loading" and "no swimmers" differ.
  const [swimmers, setSwimmers] = useState<Swimmer[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Set if the page is left before the answer arrives, so we don't update
    // a page that's gone. (In dev, StrictMode also runs effects twice.)
    let ignore = false
    getSwimmers().then(
      (result) => {
        if (!ignore) setSwimmers(result)
      },
      (reason) => {
        if (!ignore) {
          setError(reason instanceof Error ? reason.message : "Couldn't load swimmers")
        }
      },
    )
    return () => {
      ignore = true
    }
  }, []) // [] = run once, when the page first appears

  return (
    // Same width and padding as the capture page, but one column throughout.
    <main className="mx-auto flex min-h-svh w-full max-w-md flex-col gap-6 p-4 md:p-8">
      <h1 className="text-lg font-medium">Swimmers</h1>

      {error !== null ? (
        <p role="alert" className="text-base text-destructive">
          {error}
        </p>
      ) : swimmers === null ? (
        <p className="text-base text-muted-foreground">Loading swimmers…</p>
      ) : swimmers.length === 0 ? (
        <p className="text-base text-muted-foreground">No swimmers yet.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {swimmers.map((swimmer) => (
            <li key={swimmer.id}>
              {/* The whole card is the link. The focus ring sits on the link,
                  since that's what keyboard users tab to. */}
              <Link
                to={`/swimmers/${swimmer.id}`}
                className="group block rounded-xl outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {/* min-h-15: at least 60px tall, like the capture page's buttons. */}
                <Card className="min-h-15 flex-row items-center justify-between px-4 transition-colors group-hover:bg-muted">
                  <CardTitle className="text-lg">{swimmer.name}</CardTitle>
                  <ChevronRight
                    aria-hidden="true"
                    className="size-5 text-muted-foreground"
                  />
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default SwimmerList
