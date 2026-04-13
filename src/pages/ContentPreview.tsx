import { useState, useRef, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Doc, Id } from "../../convex/_generated/dataModel";
import TagChip from "../components/TagChip";
import BottomNav from "../components/BottomNav";
import { SKIP_AUTH, getMockItem, MOCK_TOPICS } from "../lib/devMocks";

export default function ContentPreview() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const rawItem = useQuery(api.items.get, SKIP_AUTH ? "skip" : id ? { id: id as Id<"items"> } : "skip");
  const rawTopics = useQuery(api.topics.list, SKIP_AUTH ? "skip" : {});
  const item = SKIP_AUTH ? getMockItem(id ?? "") : rawItem;
  const allTopics = SKIP_AUTH ? MOCK_TOPICS : rawTopics;

  const [newNote, setNewNote] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [isReEnriching, setIsReEnriching] = useState(false);
  const [reEnrichError, setReEnrichError] = useState("");
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [newTagInput, setNewTagInput] = useState("");
  // Two refs so both mobile and desktop tag pickers get their own DOM node
  const tagPickerMobileRef = useRef<HTMLDivElement>(null);
  const tagPickerDesktopRef = useRef<HTMLDivElement>(null);

  const reEnrich = useAction(api.actions.ingest.reEnrich);
  const toggleFavorite = useMutation(api.items.toggleFavorite);
  const addNote = useMutation(api.items.addNote);
  const deleteNote = useMutation(api.items.deleteNote);
  const removeItem = useMutation(api.items.remove);
  const updateItem = useMutation(api.items.update);
  const createTopic = useMutation(api.topics.create);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const inMobile = tagPickerMobileRef.current?.contains(target);
      const inDesktop = tagPickerDesktopRef.current?.contains(target);
      if (!inMobile && !inDesktop) setShowTagPicker(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function handleReEnrich() {
    if (!id || isReEnriching) return;
    setIsReEnriching(true);
    setReEnrichError("");
    try {
      await reEnrich({ id: id as Id<"items"> });
    } catch (err) {
      setReEnrichError(err instanceof Error ? err.message : "Enrichment failed");
    } finally {
      setIsReEnriching(false);
    }
  }

  async function handleMarkDone() {
    if (!item || !id) return;
    const newStatus = item.status === "done" ? "saved" : "done";
    await updateItem({ id: id as Id<"items">, status: newStatus });
  }

  async function handleToggleFavorite() {
    if (!id) return;
    await toggleFavorite({ id: id as Id<"items"> });
  }

  async function handleDelete() {
    if (!id || isDeleting) return;
    if (!confirm("Delete this item from your library?")) return;
    setIsDeleting(true);
    try {
      await removeItem({ id: id as Id<"items"> });
      navigate("/");
    } finally {
      setIsDeleting(false);
    }
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    const text = newNote.trim();
    if (!text || !id) return;
    await addNote({ id: id as Id<"items">, text });
    setNewNote("");
  }

  async function handleDeleteNote(index: number) {
    if (!id) return;
    await deleteNote({ id: id as Id<"items">, index });
  }

  async function handleToggleTag(topicId: Id<"topics">) {
    if (!item || !id) return;
    const current = item.topicIds;
    const next = current.includes(topicId)
      ? current.filter((t: Id<"topics">) => t !== topicId)
      : [...current, topicId];
    await updateItem({ id: id as Id<"items">, topicIds: next });
  }

  async function handleCreateTag(e: React.FormEvent) {
    e.preventDefault();
    const name = newTagInput.trim();
    if (!name || !item || !id) return;
    const topicId = await createTopic({ name });
    await updateItem({ id: id as Id<"items">, topicIds: [...item.topicIds, topicId] });
    setNewTagInput("");
  }

  const [relatedItems, setRelatedItems] = useState<any[] | null>(null);
  const runMoreLikeThis = useAction(api.search.moreLikeThis);
  useEffect(() => {
    if (!id) return;
    runMoreLikeThis({ id: id as Id<"items"> })
      .then(setRelatedItems)
      .catch(() => setRelatedItems([]));
  }, [id, runMoreLikeThis]);

  const itemTopics =
    item && allTopics
      ? allTopics.filter((t: Doc<"topics">) => item.topicIds.includes(t._id))
      : [];

  const notesList = item?.notesList ?? (item?.notes ? [item.notes] : []);

  if (!item) {
    return (
      <div className="flex min-h-screen bg-background items-center justify-center">
        <span className="material-symbols-outlined animate-spin text-on-surface-variant">
          progress_activity
        </span>
      </div>
    );
  }

  const savedDaysAgo = `Saved ${Math.floor((Date.now() - item._creationTime) / 86400000)} days ago`;

  const consumedLabel =
    item.contentType === "video"
      ? "Mark as Watched"
      : item.contentType === "podcast"
        ? "Mark as Listened"
        : "Mark as Read";

  const consumedPastLabel =
    item.contentType === "video" ? "Watched" : item.contentType === "podcast" ? "Listened" : "Read";

  // Renders the tag picker panel — accepts a ref so each layout gets its own DOM node
  function renderTagsSection(ref: React.RefObject<HTMLDivElement | null>) {
    return (
      <div className="bg-surface-container-lowest rounded-xl p-5 editorial-shadow" ref={ref}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant">Tags</p>
          <button
            onClick={() => setShowTagPicker((v) => !v)}
            className="text-[0.6875rem] font-bold tracking-widest uppercase text-primary-container hover:underline"
          >
            {showTagPicker ? "Done" : "Add"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {itemTopics.map((t: Doc<"topics">) => <TagChip key={t._id} label={t.name} />)}
          {itemTopics.length === 0 && !showTagPicker && (
            <p className="text-sm text-on-surface-variant/60">No tags yet.</p>
          )}
        </div>

        {showTagPicker && (
          <div className="mt-4 space-y-3">
            {allTopics && allTopics.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {allTopics.map((t: Doc<"topics">) => {
                  const active = item!.topicIds.includes(t._id);
                  return (
                    <button
                      key={t._id}
                      onClick={() => handleToggleTag(t._id)}
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
            <form onSubmit={handleCreateTag} className="flex gap-2">
              <input
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                placeholder="New tag name…"
                className="flex-1 px-3 py-1.5 text-sm bg-surface-container rounded-lg border border-outline-variant
                           focus:outline-none focus:border-primary-container text-on-surface placeholder:text-on-surface-variant/40"
              />
              <button
                type="submit"
                disabled={!newTagInput.trim()}
                className="px-3 py-1.5 bg-primary-container text-on-primary-container rounded-lg text-[0.6875rem] font-bold uppercase tracking-wider disabled:opacity-40"
              >
                Add
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  const enrichmentFailed = item.enrichmentStatus === "failed";

  const EnrichmentBanner = enrichmentFailed ? (
    <div className="flex items-center gap-3 p-4 bg-surface-container rounded-xl border border-outline-variant/30">
      <span className="material-symbols-outlined text-on-surface-variant">info</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-on-surface">
          AI analysis didn't complete for this item.
        </p>
        {reEnrichError && (
          <p className="text-xs text-error mt-1">{reEnrichError}</p>
        )}
      </div>
      <button
        onClick={handleReEnrich}
        disabled={isReEnriching}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-container text-on-primary-container rounded-lg
                   text-[0.6875rem] font-bold uppercase tracking-wider whitespace-nowrap
                   disabled:opacity-50 transition-opacity"
      >
        <span className={`material-symbols-outlined text-[16px] ${isReEnriching ? "animate-spin" : ""}`}>
          {isReEnriching ? "progress_activity" : "auto_fix_high"}
        </span>
        {isReEnriching ? "Analysing…" : "Retry"}
      </button>
    </div>
  ) : null;

  const NotesSection = (
    <div className="bg-surface-container-lowest rounded-xl p-5 editorial-shadow">
      <p className="text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant mb-3">Notes</p>
      {notesList.length > 0 && (
        <ul className="space-y-2 mb-3">
          {notesList.map((note: string, i: number) => (
            <li key={i} className="flex items-start gap-2 group">
              <p className="flex-1 text-sm text-on-surface leading-relaxed">{note}</p>
              <button
                onClick={() => handleDeleteNote(i)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-on-surface-variant hover:text-error mt-0.5"
                title="Delete note"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <form onSubmit={handleAddNote} className="flex gap-2">
        <input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Add a note…"
          className="flex-1 px-3 py-1.5 text-sm bg-surface-container rounded-lg border border-outline-variant
                     focus:outline-none focus:border-primary-container text-on-surface placeholder:text-on-surface-variant/40"
        />
        <button
          type="submit"
          disabled={!newNote.trim()}
          className="px-3 py-1.5 bg-primary-container text-on-primary-container rounded-lg text-[0.6875rem] font-bold uppercase tracking-wider disabled:opacity-40"
        >
          Add
        </button>
      </form>
    </div>
  );

  const RelatedSection = relatedItems && relatedItems.length > 0 ? (
    <div className="bg-surface-container-lowest rounded-xl p-5 editorial-shadow">
      <p className="text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-base">auto_awesome</span>
        More like this
      </p>
      <div className="flex flex-col gap-3">
        {relatedItems.map((related) => (
          <button
            key={related._id}
            onClick={() => navigate(`/preview/${related._id}`)}
            className="text-left group flex items-start gap-3 p-3 rounded-lg hover:bg-surface-container transition-colors"
          >
            {related.imageUrl && (
              <img src={related.imageUrl} alt="" className="w-12 h-12 rounded-md object-cover flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium text-on-surface line-clamp-2 group-hover:text-primary-container transition-colors">
                {related.title ?? "Untitled"}
              </p>
              {related.sourceName && (
                <p className="text-[0.6rem] font-bold uppercase tracking-widest text-on-surface-variant/60 mt-0.5">
                  {related.sourceName}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 h-14 bg-background/80 backdrop-blur-2xl border-b border-outline-variant/20">
        <button
          className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors text-[0.6875rem] font-bold tracking-widest uppercase"
          onClick={() => navigate(-1)}
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span className="hidden sm:inline">Back</span>
        </button>
        <span className="font-headline italic text-lg text-primary-container md:hidden tracking-tight">
          The Library
        </span>
        <span className="hidden md:flex items-center gap-1.5 text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant">
          <span className="material-symbols-outlined text-[16px]">save</span>
          {savedDaysAgo}
        </span>
        <button
          onClick={handleToggleFavorite}
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors"
          aria-label={item.isFavorite ? "Remove from favorites" : "Add to favorites"}
        >
          <span
            className="material-symbols-outlined text-[22px] text-on-surface-variant"
            style={{ fontVariationSettings: item.isFavorite ? "'FILL' 1" : "'FILL' 0" }}
          >
            star
          </span>
        </button>
      </header>

      {/* ── MOBILE LAYOUT ── */}
      <div className="md:hidden max-w-md mx-auto px-4 pb-28">
        {item.imageUrl && (
          <div className="mt-4 rounded-xl overflow-hidden aspect-[4/3] relative">
            <img className="w-full h-full object-cover" src={item.imageUrl} alt={item.title ?? ""} />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        )}

        <div className="mt-5 space-y-3">
          <p className="text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant/60">
            {item.sourceName ?? "Article"}
          </p>
          <h1 className="text-3xl font-headline italic font-light text-on-surface leading-tight">
            {item.title ?? "Untitled"}
          </h1>
          <p className="text-xs text-on-surface-variant">
            {new Date(item._creationTime).toLocaleDateString()}
          </p>
        </div>

        {item.summary && (
          <p className="mt-4 text-sm text-on-surface-variant leading-relaxed border-l-4 border-primary-fixed-dim pl-4">
            {item.summary}
          </p>
        )}

        {EnrichmentBanner && <div className="mt-4">{EnrichmentBanner}</div>}

        <a
          href={item.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 w-full signature-gradient text-on-primary py-4 rounded-xl font-medium tracking-wide flex items-center justify-center gap-2 shadow-sm hover:opacity-90 transition-opacity"
        >
          Open Original Source
          <span className="material-symbols-outlined text-sm">open_in_new</span>
        </a>

        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={handleMarkDone}
            className={[
              "flex flex-col items-center justify-center p-4 rounded-xl gap-1 transition-colors",
              item.status === "done"
                ? "bg-primary-container/20 text-primary-container"
                : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high",
            ].join(" ")}
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: item.status === "done" ? "'FILL' 1" : "'FILL' 0" }}
            >
              check_circle
            </span>
            <span className="text-[10px] font-bold tracking-widest uppercase">
              {item.status === "done" ? consumedPastLabel : consumedLabel.replace("Mark as ", "")}
            </span>
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex flex-col items-center justify-center p-4 bg-error-container/20 text-error rounded-xl gap-1 hover:bg-error-container/40 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined">delete</span>
            <span className="text-[10px] font-bold tracking-widest uppercase">
              {isDeleting ? "Deleting…" : "Delete"}
            </span>
          </button>
        </div>

        <div className="mt-6">{renderTagsSection(tagPickerMobileRef)}</div>
        <div className="mt-4">{NotesSection}</div>
        {RelatedSection && <div className="mt-4">{RelatedSection}</div>}
      </div>

      {/* ── DESKTOP LAYOUT ── */}
      <div className="hidden md:block max-w-5xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-16">
          <article>
            <p className="text-[0.6875rem] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-4">
              {item.sourceName ?? "Article"}
            </p>
            <h1 className="text-4xl md:text-5xl font-headline font-light text-on-surface leading-tight mb-8">
              {item.title ?? "Untitled"}
            </h1>

            <div className="flex flex-wrap gap-8 mb-10">
              {item.sourceName && (
                <div>
                  <p className="text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant/60 mb-1">Publication</p>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-on-surface-variant">language</span>
                    <span className="text-sm font-medium text-on-surface uppercase tracking-wider">{item.sourceName}</span>
                  </div>
                </div>
              )}
              <div>
                <p className="text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant/60 mb-1">Saved</p>
                <span className="text-sm font-medium text-on-surface">{new Date(item._creationTime).toLocaleDateString()}</span>
              </div>
            </div>

            {item.imageUrl && (
              <div className="rounded-xl overflow-hidden mb-10 aspect-video">
                <img className="w-full h-full object-cover" src={item.imageUrl} alt={item.title ?? ""} />
              </div>
            )}

            {item.summary && (
              <blockquote className="my-10 px-0">
                <p className="text-lg font-headline italic text-on-surface-variant leading-relaxed border-l-4 border-primary-fixed-dim pl-6">
                  {item.summary}
                </p>
              </blockquote>
            )}

            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-12 flex items-center gap-2 text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface hover:text-primary-container transition-colors border-b border-on-surface/30 pb-0.5 w-fit"
            >
              Open Original Source
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
            </a>
          </article>

          <aside className="space-y-6">
            {EnrichmentBanner}

            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between p-4 signature-gradient text-on-primary rounded-xl group hover:opacity-90 transition-opacity"
            >
              <div>
                <p className="text-[0.6875rem] font-bold tracking-widest uppercase opacity-70 mb-1">Source</p>
                <p className="font-medium truncate max-w-[200px]">{item.url}</p>
              </div>
              <span className="material-symbols-outlined">open_in_new</span>
            </a>

            {renderTagsSection(tagPickerDesktopRef)}
            {NotesSection}

            <div className="bg-surface-container-lowest rounded-xl editorial-shadow divide-y divide-outline-variant/20">
              <button
                onClick={handleMarkDone}
                className="w-full flex items-center gap-3 px-5 py-4 text-on-surface hover:bg-surface-container-low transition-colors rounded-t-xl text-left"
              >
                <span
                  className="material-symbols-outlined text-primary-container"
                  style={{ fontVariationSettings: item.status === "done" ? "'FILL' 1" : "'FILL' 0" }}
                >
                  check_circle
                </span>
                <span className="text-sm font-medium">
                  {item.status === "done" ? consumedPastLabel : consumedLabel}
                </span>
              </button>
              <button
                onClick={handleToggleFavorite}
                className="w-full flex items-center gap-3 px-5 py-4 text-on-surface hover:bg-surface-container-low transition-colors text-left"
              >
                <span
                  className="material-symbols-outlined text-on-surface-variant"
                  style={{ fontVariationSettings: item.isFavorite ? "'FILL' 1" : "'FILL' 0" }}
                >
                  star
                </span>
                <span className="text-sm font-medium">
                  {item.isFavorite ? "Saved to Favorites" : "Save to Favorites"}
                </span>
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="w-full flex items-center gap-3 px-5 py-4 text-error hover:bg-error-container/20 transition-colors rounded-b-xl text-left disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-error">delete</span>
                <span className="text-sm font-medium">{isDeleting ? "Deleting…" : "Delete from Library"}</span>
              </button>
            </div>

            {RelatedSection}
          </aside>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
