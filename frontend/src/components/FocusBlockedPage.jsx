export default function FocusBlockedPage({ url, reason, topic, onGoBack, onEndFocus }) {
  return (
    <div className="flex flex-col items-center justify-center h-full bg-gray-900 p-8 text-center">
      <div className="max-w-md space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="p-6 bg-purple-100 dark:bg-purple-900/30 rounded-full">
            <span className="text-6xl">🎯</span>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">
            Stay Focused!
          </h1>
          <p className="text-gray-400">
            This website was blocked by Focus Mode
          </p>
        </div>

        {/* Focus Topic */}
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Your current focus:</p>
          <p className="text-lg font-semibold text-purple-900 dark:text-purple-100">
            {topic}
          </p>
        </div>

        {/* Blocked URL */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <p className="text-xs text-gray-400 mb-2">Blocked URL:</p>
          <p className="text-sm font-mono break-all text-gray-200">{url}</p>
        </div>

        {/* Reason */}
        {reason && (
          <div className="flex items-start gap-3 bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg text-left">
            <span className="text-xl flex-shrink-0">⚠️</span>
            <div>
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">
                Why was this blocked?
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {reason}
              </p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <button
            onClick={onGoBack}
            className="w-full flex items-center justify-center gap-2 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            ← Go Back
          </button>
          
          <button
            onClick={onEndFocus}
            className="w-full py-3 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 transition-colors"
          >
            End Focus Session
          </button>
        </div>

        {/* Tip */}
        <div className="pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-400">
            💡 Tip: Add frequently used domains to your whitelist to avoid interruptions
          </p>
        </div>
      </div>
    </div>
  )
}
