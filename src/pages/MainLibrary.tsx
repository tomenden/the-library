import { NavLink } from "react-router-dom";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import ContentCard from "../components/ContentCard";
import { useSidebar } from "../contexts/SidebarContext";

const SKELETONS = Array.from({ length: 8 });

const filterTabs = [
  { label: 'All', to: '/' },
  { label: 'Articles', to: '/articles' },
  { label: 'Videos', to: '/videos' },
  { label: 'Audio', to: '/audio' },
];

export default function MainLibrary() {
  const items = useQuery(api.items.list, {});
  const { collapsed } = useSidebar();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className={`${collapsed ? 'md:ml-16' : 'md:ml-64'} flex-1 flex flex-col transition-all duration-300`}>
        <TopBar />
        <main className="px-4 md:px-8 pt-6 md:pt-8 pb-28 md:pb-8 max-w-[1400px] mx-auto w-full">
          <div className="mb-8 md:mb-12">
            <p className="text-[0.6875rem] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-3">
              Personal Collection
            </p>
            <h2 className="text-4xl md:text-5xl font-headline font-light tracking-tight text-on-surface">
              The Library
            </h2>

            {/* Mobile filter tabs */}
            <div className="flex md:hidden gap-2 mt-6 overflow-x-auto pb-1 scrollbar-hide">
              {filterTabs.map(({ label, to }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex-shrink-0 px-4 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider font-sans transition-colors ${
                      isActive
                        ? 'bg-primary-fixed text-on-primary-fixed'
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-primary-fixed/60'
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </div>
          </div>

          {items === undefined && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
              {SKELETONS.map((_, i) => (
                <div key={i} className="rounded-2xl bg-surface-container animate-pulse h-48" />
              ))}
            </div>
          )}

          {items?.length === 0 && (
            <div className="text-center py-20">
              <p className="text-on-surface-variant text-sm">
                Your library is empty. Share a link with your LLM to get started.
              </p>
            </div>
          )}

          {items && items.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
              {items.map((item) => (
                <ContentCard
                  key={item._id}
                  item={{
                    id: item._id,
                    source: item.sourceName ?? "",
                    sourceIcon:
                      item.contentType === "video"
                        ? "play_circle"
                        : item.contentType === "podcast"
                          ? "headphones"
                          : "description",
                    title: item.title ?? "",
                    description: item.summary ?? "",
                    tags: [],
                    imageUrl: item.imageUrl,
                    isVideo: item.contentType === "video",
                    isPodcast: item.contentType === "podcast",
                  }}
                />
              ))}
            </div>
          )}
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
