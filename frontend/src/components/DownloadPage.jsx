import { Download, Monitor, Smartphone, Chrome } from 'lucide-react';
import { getOS, isMobile } from '../utils/platform';

function DownloadPage() {
  const os = getOS();
  const mobile = isMobile();

  const downloads = {
    windows: {
      icon: Monitor,
      title: 'Windows',
      description: 'Download for Windows 10/11',
      link: '#',
      filename: 'lernova-Setup.exe'
    },
    macos: {
      icon: Monitor,
      title: 'macOS',
      description: 'Download for macOS 10.15+',
      link: '#',
      filename: 'lernova.dmg'
    },
    linux: {
      icon: Monitor,
      title: 'Linux',
      description: 'Download AppImage',
      link: '#',
      filename: 'lernova.AppImage'
    },
    android: {
      icon: Smartphone,
      title: 'Android',
      description: 'Download APK',
      link: 'E:\hackkarnatak\frontend\android\app\build\outputs\apk\androidTest\debug\app-debug-androidTest.apk',
      filename: 'app-debug-androidTest.apk'
    },
    ios: {
      icon: Smartphone,
      title: 'iOS',
      description: 'Coming soon to App Store',
      link: '#',
      disabled: true
    }
  };

  const recommendedDownload = mobile 
    ? (os === 'android' ? downloads.android : downloads.ios)
    : (downloads[os] || downloads.windows);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <Chrome className="w-16 h-16 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AiChat Browser
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            GenAI-powered browser with voice commands and AI assistant. 
            Download the desktop or mobile app for the best experience.
          </p>
        </div>

        {/* Recommended Download */}
        <div className="max-w-2xl mx-auto mb-12">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border-2 border-blue-500">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-xl">
                  {recommendedDownload.icon && <recommendedDownload.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {recommendedDownload.title}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400">
                    {recommendedDownload.description}
                  </p>
                </div>
              </div>
              <div className="text-sm text-blue-600 dark:text-blue-400 font-semibold">
                Recommended
              </div>
            </div>
            
            {recommendedDownload.disabled ? (
              <button
                disabled
                className="w-full py-4 px-6 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl font-semibold text-lg cursor-not-allowed"
              >
                Coming Soon
              </button>
            ) : (
              <a
                href={recommendedDownload.link}
                className="block w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold text-lg text-center transition-all transform hover:scale-105 shadow-lg"
              >
                <div className="flex items-center justify-center gap-3">
                  <Download className="w-6 h-6" />
                  <span>Download for {recommendedDownload.title}</span>
                </div>
              </a>
            )}
          </div>
        </div>

        {/* All Downloads */}
        <div className="max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            All Platforms
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            {Object.entries(downloads).map(([key, download]) => {
              const Icon = download.icon;
              return (
                <div
                  key={key}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                      <Icon className="w-6 h-6 text-gray-700 dark:text-gray-300" />
                    </div>
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {download.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {download.description}
                      </p>
                    </div>
                  </div>
                  {download.disabled ? (
                    <button
                      disabled
                      className="w-full py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg font-medium cursor-not-allowed"
                    >
                      Coming Soon
                    </button>
                  ) : (
                    <a
                      href={download.link}
                      className="block w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium text-center transition-colors"
                    >
                      Download
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto mt-16">
          <h3 className="text-2xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            Features
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Chrome className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Built-in Browser</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Full-featured web browser with modern capabilities
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Monitor className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">AI Assistant</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Powered by GenAI for intelligent browsing assistance
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Voice Commands</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Control your browser with natural voice commands
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 text-gray-600 dark:text-gray-400">
          <p className="text-sm">
            Web version is not available. Please download the desktop or mobile app.
          </p>
        </div>
      </div>
    </div>
  );
}

export default DownloadPage;
