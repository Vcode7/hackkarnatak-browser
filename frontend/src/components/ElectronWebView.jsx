import { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const ElectronWebView = forwardRef(({
  url,
  tabId,
  onNavigate,
  onTitleUpdate,
  onLoadStart,
  onLoadProgress,
  onLoadStop,
  className,
  style,
}, ref) => {
  const webviewRef = useRef(null);
  const lastLoadedUrl = useRef(null);
  const isReadyRef = useRef(false);

  // Expose webview element to parent
  useImperativeHandle(ref, () => webviewRef.current);

  // Load URL when webview is ready
  const loadUrlInWebview = (webview, urlToLoad) => {
    if (!webview || !urlToLoad) return;
    
    console.log('Loading URL in webview:', urlToLoad, 'for tab:', tabId);
    lastLoadedUrl.current = urlToLoad;
    
    try {
      webview.loadURL(urlToLoad);
    } catch (error) {
      console.error('Error loading URL:', error);
    }
  };

  useEffect(() => {
    const webview = webviewRef.current;
    if (!webview) {
      console.log('Webview ref not ready yet for tab:', tabId);
      return;
    }

    console.log('Setting up webview event listeners for tab:', tabId);

    // Wait for webview to be ready
    const handleDomReady = () => {
      console.log('✅ Webview DOM ready for tab:', tabId, 'URL:', url);
      isReadyRef.current = true;
    };

    webview.addEventListener('dom-ready', handleDomReady);

    /** 🛠 Event handlers */
    const handleDidNavigate = (e) => {
      if (onNavigate && e.url !== url) onNavigate(tabId, e.url);
    };

    const handleDidNavigateInPage = (e) => {
      if (e.isMainFrame && onNavigate && e.url !== url) onNavigate(tabId, e.url);
    };

    const handleDidStartLoading = () => {
      if (onLoadStart) onLoadStart();
      simulateProgress();
    };

    const handleDidStopLoading = () => {
      if (onLoadProgress) onLoadProgress(100);
      if (onLoadStop) onLoadStop();
      webview
        .executeJavaScript('document.title')
        .then((title) => {
          if (title && onTitleUpdate) {
            onTitleUpdate(tabId, title);
            // Save to history
            saveToHistory(url, title);
          }
        })
        .catch(() => {});
    };

    const saveToHistory = async (url, title) => {
      try {
        await axios.post(`${API_URL}/api/data/history`, {
          url: url,
          title: title || 'Untitled',
          favicon: null
        });
      } catch (error) {
        console.error('Failed to save history:', error);
      }
    };

    const handlePageTitleUpdated = (e) => {
      if (e.title && onTitleUpdate) onTitleUpdate(tabId, e.title);
    };

    const handleDidFailLoad = (e) => {
      if (e.errorCode === -3) return; // Ignore ERR_ABORTED
      if (e.errorCode === -27) return; // Ignore ERR_BLOCKED_BY_CLIENT
      console.error('WebView failed to load:', {
        url: url,
        errorCode: e.errorCode,
        errorDescription: e.errorDescription,
        validatedURL: e.validatedURL
      });
      if (onLoadStop) onLoadStop();
    };

    // Note: new-window handling is done in main.cjs via setWindowOpenHandler
    // to avoid duplicate tab creation

    /** ⚡ Simulate progress bar */
    let progressInterval;
    const simulateProgress = () => {
      let progress = 10;
      progressInterval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress > 90) {
          clearInterval(progressInterval);
        }
        onLoadProgress?.(progress);
      }, 150);
    };

    /** 🧹 Cleanup */
    webview.addEventListener('did-navigate', handleDidNavigate);
    webview.addEventListener('did-navigate-in-page', handleDidNavigateInPage);
    webview.addEventListener('did-start-loading', handleDidStartLoading);
    webview.addEventListener('did-stop-loading', handleDidStopLoading);
    webview.addEventListener('did-fail-load', handleDidFailLoad);
    webview.addEventListener('page-title-updated', handlePageTitleUpdated);

    return () => {
      console.log('Cleaning up webview listeners for tab:', tabId);
      if (progressInterval) clearInterval(progressInterval);
      webview.removeEventListener('dom-ready', handleDomReady);
      webview.removeEventListener('did-navigate', handleDidNavigate);
      webview.removeEventListener('did-navigate-in-page', handleDidNavigateInPage);
      webview.removeEventListener('did-start-loading', handleDidStartLoading);
      webview.removeEventListener('did-stop-loading', handleDidStopLoading);
      webview.removeEventListener('did-fail-load', handleDidFailLoad);
      webview.removeEventListener('page-title-updated', handlePageTitleUpdated);
    };
  }, [tabId, url, onNavigate, onTitleUpdate, onLoadStart, onLoadProgress, onLoadStop]);

  return (
    <webview
      ref={webviewRef}
      src={url || 'about:blank'}
      className={className}
      style={style}
      allowpopups="true"
      partition="persist:webview"
      useragent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      webpreferences="contextIsolation=yes, nativeWindowOpen=yes, nodeIntegration=no, webSecurity=yes"
    />
  );
});

ElectronWebView.displayName = 'ElectronWebView';

export default ElectronWebView;
