import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";

interface Props {
  onClose: () => void;
  initialUrl?: string;
}

const CONTENT_TYPES = [
  { value: "", label: "Auto-detect" },
  { value: "article", label: "Article" },
  { value: "video", label: "Video" },
  { value: "podcast", label: "Podcast" },
  { value: "newsletter", label: "Newsletter" },
  { value: "tweet", label: "Tweet" },
] as const;

export default function AddContentModal({ onClose, initialUrl = "" }: Props) {
  const createItem = useMutation(api.items.create);
  const createTopic = useMutation(api.topics.create);
  const allTopics = useQuery(api.topics.list, {});

  const [url, setUrl] = useState(initialUrl);
  const [title, setTitle] = useState("");
  const [contentType, setContentType] = useState("");
  const [selectedTopicIds, setSelectedTopicIds] = useState<Id<"topics">[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleTopic(id: Id<"topics">) {
    setSelectedTopicIds((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  }

  async function handleAddTag(e: React.FormEvent) {
    e.preventDefault();
    const name = newTagInput.trim();
    if (!name) return;
    const topicId = await createTopic({ name });
    setSelectedTopicIds((prev) => [...prev, topicId]);
    setNewTagInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    setSaving(true);
    setError("");
    try {
      await createItem({
        url: url.trim(),
        title: title.trim() || undefined,
        contentType: (contentType as "article" | "video" | "podcast" | "newsletter" | "tweet") || undefined,
        topicIds: selectedTopicIds,
      });
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
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-surface-container-lowest rounded-2xl w-full max-w-lg mx-4 p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-headline font-light text-on-surface">Add to Library</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface transition-colors">
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
              Title (optional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave blank to fill in later"
              className="w-full px-4 py-2.5 bg-surface-container rounded-xl border border-outline-variant
                         text-sm text-on-surface placeholder:text-on-surface-variant/50
                         focus:outline-none focus:border-primary-container"
            />
          </div>

          <div>
            <label className="block text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant mb-1.5">
              Type
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full px-4 py-2.5 bg-surface-container rounded-xl border border-outline-variant
                         text-sm text-on-surface focus:outline-none focus:border-primary-container"
            >
              {CONTENT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant mb-1.5">
              Tags (optional)
            </label>

            {allTopics && allTopics.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {allTopics.map((t: Doc<"topics">) => {
                  const active = selectedTopicIds.includes(t._id);
                  return (
                    <button
                      key={t._id}
                      type="button"
                      onClick={() => toggleTopic(t._id)}
                      className={[
                        "px-3 py-1 rounded-full text-[0.6875rem] font-bold uppercase tracking-wider transition-colors",
                        active
                          ? "bg-primary-container text-on-primary-container"
                          : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
                      ].join(" ")}
                    >
                      {active && "✓ "}{t.name}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2">
              <input
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(e); } }}
                placeholder="Create new tag…"
                className="flex-1 px-3 py-1.5 text-sm bg-surface-container rounded-lg border border-outline-variant
                           focus:outline-none focus:border-primary-container text-on-surface placeholder:text-on-surface-variant/40"
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!newTagInput.trim()}
                className="px-3 py-1.5 bg-surface-container text-on-surface-variant rounded-lg text-[0.6875rem] font-bold uppercase tracking-wider hover:bg-surface-container-high disabled:opacity-40 transition-colors"
              >
                Add
              </button>
            </div>
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
                         disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? "Saving…" : "Save to Library"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
