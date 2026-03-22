import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props { children: ReactNode; }
interface State { error: Error | null; }

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Unhandled render error:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="error-boundary-page">
          <h2 className="error-boundary-title">Something went wrong</h2>
          <p className="error-boundary-msg">{this.state.error.message}</p>
          <button onClick={() => window.location.reload()}>Reload app</button>
        </div>
      );
    }
    return this.props.children;
  }
}
