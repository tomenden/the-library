import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";

export default function ApiKeys() {
  const keys = useQuery(api.apiKeys.list, {});
  const createKey = useMutation(api.apiKeys.create);
  const revokeKey = useMutation(api.apiKeys.revoke);

  const [name, setName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    try {
      const rawKey = await createKey({ name: name.trim() });
      setNewKey(rawKey);
      setName("");
    } finally {
      setCreating(false);
    }
  }

  async function handleCopy() {
    if (!newKey) return;
    await navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRevoke(id: Id<"apiKeys">) {
    if (!confirm("Revoke this key? Any LLM using it will lose access immediately.")) return;
    await revokeKey({ id });
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-48 flex-1 flex flex-col transition-all duration-300">
        <TopBar />
        <main className="px-4 md:px-8 pt-6 md:pt-8 pb-28 md:pb-8 max-w-2xl">
          <div className="mb-10">
            <p className="text-[0.6875rem] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-3">
              Settings
            </p>
            <h2 className="text-4xl font-headline font-light text-on-surface">API Keys</h2>
            <p className="mt-3 text-sm text-on-surface-variant leading-relaxed">
              Give an API key to your LLM so it can add items to your library. Keys are shown
              once on creation — store them safely.
            </p>
            <p className="mt-2 text-sm text-on-surface-variant leading-relaxed">
              Point your LLM to the{" "}
              <a
                href="/llm-api.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-container underline underline-offset-2 hover:opacity-80"
              >
                API documentation
              </a>
              {" "}to get started. Or install the{" "}
              <a
                href="/the-library/SKILL.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-container underline underline-offset-2 hover:opacity-80"
              >
                Claude skill
              </a>
              {" "}so Claude can save things for you automatically.
            </p>
          </div>

          {/* New key banner */}
          {newKey && (
            <div className="mb-8 p-4 bg-surface-container rounded-xl border border-outline-variant">
              <p className="text-[0.6875rem] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-2">
                New key — copy it now, it won't be shown again
              </p>
              <div className="flex items-center gap-3">
                <code className="flex-1 text-sm font-mono text-on-surface bg-surface p-2 rounded-lg overflow-x-auto">
                  {newKey}
                </code>
                <button
                  onClick={handleCopy}
                  className="shrink-0 px-4 py-2 bg-primary-container text-on-primary-container rounded-lg text-[0.6875rem] font-bold uppercase tracking-wider"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <button
                onClick={() => setNewKey(null)}
                className="mt-3 text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant hover:text-on-surface"
              >
                Dismiss
              </button>
            </div>
          )}

          {/* Create form */}
          <form onSubmit={handleCreate} className="mb-10 flex gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='Key name, e.g. "My Claude"'
              className="flex-1 px-4 py-2.5 bg-surface-container rounded-xl border border-outline-variant
                         text-sm text-on-surface placeholder:text-on-surface-variant/50
                         focus:outline-none focus:border-primary-container"
            />
            <button
              type="submit"
              disabled={!name.trim() || creating}
              className="px-5 py-2.5 bg-primary-container text-on-primary-container rounded-xl
                         text-[0.6875rem] font-bold uppercase tracking-wider
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Generate
            </button>
          </form>

          {/* Keys list */}
          {keys === undefined && (
            <p className="text-sm text-on-surface-variant">Loading…</p>
          )}

          {keys?.length === 0 && (
            <p className="text-sm text-on-surface-variant">No API keys yet.</p>
          )}

          <ul className="space-y-3">
            {keys?.map((key) => (
              <li
                key={key._id}
                className="flex items-center justify-between p-4 bg-surface-container rounded-xl"
              >
                <div>
                  <p className="text-sm font-medium text-on-surface">{key.name}</p>
                  <p className="text-[0.6875rem] text-on-surface-variant mt-0.5">
                    Created {new Date(key._creationTime).toLocaleDateString()}
                    {key.lastUsedAt &&
                      ` · Last used ${new Date(key.lastUsedAt).toLocaleDateString()}`}
                  </p>
                </div>
                <button
                  onClick={() => handleRevoke(key._id)}
                  className="text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant
                             hover:text-error transition-colors"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
