import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

interface Props {
  onClose: () => void;
}

export default function SaveWithAIModal({ onClose }: Props) {
  const ingestItem = useAction(api.actions.ingest.ingestItem);

  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setSaving(true);
    setError("");
    try {
      await ingestItem({ url: url.trim(), notes: notes.trim() || undefined });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md mx-4 p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">
              auto_fix_high
            </span>
            <h2 className="text-xl font-headline font-light text-on-surface">
              Save with AI
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant mb-1.5">
              URL *
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              required
              autoFocus
              className="w-full px-4 py-2.5 bg-surface-container rounded-xl border border-outline-variant
                         text-sm text-on-surface placeholder:text-on-surface-variant/50
                         focus:outline-none focus:border-primary-container"
            />
          </div>

          <div>
            <label className="block text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant mb-1.5">
              Notes (optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a personal note…"
              className="w-full px-4 py-2.5 bg-surface-container rounded-xl border border-outline-variant
                         text-sm text-on-surface placeholder:text-on-surface-variant/50
                         focus:outline-none focus:border-primary-container"
            />
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-5 py-2.5 rounded-xl border border-outline-variant
                         text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant
                         hover:bg-surface-container transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!url.trim() || saving}
              className="flex-1 px-5 py-2.5 bg-primary-container text-on-primary-container rounded-xl
                         text-[0.6875rem] font-bold uppercase tracking-wider
                         flex items-center justify-center gap-2
                         disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            >
              {saving ? (
                <>
                  <span className="material-symbols-outlined text-[18px] animate-spin">
                    progress_activity
                  </span>
                  Saving…
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">
                    auto_fix_high
                  </span>
                  Save
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
