import Sidebar from '../components/Sidebar';
import TagChip from '../components/TagChip';
import { archiveGroups } from '../data/mockData';

export default function HistoryArchive() {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="flex justify-between items-center px-8 w-full sticky top-0 h-16 bg-background/80 backdrop-blur-2xl z-50">
          <div className="flex items-center flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[20px]">
                search
              </span>
              <input
                className="w-full bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-on-surface-variant/40"
                placeholder="Search archive..."
                type="text"
              />
            </div>
          </div>
          <div className="flex items-center gap-6 ml-8">
            <button className="text-on-surface-variant hover:text-primary-container transition-colors">
              <span className="material-symbols-outlined">notifications</span>
            </button>
            <button className="text-on-surface-variant hover:text-primary-container transition-colors">
              <span className="material-symbols-outlined">account_circle</span>
            </button>
            <button className="signature-gradient text-on-primary px-5 py-2 rounded-lg text-[0.6875rem] font-bold tracking-[0.05em] uppercase shadow-sm hover:opacity-90 transition-opacity">
              Add Content
            </button>
          </div>
        </header>

        <main className="p-8 max-w-4xl w-full">
          {/* Page Header */}
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h2 className="text-5xl font-headline font-light tracking-tight text-on-surface mb-2">The Archive</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed">
                A chronological record of your intellectual consumption.<br />
                Reflect, revisit, and re-engage with your history.
              </p>
            </div>
            <div className="flex gap-3 mt-2">
              <button className="px-4 py-2 rounded-lg border border-outline-variant text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant hover:bg-surface-container transition-colors">
                Clear History
              </button>
              <button className="px-4 py-2 rounded-lg border border-outline-variant text-[0.6875rem] font-bold uppercase tracking-wider text-on-surface-variant hover:bg-surface-container transition-colors">
                Export Log
              </button>
            </div>
          </div>

          {/* Archive Timeline */}
          <div className="space-y-12">
            {archiveGroups.map((group) => (
              <section key={group.label}>
                {/* Group Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center">
                    <span className="material-symbols-outlined text-[18px] text-on-surface-variant">{group.icon}</span>
                  </div>
                  <h3 className="text-2xl font-headline italic text-on-surface">{group.label}</h3>
                </div>

                {/* Entries */}
                <div className="space-y-4 pl-5 border-l-2 border-outline-variant/30 ml-4">
                  {group.entries.map((entry) => (
                    <div
                      key={entry.id}
                      className="bg-surface-container-lowest rounded-xl p-5 editorial-shadow hover:bg-surface-container transition-colors cursor-pointer group flex gap-5"
                    >
                      {entry.imageUrl && (
                        <div className="w-24 h-20 rounded-lg overflow-hidden flex-shrink-0">
                          <img className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" src={entry.imageUrl} alt={entry.title} />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant/60 mb-2">
                          {entry.source}
                        </p>
                        <h4 className="font-headline text-lg text-on-surface leading-snug mb-1 group-hover:text-primary-container transition-colors">
                          {entry.title}
                        </h4>
                        <p className="text-sm text-on-surface-variant/80 mb-3 line-clamp-1">{entry.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {entry.tags.map((tag) => <TagChip key={tag} label={tag} />)}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Stats card for "Last Week" */}
                  {group.stats && (
                    <div className="bg-surface-container rounded-xl p-6 grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2 block">timer</span>
                        <p className="text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant/60 mb-1">
                          Time Invested
                        </p>
                        <p className="text-3xl font-headline text-on-surface">{group.stats.timeInvested}</p>
                        <p className="text-[0.6875rem] text-on-surface-variant mt-1">across {group.stats.itemCount} items</p>
                      </div>
                      <div className="text-center">
                        <span className="material-symbols-outlined text-3xl text-on-surface-variant mb-2 block">auto_stories</span>
                        <p className="text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant/60 mb-1">
                          Items Read
                        </p>
                        <p className="text-3xl font-headline text-on-surface">{group.stats.itemCount}</p>
                        <p className="text-[0.6875rem] text-on-surface-variant mt-1">last 7 days</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
