import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Doc, Id } from "@convex/_generated/dataModel";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { SKIP_AUTH, MOCK_ITEMS, MOCK_TOPICS } from "../lib/devMocks";

type Tab = "all" | "unread" | "favorites" | "archive";
type ViewMode = "gallery" | "list";

const tabs: { key: Tab; label: string }[] = [
  { key: "all", label: "All Content" },
  { key: "unread", label: "Unread" },
  { key: "favorites", label: "Favorites" },
  { key: "archive", label: "Archive" },
];

function getFilter(tab: Tab) {
  switch (tab) {
    case "unread": return { status: "saved" as const };
    case "favorites": return { isFavorite: true as const };
    case "archive": return { status: "done" as const };
    default: return {};
  }
}

function useLocalStorage<T>(key: string, initial: T): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : initial; }
    catch { return initial; }
  });
  useEffect(() => { localStorage.setItem(key, JSON.stringify(value)); }, [key, value]);
  return [value, setValue];
}

const SKELETONS = Array.from({ length: 8 });

export default function MainLibrary() {
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [selectedTopicId, setSelectedTopicId] = useState<Id<"topics"> | undefined>();
  const [topicSearch, setTopicSearch] = useState("");
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>("lib-view-mode", "gallery");
  const [tagsOpen, setTagsOpen] = useLocalStorage<boolean>("lib-tags-open", true);
  const navigate = useNavigate();

  const filter = { ...getFilter(activeTab), topicId: selectedTopicId };
  const rawItems = useQuery(api.items.list, SKIP_AUTH ? "skip" : filter);
  const rawTopics = useQuery(api.topics.list, SKIP_AUTH ? "skip" : {});
  const rawAllItems = useQuery(api.items.list, SKIP_AUTH ? "skip" : {});

  const allItems = SKIP_AUTH ? MOCK_ITEMS : rawAllItems;
  const topics = SKIP_AUTH ? MOCK_TOPICS : rawTopics;
  const items = SKIP_AUTH
    ? MOCK_ITEMS.filter((item) => {
        if (activeTab === "unread" && item.status !== "saved") return false;
        if (activeTab === "favorites" && !item.isFavorite) return false;
        if (activeTab === "archive" && item.status !== "done") return false;
        if (selectedTopicId && !item.topicIds.includes(selectedTopicId)) return false;
        return true;
      })
    : rawItems;

  // Count items per topic
  const topicCounts = new Map<string, number>();
  if (allItems && topics) {
    for (const topic of topics) {
      const count = allItems.filter((item: Doc<"items">) => item.topicIds.includes(topic._id)).length;
      topicCounts.set(topic._id, count);
    }
  }

  const filteredTopics = topics?.filter((t: Doc<"topics">) =>
    t.name.toLowerCase().includes(topicSearch.toLowerCase())
  );

  function getTopicNames(topicIds: Id<"topics">[]) {
    if (!topics) return [];
    return topicIds.map((tid) => topics.find((t: Doc<"topics">) => t._id === tid)?.name).filter(Boolean) as string[];
  }

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="md:ml-48 flex-1 flex flex-col transition-all duration-300">
        <TopBar />
        <main className="px-4 md:px-8 pt-4 md:pt-6 pb-28 md:pb-8 max-w-[1400px] mx-auto w-full">
          {/* Page heading + view toggle */}
          <div className="flex items-end justify-between mb-5 md:mb-6">
            <h2 className="text-3xl md:text-4xl font-headline font-light tracking-tight text-on-surface">
              Personal Collection
            </h2>
            <div className="flex items-center gap-1 bg-surface-container rounded-lg p-0.5">
              <button
                onClick={() => setViewMode("gallery")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "gallery" ? "bg-background text-on-surface shadow-sm" : "text-on-surface-variant/60 hover:text-on-surface-variant"}`}
                aria-label="Gallery view"
              >
                <span className="material-symbols-outlined text-[18px]">grid_view</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-background text-on-surface shadow-sm" : "text-on-surface-variant/60 hover:text-on-surface-variant"}`}
                aria-label="List view"
              >
                <span className="material-symbols-outlined text-[18px]">view_list</span>
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-6 md:mb-8 overflow-x-auto scrollbar-hide border-b border-outline-variant/30">
            {tabs.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => { setActiveTab(key); setSelectedTopicId(undefined); }}
                className={[
                  "flex-shrink-0 px-4 py-2.5 text-[0.6875rem] font-bold tracking-[0.06em] uppercase transition-colors border-b-2 -mb-px",
                  activeTab === key
                    ? "border-primary-container text-primary-container"
                    : "border-transparent text-on-surface-variant/60 hover:text-on-surface-variant",
                ].join(" ")}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Mobile topic filter — horizontal pills */}
          {topics && topics.length > 0 && (
            <div className="lg:hidden flex gap-2 mb-5 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4">
              {topics.map((topic: Doc<"topics">) => {
                const active = selectedTopicId === topic._id;
                return (
                  <button
                    key={topic._id}
                    onClick={() => setSelectedTopicId(active ? undefined : topic._id)}
                    className={[
                      "flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors",
                      active
                        ? "bg-primary-fixed text-on-primary-fixed"
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

          {/* Content area: topic filter + items */}
          <div className="flex gap-8 items-start">
            {/* Topic filter sidebar — desktop, collapsible */}
            <aside className={`hidden lg:block flex-shrink-0 sticky top-20 transition-all duration-200 ${tagsOpen ? "w-44" : "w-auto"}`}>
              <button
                onClick={() => setTagsOpen(!tagsOpen)}
                className="flex items-center gap-1.5 text-[0.6rem] font-bold tracking-[0.12em] uppercase text-on-surface-variant/50 mb-3 hover:text-on-surface-variant transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">{tagsOpen ? "expand_less" : "expand_more"}</span>
                Filter by tag
              </button>
              {tagsOpen && (
                <>
                  <input
                    type="text"
                    placeholder="Search tags..."
                    value={topicSearch}
                    onChange={(e) => setTopicSearch(e.target.value)}
                    className="w-full bg-surface-container-low border-none rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-on-surface-variant/40 font-sans mb-3"
                  />
                  <div className="flex flex-col gap-0.5">
                    {filteredTopics === undefined && (
                      <p className="text-xs text-on-surface-variant/50">Loading...</p>
                    )}
                    {filteredTopics?.map((topic: Doc<"topics">) => {
                      const active = selectedTopicId === topic._id;
                      const count = topicCounts.get(topic._id) ?? 0;
                      return (
                        <button
                          key={topic._id}
                          onClick={() => setSelectedTopicId(active ? undefined : topic._id)}
                          className={[
                            "flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors",
                            active
                              ? "bg-primary-fixed text-on-primary-fixed font-medium"
                              : "text-on-surface-variant hover:bg-surface-container hover:text-on-surface",
                          ].join(" ")}
                        >
                          <span className="truncate">{topic.name}</span>
                          <span className={`text-xs ml-2 flex-shrink-0 ${active ? "text-on-primary-fixed/70" : "text-on-surface-variant/40"}`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                    {selectedTopicId && (
                      <button
                        onClick={() => setSelectedTopicId(undefined)}
                        className="mt-1 text-[0.625rem] font-bold uppercase tracking-wider text-on-surface-variant/60 hover:text-error transition-colors text-left px-3"
                      >
                        Clear filter
                      </button>
                    )}
                  </div>
                </>
              )}
            </aside>

            {/* Items area */}
            <div className="flex-1 min-w-0">
              {items === undefined && (
                <div className={viewMode === "gallery"
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6"
                  : "flex flex-col gap-3"}>
                  {SKELETONS.map((_, i) => (
                    <div key={i} className={`bg-surface-container animate-pulse ${viewMode === "gallery" ? "rounded-xl h-64" : "rounded-lg h-20"}`} />
                  ))}
                </div>
              )}

              {items?.length === 0 && (
                <div className="text-center py-20">
                  <span className="material-symbols-outlined text-on-surface-variant/30 mb-4 block" style={{ fontSize: 48 }}>
                    {activeTab === "archive" ? "inventory_2" : activeTab === "favorites" ? "star" : activeTab === "unread" ? "mark_as_unread" : "inbox"}
                  </span>
                  <p className="text-on-surface-variant text-sm">
                    {activeTab === "archive" ? "No archived items yet." :
                     activeTab === "favorites" ? "No favorites yet." :
                     activeTab === "unread" ? "Nothing unread." :
                     selectedTopicId ? "No items with this tag." :
                     "Your library is empty. Add a link to get started."}
                  </p>
                </div>
              )}

              {/* Gallery view */}
              {items && items.length > 0 && viewMode === "gallery" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {items.map((item: Doc<"items">) => (
                    <article
                      key={item._id}
                      className="group bg-surface-container-lowest rounded-xl overflow-hidden editorial-shadow cursor-pointer flex flex-col"
                      onClick={() => navigate(`/preview/${item._id}`)}
                    >
                      {item.imageUrl && (
                        <div className="aspect-[16/10] overflow-hidden">
                          <img
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                            src={item.imageUrl}
                            alt={item.title ?? ""}
                          />
                        </div>
                      )}
                      <div className="p-4 md:p-5 flex flex-col flex-1">
                        {getTopicNames(item.topicIds).length > 0 && (
                          <p className="text-[0.6rem] font-bold tracking-[0.1em] uppercase text-on-surface-variant/50 mb-1.5">
                            {getTopicNames(item.topicIds)[0]}
                          </p>
                        )}
                        <h3 className="text-base md:text-lg font-headline font-medium text-on-surface leading-snug mb-1.5 group-hover:text-primary-container transition-colors line-clamp-2">
                          {item.title ?? "Untitled"}
                        </h3>
                        {item.summary && (
                          <p className="text-sm text-on-surface-variant/70 line-clamp-2 leading-relaxed mb-3">
                            {item.summary}
                          </p>
                        )}
                        <div className="mt-auto">
                          {item.sourceName && (
                            <p className="text-[0.6rem] font-bold tracking-widest uppercase text-on-surface-variant/40">
                              {item.sourceName}
                            </p>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {/* List view */}
              {items && items.length > 0 && viewMode === "list" && (
                <div className="flex flex-col gap-2">
                  {items.map((item: Doc<"items">) => (
                    <article
                      key={item._id}
                      className="group flex items-center gap-4 p-3 rounded-xl hover:bg-surface-container cursor-pointer transition-colors"
                      onClick={() => navigate(`/preview/${item._id}`)}
                    >
                      {item.imageUrl ? (
                        <img className="w-16 h-16 md:w-20 md:h-14 rounded-lg object-cover flex-shrink-0" src={item.imageUrl} alt="" />
                      ) : (
                        <div className="w-16 h-16 md:w-20 md:h-14 rounded-lg bg-surface-container-high flex-shrink-0 flex items-center justify-center">
                          <span className="material-symbols-outlined text-on-surface-variant/30">article</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm md:text-base font-headline font-medium text-on-surface leading-snug group-hover:text-primary-container transition-colors truncate">
                          {item.title ?? "Untitled"}
                        </h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          {item.sourceName && (
                            <span className="text-[0.6rem] font-bold tracking-widest uppercase text-on-surface-variant/50">
                              {item.sourceName}
                            </span>
                          )}
                          {getTopicNames(item.topicIds).length > 0 && (
                            <>
                              <span className="w-0.5 h-0.5 rounded-full bg-outline-variant" />
                              <span className="text-[0.6rem] font-bold tracking-wider uppercase text-on-surface-variant/40">
                                {getTopicNames(item.topicIds)[0]}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      {item.isFavorite && (
                        <span className="material-symbols-outlined text-[16px] text-primary-fixed-dim flex-shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
