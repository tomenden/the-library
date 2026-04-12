import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useAction } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { useSidebar } from "../contexts/SidebarContext";

type SearchMode = "keyword" | "semantic";

export default function SearchDiscovery() {
  const [q, setQ] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<Id<"topics"> | undefined>();
  const [mode, setMode] = useState<SearchMode>("keyword");
  const [semanticResults, setSemanticResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const { collapsed } = useSidebar();
  const topics = useQuery(api.topics.list, {});
  const keywordResults = useQuery(api.items.list, {
    q: mode === "keyword" ? (q.trim() || undefined) : undefined,
    topicId: selectedTopicId,
  });

  const runSemanticSearch = useAction(api.search.semanticSearch);

  useEffect(() => {
    if (mode !== "semantic") return;
    if (!q.trim()) { setSemanticResults(null); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await runSemanticSearch({ q: q.trim() });
        setSemanticResults(results as any[]);
      } catch {
        setSemanticResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 600);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q, mode]);

  function switchMode(newMode: SearchMode) {
    setMode(newMode);
    setSemanticResults(null);
    setIsSearching(false);
  }

  function toggleTopic(id: Id<"topics">) {
    setSelectedTopicId((prev) => (prev === id ? undefined : id));
  }

  const results = mode === "semantic" ? semanticResults : keywordResults;
  const isLoading = mode === "semantic" ? isSearching : results === undefined;
  const hasFilter = !!q.trim() || !!selectedTopicId;

  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      <Sidebar />
      {/* min-w-0 prevents flex child from overflowing its container */}
      <div className={`${collapsed ? 'md:ml-16' : 'md:ml-64'} flex-1 min-w-0 flex flex-col transition-all duration-300`}>
        <TopBar showSearch={false} showBrandName />

        <main className="flex-1 min-w-0">
          <section className="w-full max-w-6xl mx-auto px-4 md:px-8 pt-6 md:pt-12 pb-28 md:pb-24">

            {/* Search bar */}
            <div className="flex flex-col items-center text-center mb-6 md:mb-12">
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-headline text-on-surface leading-tight mb-5 md:mb-8">
                Seek with <span className="italic font-light">Intent</span>
              </h1>
              <div className="relative w-full max-w-3xl">
                <span className="material-symbols-outlined absolute left-4 md:left-6 top-1/2 -translate-y-1/2 text-on-surface-variant text-xl md:text-2xl">
                  search
                </span>
                <input
                  className="w-full pl-12 md:pl-16 pr-10 py-3.5 md:py-6 bg-surface-container-lowest border-none rounded-2xl text-base md:text-xl font-sans placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 editorial-shadow transition-all"
                  placeholder={mode === "semantic" ? "Ask anything…" : "Search your library..."}
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                />
                {q && (
                  <button
                    onClick={() => { setQ(""); setSemanticResults(null); }}
                    className="absolute right-4 md:right-6 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>

              {/* Mode toggle */}
              <div className="flex items-center gap-1 mt-3 md:mt-4 bg-surface-container rounded-full p-1">
                <button
                  onClick={() => switchMode("keyword")}
                  className={[
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-colors",
                    mode === "keyword"
                      ? "bg-surface text-on-surface shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface",
                  ].join(" ")}
                >
                  Keyword
                </button>
                <button
                  onClick={() => switchMode("semantic")}
                  className={[
                    "px-4 py-1.5 rounded-full text-sm font-medium transition-colors flex items-center gap-1",
                    mode === "semantic"
                      ? "bg-surface text-on-surface shadow-sm"
                      : "text-on-surface-variant hover:text-on-surface",
                  ].join(" ")}
                >
                  <span className="material-symbols-outlined text-[14px]">auto_awesome</span>
                  Semantic
                </button>
              </div>
            </div>

            {/* Mobile: tag filter as horizontal scroll strip */}
            {mode === "keyword" && topics && topics.length > 0 && (
              <div className="flex md:hidden gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide">
                {topics.map((topic) => {
                  const active = selectedTopicId === topic._id;
                  return (
                    <button
                      key={topic._id}
                      onClick={() => toggleTopic(topic._id)}
                      className={[
                        "flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors",
                        active
                          ? "bg-primary-container text-on-primary-container"
                          : "bg-surface-container-high text-on-surface-variant",
                      ].join(" ")}
                    >
                      {topic.name}
                    </button>
                  );
                })}
                {selectedTopicId && (
                  <button
                    onClick={() => setSelectedTopicId(undefined)}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-error-container/30 text-error"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            {/* Desktop: sidebar + results layout */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 items-start">
              {/* Left: Tag filter (desktop only) */}
              <div className="hidden md:block md:col-span-3">
                {mode === "keyword" && (
                  <>
                    <h3 className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">label</span>
                      Filter by Tag
                    </h3>
                    {topics === undefined && (
                      <p className="text-sm text-on-surface-variant/60">Loading…</p>
                    )}
                    {topics?.length === 0 && (
                      <p className="text-sm text-on-surface-variant/60">No tags yet.</p>
                    )}
                    {topics && topics.length > 0 && (
                      <div className="flex flex-col gap-1">
                        {topics.map((topic) => {
                          const active = selectedTopicId === topic._id;
                          return (
                            <button
                              key={topic._id}
                              onClick={() => toggleTopic(topic._id)}
                              className={[
                                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-left transition-colors",
                                active
                                  ? "bg-primary-container text-on-primary-container font-medium"
                                  : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
                              ].join(" ")}
                            >
                              <span className="material-symbols-outlined text-[16px]">
                                {active ? "check" : "tag"}
                              </span>
                              {topic.name}
                            </button>
                          );
                        })}
                        {selectedTopicId && (
                          <button
                            onClick={() => setSelectedTopicId(undefined)}
                            className="mt-2 text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant hover:text-error transition-colors text-left px-3"
                          >
                            Clear filter
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}
                {mode === "semantic" && (
                  <div className="text-sm text-on-surface-variant/70 space-y-2">
                    <p className="flex items-start gap-2">
                      <span className="material-symbols-outlined text-base mt-0.5">info</span>
                      Search by meaning, not just keywords.
                    </p>
                    <p className="text-xs leading-relaxed opacity-70">
                      "What should I read about focus?" surfaces deep work, flow states, and productivity items.
                    </p>
                  </div>
                )}
              </div>

              {/* Results */}
              <div className="md:col-span-9 min-w-0">
                <div className="flex items-center justify-between mb-5 md:mb-6">
                  <h2 className="text-lg md:text-xl font-headline italic text-on-surface">
                    {mode === "semantic" && !q.trim() ? (
                      "Ask a question to explore your library"
                    ) : hasFilter ? (
                      <>
                        {isLoading ? "…" : results?.length ?? "…"} result{(!isLoading && results?.length !== 1) ? "s" : ""}
                        {mode === "keyword" && selectedTopicId && topics && (
                          <span className="text-on-surface-variant font-normal">
                            {" "}in <span className="text-primary-container">{topics.find((t) => t._id === selectedTopicId)?.name}</span>
                          </span>
                        )}
                        {q.trim() && (
                          <span className="text-on-surface-variant font-normal">
                            {" "}for <span className="text-primary-container">"{q.trim()}"</span>
                          </span>
                        )}
                      </>
                    ) : (
                      "All Items"
                    )}
                  </h2>
                </div>

                {isLoading && q.trim() && (
                  <div className="flex justify-center py-16">
                    <span className="material-symbols-outlined animate-spin text-on-surface-variant">
                      progress_activity
                    </span>
                  </div>
                )}

                {!isLoading && results !== null && results !== undefined && results.length === 0 && (
                  <div className="text-center py-16">
                    <p className="text-on-surface-variant text-sm">
                      {hasFilter ? "No items match." : "Your library is empty."}
                    </p>
                  </div>
                )}

                {!isLoading && results && results.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
                    {results.map((item) => (
                      <article
                        key={item._id}
                        className="group bg-surface-container-low rounded-xl overflow-hidden flex flex-col cursor-pointer hover:bg-surface-container transition-colors"
                        onClick={() => navigate(`/preview/${item._id}`)}
                      >
                        {item.imageUrl && (
                          <div className="aspect-video overflow-hidden">
                            <img
                              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                              src={item.imageUrl}
                              alt={item.title ?? ""}
                            />
                          </div>
                        )}
                        <div className="p-4 flex flex-col flex-grow">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant/60 truncate mr-2">
                              {item.sourceName ?? ""}
                            </p>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {mode === "semantic" && item._score !== undefined && (
                                <span
                                  className="text-[0.6rem] font-bold uppercase tracking-widest text-primary-container/70"
                                  title={`Relevance: ${Math.round(item._score * 100)}%`}
                                >
                                  {item._score > 0.85 ? "●●●" : item._score > 0.7 ? "●●○" : "●○○"}
                                </span>
                              )}
                              {item.contentType && (
                                <span className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded text-[0.6rem] font-bold uppercase tracking-widest">
                                  {item.contentType}
                                </span>
                              )}
                            </div>
                          </div>
                          <h3 className="text-base font-headline mb-2 group-hover:text-primary-container transition-colors line-clamp-2">
                            {item.title ?? "Untitled"}
                          </h3>
                          {item.summary && (
                            <p className="text-sm text-on-surface-variant line-clamp-2 mb-3">{item.summary}</p>
                          )}
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
