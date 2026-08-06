"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * Catches errors thrown while mounting/rendering the R3F tree (e.g. a WebGL
 * context creation failure that throws synchronously) and shows a friendly
 * fallback instead of leaving a half-mounted, permanently blank canvas.
 *
 * Caveat: this cannot catch a hard GPU-process crash — those kill the whole
 * tab before any JS runs, so there's nothing for React to catch. That case
 * is mitigated instead by keeping the scene's GPU cost modest (see
 * EditorCanvas's dpr/shadow settings) and by the hasWebGLSupport() preflight
 * check that runs before this boundary ever mounts a real canvas.
 */
export class CanvasErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("3D canvas failed to render:", error);
  }

  render() {
    if (this.state.hasError) {
      return <CanvasFallback message="The 3D view crashed while rendering." />;
    }
    return this.props.children;
  }
}

export function CanvasFallback({ message }: { message: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-zinc-950 px-6 text-center">
      <p className="text-sm text-zinc-300">{message}</p>
      <p className="max-w-sm text-xs text-zinc-500">
        This usually means WebGL isn&apos;t available — try enabling hardware acceleration in your
        browser&apos;s settings, updating your graphics drivers, or switching browsers.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-1 rounded-md bg-emerald-500 px-4 py-2 text-xs font-semibold text-zinc-950 hover:bg-emerald-400"
      >
        Reload
      </button>
    </div>
  );
}
