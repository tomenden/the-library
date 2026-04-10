import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

export default function SearchDiscovery() {
  const [q, setQ] = useState("");
  const [selectedTopicId, setSelectedTopicId] = useState<Id<"topics"> | undefined>();
  const navigate = useNavigate();

  const topics = useQuery(api.topics.list, {});
  const results = useQuery(api.items.list, {
    q: q.trim() || undefined,
    topicId: selectedTopicId,
  });

  function toggleTopic(id: Id<"topics">) {
    setSelectedTopicId((prev) => (prev === id ? undefined : id));
  }

  const hasFilter = !!q.trim() || !!selectedTopicId;

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col">
        <TopBar showSearch={false} showBrandName />

        <main className="flex-1">
          <section className="max-w-6xl mx-auto px-8 pt-12 pb-24">
            {/* Search bar */}
            <div className="flex flex-col items-center text-center mb-12">
              <h1 className="text-5xl md:text-6xl font-headline text-on-surface leading-tight mb-8">
                Seek with <span className="italic font-light">Intent</span>
              </h1>
              <div className="relative w-full max-w-3xl">
                <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant text-2xl">
                  search
                </span>
                <input
                  className="w-full pl-16 pr-6 py-6 bg-surface-container-lowest border-none rounded-2xl text-xl font-sans placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 editorial-shadow transition-all"
                  placeholder="Search your library..."
                  type="text"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  autoFocus
                />
                {q && (
                  <button
                    onClick={() => setQ("")}
                    className="absolute right-6 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    <span className="material-symbols-outlined">close</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Left: Tag filter */}
              <div className="md:col-span-3">
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
              </div>

              {/* Right: Results */}
              <div className="md:col-span-9">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-headline italic text-on-surface">
                    {hasFilter ? (
                      <>
                        {results?.length ?? "…"} result{results?.length !== 1 ? "s" : ""}
                        {selectedTopicId && topics && (
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

                {results === undefined && (
                  <div className="flex justify-center py-20">
                    <span className="material-symbols-outlined animate-spin text-on-surface-variant">
                      progress_activity
                    </span>
                  </div>
                )}

                {results !== undefined && results.length === 0 && (
                  <div className="text-center py-20">
                    <p className="text-on-surface-variant text-sm">
                      {hasFilter ? "No items match." : "Your library is empty."}
                    </p>
                  </div>
                )}

                {results && results.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
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
                        <div className="p-5 flex flex-col flex-grow">
                          <div className="flex items-center justify-between mb-2">
                            <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant/60">
                              {item.sourceName ?? ""}
                            </p>
                            {item.contentType && (
                              <span className="bg-surface-container text-on-surface-variant px-2 py-0.5 rounded text-[0.6rem] font-bold uppercase tracking-widest">
                                {item.contentType}
                              </span>
                            )}
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
    </div>
  );
}
