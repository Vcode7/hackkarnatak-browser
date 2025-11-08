import { AlertCircle, ExternalLink } from 'lucide-react'

export default function BlockedSiteMessage({ url }) {
  const openInNewTab = () => {
    window.open(url, '_blank')
  }

  return (
    <div className="flex items-center justify-center h-full bg-secondary/50">
      <div className="max-w-md p-8 bg-background rounded-lg border border-border shadow-lg text-center">
        <AlertCircle className="mx-auto mb-4 text-destructive" size={48} />
        <h2 className="text-xl font-semibold mb-2">Cannot Display This Site</h2>
        <p className="text-muted-foreground mb-4">
          This website cannot be embedded due to security restrictions (X-Frame-Options).
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Sites like Google, Facebook, and many others block embedding to prevent clickjacking attacks.
        </p>
        <div className="space-y-3">
          <button
            onClick={openInNewTab}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
          >
            <ExternalLink size={18} />
            Open in New Browser Tab
          </button>
          <p className="text-xs text-muted-foreground">
            💡 Tip: Use the desktop app (Electron) for full browsing capabilities
          </p>
        </div>
      </div>
    </div>
  )
}
