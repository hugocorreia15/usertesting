import { Component, type ErrorInfo, type ReactNode } from "react";
import { SkaterGame } from "@/components/layout/skater-game";
import { captureError } from "@/lib/monitoring";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureError(error, {
      component_stack: info.componentStack?.slice(0, 400) ?? "",
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <SkaterGame
          title="Oops!"
          message={this.state.error?.message || "An unexpected error occurred."}
          onRetry={() => this.setState({ hasError: false, error: null })}
        />
      );
    }
    return this.props.children;
  }
}
