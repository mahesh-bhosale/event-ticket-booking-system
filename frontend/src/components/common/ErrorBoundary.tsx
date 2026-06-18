import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Alert, AlertTitle, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public override render() {
    if (this.state.hasError) {
      const isDev = import.meta.env['DEV'];
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6">
          <div className="max-w-xl w-full space-y-6">
            <Alert variant="destructive" className="border border-destructive/20 shadow-md">
              <AlertTitle className="text-lg font-bold">Something went wrong 😭</AlertTitle>
              <AlertDescription className="mt-2 text-sm">
                An unexpected rendering error occurred. Please try reloading the application.
              </AlertDescription>
            </Alert>
            
            {isDev && this.state.error && (
              <div className="bg-muted border rounded-md p-4 text-xs font-mono overflow-auto max-h-[300px] whitespace-pre-wrap">
                <p className="font-bold text-destructive mb-2">{this.state.error.toString()}</p>
                <p>{this.state.error.stack}</p>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => { window.location.href = '/'; }}>
                Go Home
              </Button>
              <Button onClick={this.handleRetry}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
