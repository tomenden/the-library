import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import TopBar from '../components/TopBar';
import ContentCard from '../components/ContentCard';
import { libraryItems } from '../data/mockData';

export default function MainLibrary() {
  const [view, setView] = useState<'grid' | 'list'>('grid');

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className="ml-64 flex-1 flex flex-col">
        <TopBar />
        <main className="p-8 max-w-[1400px] mx-auto w-full">
          {/* Page Header */}
          <div className="mb-12 flex justify-between items-end">
            <div>
              <p className="text-[0.6875rem] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-3">
                Personal Collection
              </p>
              <h2 className="text-5xl font-headline font-light tracking-tight text-on-surface">The Library</h2>
            </div>
            <div className="flex gap-2">
              <button
                className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'text-primary-container bg-surface-container' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                onClick={() => setView('grid')}
              >
                <span className="material-symbols-outlined">grid_view</span>
              </button>
              <button
                className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'text-primary-container bg-surface-container' : 'text-on-surface-variant hover:bg-surface-container-low'}`}
                onClick={() => setView('list')}
              >
                <span className="material-symbols-outlined">view_list</span>
              </button>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {libraryItems.map((item) => (
              <ContentCard key={item.id} item={item} />
            ))}
          </div>

          {/* Archive Discovery */}
          <div className="mt-16 flex justify-center">
            <button className="flex items-center gap-2 text-on-surface-variant hover:text-primary-container transition-colors text-[0.6875rem] font-bold tracking-widest uppercase">
              <span>Archive Discovery</span>
              <span className="material-symbols-outlined text-[18px]">expand_more</span>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
