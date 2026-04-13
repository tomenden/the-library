import { useConvexAuth } from "convex/react";
import { Navigate } from "react-router-dom";
import { SKIP_AUTH } from "../lib/devMocks";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated } = useConvexAuth();

  if (SKIP_AUTH) return <>{children}</>;

  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
