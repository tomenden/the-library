import { useQuery } from "convex/react";
import { useNavigate } from "react-router-dom";
import { api } from "../../convex/_generated/api";
import ContentCard from "../components/ContentCard";
import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";
import BottomNav from "../components/BottomNav";
import { useSidebar } from "../contexts/SidebarContext";

type ContentType = "article" | "video" | "podcast" | "tweet" | "newsletter";
type Status = "saved" | "in_progress" | "done";

interface FilteredItemsProps {
  title: string;
  subtitle: string;
  filter: {
    status?: Status;
    contentType?: ContentType;
    isFavorite?: boolean;
  };
}

export default function FilteredItems({ title, subtitle, filter }: FilteredItemsProps) {
  const navigate = useNavigate();
  const items = useQuery(api.items.list, filter);
  const { collapsed } = useSidebar();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div className={`${collapsed ? 'md:ml-16' : 'md:ml-64'} flex-1 flex flex-col transition-all duration-300`}>
        <TopBar />
        <main className="px-4 md:px-8 pt-6 md:pt-8 pb-28 md:pb-8">
          <div className="mb-8">
            <p className="text-[0.6875rem] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-3">
              {subtitle}
            </p>
            <h2 className="text-4xl font-headline font-light text-on-surface">{title}</h2>
          </div>

          {items === undefined && (
            <div className="flex items-center justify-center py-24">
              <span className="material-symbols-outlined animate-spin text-on-surface-variant">
                progress_activity
              </span>
            </div>
          )}

          {items?.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <span className="material-symbols-outlined text-on-surface-variant/40 mb-4" style={{ fontSize: 48 }}>
                inbox
              </span>
              <p className="text-sm text-on-surface-variant">Nothing here yet.</p>
            </div>
          )}

          {items && items.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
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
                  onClick={() => navigate(`/preview/${item._id}`)}
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
