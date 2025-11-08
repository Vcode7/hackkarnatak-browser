import { WebPlugin } from '@capacitor/core';
import type { EmbeddedWebViewPlugin } from './EmbeddedWebView';

export class EmbeddedWebViewWeb extends WebPlugin implements EmbeddedWebViewPlugin {
  async create(): Promise<void> {
    console.log('EmbeddedWebView not supported on web');
  }

  async loadUrl(options: { url: string }): Promise<void> {
    console.log('Loading URL:', options.url);
    window.open(options.url, '_blank');
  }

  async goBack(): Promise<{ canGoBack: boolean }> {
    return { canGoBack: false };
  }

  async goForward(): Promise<{ canGoForward: boolean }> {
    return { canGoForward: false };
  }

  async reload(): Promise<void> {
    console.log('Reload not supported on web');
  }

  async destroy(): Promise<void> {
    console.log('Destroy not supported on web');
  }

  async show(): Promise<void> {
    console.log('Show not supported on web');
  }

  async hide(): Promise<void> {
    console.log('Hide not supported on web');
  }
}
