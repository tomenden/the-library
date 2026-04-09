import { useConvexAuth } from "convex/react";
import { Navigate } from "react-router-dom";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-on-surface-variant">
          progress_activity
        </span>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
