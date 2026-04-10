import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

export default function SearchDiscovery() {
  const [searchMode, setSearchMode] = useState<"semantic" | "literal">("semantic");
  const [q, setQ] = useState("");
  const navigate = useNavigate();
  const results = useQuery(api.items.list, q ? { q } : {});

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col">
        <TopBar showSearch={false} showBrandName />

        <main className="flex-1">
          <section className="max-w-6xl mx-auto px-8 pt-12 pb-24">
            {/* Hero Search */}
            <div className="flex flex-col items-center text-center mb-16">
              <h1 className="text-5xl md:text-6xl font-headline text-on-surface leading-tight mb-8">
                Seek with <span className="italic font-light">Intent</span>
              </h1>
              <div className="w-full max-w-3xl space-y-6">
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-on-surface-variant text-2xl">
                    search
                  </span>
                  <input
                    className="w-full pl-16 pr-6 py-6 bg-surface-container-lowest border-none rounded-2xl text-xl font-sans placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary/20 editorial-shadow transition-all"
                    placeholder="Search for ideas, authors, or curators..."
                    type="text"
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                  />
                </div>
                <div className="flex items-center justify-center gap-4">
                  <button
                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-[0.6875rem] font-bold uppercase tracking-wider transition-all ${searchMode === "semantic" ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant hover:bg-primary-fixed"}`}
                    onClick={() => setSearchMode("semantic")}
                  >
                    <span
                      className="material-symbols-outlined text-sm"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      auto_awesome
                    </span>
                    Semantic Search
                  </button>
                  <button
                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-[0.6875rem] font-bold uppercase tracking-wider transition-all ${searchMode === "literal" ? "bg-primary text-on-primary" : "bg-surface-container-high text-on-surface-variant hover:bg-primary-fixed"}`}
                    onClick={() => setSearchMode("literal")}
                  >
                    <span className="material-symbols-outlined text-sm">code</span>
                    Literal Search
                  </button>
                </div>
              </div>
            </div>

            {/* Discovery Hub */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              {/* Left Panel */}
              <div className="md:col-span-4 space-y-12">
                {/* Trending Tags placeholder */}
                <div className="bg-surface-container-low p-8 rounded-xl">
                  <h3 className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">trending_up</span>
                    Trending Tags
                  </h3>
                  <p className="text-sm text-on-surface-variant/60">No tags yet.</p>
                </div>

                {/* Suggested For You placeholder */}
                <div>
                  <h3 className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-6 px-2">
                    Suggested for You
                  </h3>
                  <p className="text-sm text-on-surface-variant/60 px-2">No suggestions yet.</p>
                </div>

                {/* Recently Searched placeholder */}
                <div className="bg-surface-container-lowest p-8 rounded-xl editorial-shadow">
                  <h3 className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-6">
                    Recently Searched
                  </h3>
                  <p className="text-sm text-on-surface-variant/60">No recent searches.</p>
                </div>
              </div>

              {/* Right Panel: Results */}
              <div className="md:col-span-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-headline italic">
                    {q ? "Search Results" : "Recent Discoveries"}
                  </h2>
                  <div className="flex gap-4">
                    <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary-container">
                      grid_view
                    </span>
                    <span className="material-symbols-outlined text-outline cursor-pointer hover:text-primary-container">
                      view_agenda
                    </span>
                  </div>
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
                      {q ? "No results found." : "Your library is empty."}
                    </p>
                  </div>
                )}

                {results && results.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    {(results ?? []).map((item) => (
                      <article
                        key={item._id}
                        className="group bg-surface-container-low rounded-xl overflow-hidden flex flex-col cursor-pointer"
                        onClick={() => navigate(`/preview/${item._id}`)}
                      >
                        <div className="aspect-[4/3] overflow-hidden relative">
                          {item.imageUrl ? (
                            <img
                              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                              src={item.imageUrl}
                              alt={item.title ?? ""}
                            />
                          ) : (
                            <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                              <span className="material-symbols-outlined text-4xl text-on-surface-variant/40">
                                {item.contentType === "video"
                                  ? "play_circle"
                                  : item.contentType === "podcast"
                                    ? "headphones"
                                    : "description"}
                              </span>
                            </div>
                          )}
                          {item.contentType && (
                            <span className="absolute top-4 right-4 bg-secondary-container text-on-secondary-container px-2 py-1 rounded text-[0.6rem] font-bold uppercase tracking-widest">
                              {item.contentType}
                            </span>
                          )}
                        </div>
                        <div className="p-6 flex flex-col flex-grow">
                          <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-secondary-container mb-2">
                            {item.sourceName ?? ""}
                          </p>
                          <h3 className="text-xl font-headline mb-4 group-hover:text-primary-container transition-colors">
                            {item.title ?? "Untitled"}
                          </h3>
                          <p className="text-sm text-on-surface-variant line-clamp-2 mb-6">{item.summary ?? ""}</p>
                          <div className="mt-auto flex items-center justify-end">
                            <span className="material-symbols-outlined text-outline group-hover:text-primary-container transition-colors">
                              bookmark
                            </span>
                          </div>
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
