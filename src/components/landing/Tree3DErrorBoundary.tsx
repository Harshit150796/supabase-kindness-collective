import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Local boundary around the 3D hero scene. If Three.js / WebGL fails
 * (unsupported context, driver crash, GLB parse error), swallow the error
 * so the rest of the page keeps rendering — the gradient layer underneath
 * <Tree3DScene /> stays visible as the visual fallback.
 */
export class Tree3DErrorBoundary extends Component<Props, State> {
  public state: State = { hasError: false };

  public static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[Tree3DErrorBoundary] 3D hero failed, falling back:', error, info);
  }

  public render() {
    if (this.state.hasError) return this.props.fallback ?? null;
    return this.props.children;
  }
}
