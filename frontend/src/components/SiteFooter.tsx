import { cn } from "cn"

// Link to the repo, shown at the bottom of every page. className lets a page
// fit it into its own layout, e.g. spanning both columns on the capture page.
function SiteFooter({ className }: { className?: string }) {
  return (
    <footer className={cn("text-center text-sm text-muted-foreground", className)}>
      <a
        href="https://github.com/Fiona-1981/swimmer-data"
        target="_blank"
        rel="noopener noreferrer"
        className="underline underline-offset-4 hover:text-foreground"
      >
        View the code on GitHub
      </a>
    </footer>
  )
}

export default SiteFooter
