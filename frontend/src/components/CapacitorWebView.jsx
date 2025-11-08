import { useEffect, useState, useRef } from 'react';

/**
 * Capacitor WebView component using iframe for mobile
 * Note: Native WebView plugins can't be embedded in the DOM on Android,
 * so we use iframe which works well on mobile browsers
 */
function CapacitorWebView({ url, tabId, onNavigate, className, style }) {
  const [currentUrl, setCurrentUrl] = useState(url);
  const [isLoading, setIsLoading] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (url) {
      setCurrentUrl(url);
      setIsLoading(true);
    }
  }, [url]);

  const handleLoad = () => {
    setIsLoading(false);
    // Try to get the iframe's current URL (may be blocked by CORS)
    try {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        const iframeUrl = iframeRef.current.contentWindow.location.href;
        if (iframeUrl && iframeUrl !== 'about:blank' && iframeUrl !== currentUrl) {
          setCurrentUrl(iframeUrl);
          if (onNavigate) {
            onNavigate(tabId, iframeUrl);
          }
        }
      }
    } catch (e) {
      // CORS will block this, which is expected
      console.log('[CapacitorWebView] Cannot access iframe URL due to CORS');
    }
  };

  return (
    <div
      className={className}
      style={style || { width: '100%', height: '100%', position: 'relative' }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Loading website...</p>
            <p className="text-xs text-muted-foreground break-all px-4">{currentUrl}</p>
          </div>
        </div>
      )}
      {/* Use iframe for Capacitor/mobile - works better than native WebView overlay */}
      <iframe
        ref={iframeRef}
        src={currentUrl}
        onLoad={handleLoad}
        className="w-full h-full border-0"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-downloads"
        allow="geolocation; microphone; camera; midi; encrypted-media; autoplay; clipboard-write"
        title="Web Browser"
      />
    </div>
  );
}

export default CapacitorWebView;
