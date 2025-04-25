import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("Component Error:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return (
        <div className="p-4 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">
            Something went wrong
          </h2>
          <p className="text-sm text-red-600 dark:text-red-300 mt-1">
            <strong>Error:</strong>{" "}
            {this.state.error && this.state.error.message}
          </p>
          {this.state.error && this.state.error.stack && (
            <details className="mt-2">
              <summary className="text-sm font-medium text-red-600 dark:text-red-300 cursor-pointer">
                Stack trace
              </summary>
              <pre className="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded overflow-auto text-xs text-red-800 dark:text-red-200 max-h-48">
                {this.state.error.stack}
              </pre>
            </details>
          )}
          <div className="mt-4 flex space-x-3">
            <button
              onClick={() => this.setState({ hasError: false })}
              className="px-3 py-1 text-sm bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 rounded hover:bg-red-200 dark:hover:bg-red-700"
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
            >
              Reload page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
