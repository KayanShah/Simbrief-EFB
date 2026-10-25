import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

// still has to be a class, react doesnt let you do this with hooks
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('EFB crashed:', error, info.componentStack)
  }

  render() {
    if (!this.state.hasError) return this.props.children

    return (
      <div className="crash-panel" role="alert">
        <h1>Something went wrong</h1>
        <p>The flight bag hit an unexpected error. Reloading usually fixes it, and your User ID is remembered.</p>
        <button className="btn btn-primary" type="button" onClick={() => window.location.reload()}>
          Reload
        </button>
      </div>
    )
  }
}
