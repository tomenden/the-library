import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import { trendingTags, recentSearches, searchSuggestions, searchResults } from '../data/mockData';

export default function SearchDiscovery() {
  const [searchMode, setSearchMode] = useState<'semantic' | 'literal'>('semantic');
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar showAddButton />
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
                  />
                </div>
                <div className="flex items-center justify-center gap-4">
                  <button
                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-[0.6875rem] font-bold uppercase tracking-wider transition-all ${searchMode === 'semantic' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-primary-fixed'}`}
                    onClick={() => setSearchMode('semantic')}
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
                    className={`flex items-center gap-2 px-6 py-2 rounded-full text-[0.6875rem] font-bold uppercase tracking-wider transition-all ${searchMode === 'literal' ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-primary-fixed'}`}
                    onClick={() => setSearchMode('literal')}
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
                {/* Trending Tags */}
                <div className="bg-surface-container-low p-8 rounded-xl">
                  <h3 className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-base">trending_up</span>
                    Trending Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {trendingTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 bg-surface-container-lowest rounded-full text-xs font-medium text-on-secondary-container hover:bg-primary-fixed cursor-pointer transition-colors"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Suggested For You */}
                <div>
                  <h3 className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-6 px-2">
                    Suggested for You
                  </h3>
                  <div className="space-y-4">
                    {searchSuggestions.map((s) => (
                      <div
                        key={s.title}
                        className="group flex gap-4 items-center p-2 rounded-xl hover:bg-surface-container transition-all cursor-pointer"
                      >
                        <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-surface-container-high">
                          <img className="w-full h-full object-cover" src={s.imageUrl} alt={s.title} />
                        </div>
                        <div>
                          <p className="text-[0.6875rem] font-bold uppercase tracking-tighter text-on-secondary-container mb-1">
                            {s.category}
                          </p>
                          <h4 className="font-headline text-lg leading-snug">{s.title}</h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recently Searched */}
                <div className="bg-surface-container-lowest p-8 rounded-xl editorial-shadow">
                  <h3 className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-surface-variant mb-6">
                    Recently Searched
                  </h3>
                  <ul className="space-y-3">
                    {recentSearches.map((q) => (
                      <li key={q} className="flex items-center justify-between text-on-secondary-container group cursor-pointer">
                        <span className="text-sm font-medium">{q}</span>
                        <span className="material-symbols-outlined text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                          history
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Right Panel: Results */}
              <div className="md:col-span-8">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-headline italic">Recent Discoveries</h2>
                  <div className="flex gap-4">
                    <span className="material-symbols-outlined text-on-surface-variant cursor-pointer hover:text-primary-container">
                      grid_view
                    </span>
                    <span className="material-symbols-outlined text-outline cursor-pointer hover:text-primary-container">
                      view_agenda
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  {searchResults.map((r) => (
                    <article
                      key={r.id}
                      className="group bg-surface-container-low rounded-xl overflow-hidden flex flex-col cursor-pointer"
                      onClick={() => navigate('/preview')}
                    >
                      <div className="aspect-[4/3] overflow-hidden relative">
                        <img
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          src={r.imageUrl}
                          alt={r.title}
                        />
                        <span className="absolute top-4 right-4 bg-secondary-container text-on-secondary-container px-2 py-1 rounded text-[0.6rem] font-bold uppercase tracking-widest">
                          {r.badge}
                        </span>
                      </div>
                      <div className="p-6 flex flex-col flex-grow">
                        <p className="text-[0.6875rem] font-bold uppercase tracking-widest text-on-secondary-container mb-2">
                          {r.category}
                        </p>
                        <h3 className="text-xl font-headline mb-4 group-hover:text-primary-container transition-colors">
                          {r.title}
                        </h3>
                        <p className="text-sm text-on-surface-variant line-clamp-2 mb-6">{r.description}</p>
                        <div className="mt-auto flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`w-6 h-6 rounded-full ${r.authorColor} flex items-center justify-center text-[0.6rem] font-bold`}>
                              {r.authorInitials}
                            </div>
                            <span className="text-[0.6875rem] font-medium text-on-surface">{r.author}</span>
                          </div>
                          <span className="material-symbols-outlined text-outline group-hover:text-primary-container transition-colors">
                            bookmark
                          </span>
                        </div>
                      </div>
                    </article>
                  ))}

                  {/* Featured card */}
                  <article
                    className="group sm:col-span-2 bg-surface-container-lowest editorial-shadow rounded-xl overflow-hidden flex flex-col md:flex-row cursor-pointer"
                    onClick={() => navigate('/preview')}
                  >
                    <div className="md:w-1/2 aspect-video md:aspect-auto overflow-hidden">
                      <img
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuCxZ274Gk5_QYJF_PYE5uM424LskaLJ7eTO9PP7zCadrOOV8bR_q70dpNzrI41pfDDq7Xlfz5VSEX67rJZeGJXCt-jFyjigSwgNtxNcSZtj818KW5rSZh3OKzPJCJRLwLD0oepyQoMIGL0dez2xsZW7sygyuy_8A6-8qzvH4ejvR_H4oJNGh6v2D4JwuahLQZq9ygkt5EDxNbCsyNYx04xEYkooe_kymByG1RzOGJErpu8-pTdWn9BqYXvWVOZGtT8SIYMOxtzV4TQ"
                        alt="The Art of the Analog Workspace"
                      />
                    </div>
                    <div className="p-10 md:w-1/2 flex flex-col justify-center">
                      <p className="text-[0.6875rem] font-bold uppercase tracking-[0.1em] text-on-secondary-container mb-4">
                        Masterclass
                      </p>
                      <h3 className="text-3xl font-headline mb-6 leading-tight group-hover:text-primary-container transition-colors">
                        The Art of the Analog Workspace
                      </h3>
                      <p className="text-on-surface-variant mb-8 leading-relaxed">
                        Why the world's leading creative directors are returning to tactile tools and physical constraints to break
                        through digital fatigue.
                      </p>
                      <button className="self-start px-8 py-3 bg-primary text-on-primary rounded-full text-[0.6875rem] font-bold uppercase tracking-widest hover:opacity-90 transition-all">
                        Read Full Curation
                      </button>
                    </div>
                  </article>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
