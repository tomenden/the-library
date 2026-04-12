import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "../../convex/_generated/api";

interface Props {
  onClose: () => void;
  onSwitchToManual: (url: string) => void;
}

export default function SaveWithAIModal({ onClose, onSwitchToManual }: Props) {
  const ingestItem = useAction(api.actions.ingest.ingestItem);

  const [url, setUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [enrichmentFailed, setEnrichmentFailed] = useState(false);

  async function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const trimmedUrl = url.trim();
    if (!trimmedUrl) return;
    setSaving(true);
    setError("");
    setEnrichmentFailed(false);
    try {
      const result = await ingestItem({ url: trimmedUrl, notes: notes.trim() || undefined });
      if (result?.enrichmentFailed) {
        setEnrichmentFailed(true);
      } else {
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const trimmedUrl = url.trim();
  const displayUrl = trimmedUrl.length > 40 ? trimmedUrl.slice(0, 40) + "…" : trimmedUrl;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      onClick={(e) => {
        if (!saving && e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-surface-container-lowest rounded-2xl w-full max-w-md mx-4 p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container">
              auto_fix_high
            </span>
            <h2 className="text-xl font-headline font-light text-on-surface">
              Add with AI
            </h2>
          </div>
          {!saving && (
            <button
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface transition-colors"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>

        {saving ? (
          <div className="flex flex-col items-center justify-center py-8 gap-4">
            <span className="material-symbols-outlined text-5xl text-primary-container animate-pulse">
              auto_fix_high
            </span>
            <p className="font-headline font-light text-xl text-on-surface">
              Analysing content…
            </p>
            <p className="text-xs text-on-surface-variant truncate max-w-full">
              {displayUrl}
            </p>
            <p className="text-xs text-on-surface-variant/60">
              This usually takes a few seconds
            </p>
          </div>
        ) : enrichmentFailed ? (
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/60">
              cloud_off
            </span>
            <div className="text-center space-y-1">
              <p className="font-headline font-light text-xl text-on-surface">
                Analysis unavailable
              </p>
              <p className="text-sm text-on-surface-variant">
                The AI service couldn't process this link right now.
              </p>
            </div>

            <div className="w-full space-y-2 pt-2">
              <button
                onClick={() => handleSubmit()}
                className="w-full px-5 py-2.5 bg-primary-container text-on-primary-container rounded-xl
                           text-[0.6875rem] font-bold uppercase tracking-wider
                           flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
              >
                <span className="material-symbols-outlined text-[18px]">refresh</span>
                Try Again
              </button>
              <button
                onClick={() => onSwitchToManual(trimmedUrl)}
                className="w-full px-5 py-2.5 rounded-xl border border-outline-variant
                           text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant
                           flex items-center justify-center gap-2 hover:bg-surface-container transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                Add Manually
              </button>
              <button
                onClick={onClose}
                className="w-full px-5 py-2.5 rounded-xl
                           text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant/60
                           hover:text-on-surface-variant transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
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
                disabled={!url.trim()}
                className="flex-1 px-5 py-2.5 bg-primary-container text-on-primary-container rounded-xl
                           text-[0.6875rem] font-bold uppercase tracking-wider
                           flex items-center justify-center gap-2
                           disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                <span className="material-symbols-outlined text-[18px]">
                  auto_fix_high
                </span>
                Save
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
