import { useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

export default function Settings() {
  const { signOut } = useAuthActions();
  const navigate = useNavigate();
  const viewer = useQuery(api.users.viewer);

  async function handleSignOut() {
    await signOut();
    navigate("/login", { replace: true });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col">
        <TopBar showSearch={false} />
        <main className="p-8 max-w-2xl">
          <div className="mb-10">
            <p className="text-[0.6875rem] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-3">
              Settings
            </p>
            <h2 className="text-4xl font-headline font-light text-on-surface">Account</h2>
          </div>

          <div className="bg-surface-container rounded-xl p-6 mb-6">
            <p className="text-[0.6875rem] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-4">
              Signed in as
            </p>
            {viewer === undefined ? (
              <p className="text-sm text-on-surface-variant">Loading…</p>
            ) : (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center">
                  <span className="material-symbols-outlined text-on-primary-container">person</span>
                </div>
                <div>
                  {viewer?.name && (
                    <p className="text-sm font-medium text-on-surface">{viewer.name}</p>
                  )}
                  {viewer?.email && (
                    <p className="text-sm text-on-surface-variant">{viewer.email}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleSignOut}
            className="px-5 py-2.5 rounded-xl border border-error/40 text-error
                       text-[0.6875rem] font-bold uppercase tracking-wider
                       hover:bg-error-container/20 transition-colors"
          >
            Sign Out
          </button>
        </main>
      </div>
    </div>
  );
}
