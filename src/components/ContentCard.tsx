import { useNavigate } from 'react-router-dom';
import TagChip from './TagChip';

export interface ContentItem {
  id: string;
  source: string;
  sourceIcon: 'description' | 'play_circle' | 'headphones';
  title: string;
  description: string;
  tags: string[];
  badge?: string;
  imageUrl?: string;
  isVideo?: boolean;
  isPodcast?: boolean;
  podcastMeta?: string;
  pullQuote?: string;
  tweetAuthor?: string;
  tweetHandle?: string;
}

interface ContentCardProps {
  readonly item: ContentItem;
  readonly onClick?: () => void;
}

export default function ContentCard({ item, onClick }: ContentCardProps) {
  const navigate = useNavigate();

  const handleClick = onClick ?? (() => navigate(`/preview/${item.id}`));

  if (item.isPodcast) {
    return (
      <article
        className="bg-surface-container-lowest rounded-xl overflow-hidden editorial-shadow group cursor-pointer"
        onClick={handleClick}
      >
        {/* Mobile: horizontal */}
        <div className="flex md:hidden items-center gap-4 p-4">
          {item.imageUrl ? (
            <div className="relative flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden">
              <img className="w-full h-full object-cover" src={item.imageUrl} alt={item.title} />
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full signature-gradient flex items-center justify-center">
                <span className="material-symbols-outlined text-[10px] text-white" style={{ fontVariationSettings: "'FILL' 1" }}>volume_up</span>
              </div>
            </div>
          ) : (
            <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-surface-container flex items-center justify-center">
              <span className="material-symbols-outlined text-on-surface-variant/40">headphones</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[0.625rem] font-bold tracking-widest uppercase text-on-surface-variant/60 mb-1">{item.source}</p>
            <h3 className="text-base font-headline font-medium text-on-surface leading-snug line-clamp-2 group-hover:text-primary-container transition-colors">
              {item.title}
            </h3>
            {item.description && (
              <p className="text-xs text-on-surface-variant/80 mt-1 line-clamp-1">{item.description}</p>
            )}
          </div>
        </div>

        {/* Desktop: vertical */}
        <div className="hidden md:flex flex-col">
          <div className="p-6 flex flex-col flex-1 bg-surface-container-high/40">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[0.625rem] font-bold tracking-widest uppercase text-on-surface-variant/60">{item.source}</span>
              <span className="w-1 h-1 rounded-full bg-outline-variant" />
              <span className="material-symbols-outlined text-[14px] text-on-surface-variant/60">{item.sourceIcon}</span>
            </div>
            <div className="flex gap-4 mb-6">
              {item.imageUrl && (
                <div className="w-20 h-20 rounded-lg bg-surface-container overflow-hidden shrink-0">
                  <img className="w-full h-full object-cover" src={item.imageUrl} alt={item.title} />
                </div>
              )}
              <div>
                <h3 className="text-xl font-headline font-medium text-on-surface leading-snug mb-1 group-hover:text-primary-container transition-colors">
                  {item.title}
                </h3>
                {item.podcastMeta && (
                  <p className="text-xs text-on-surface-variant font-medium uppercase tracking-tighter">{item.podcastMeta}</p>
                )}
              </div>
            </div>
            {item.pullQuote && (
              <p className="text-sm text-on-surface-variant/80 line-clamp-3 mb-6 leading-relaxed italic">{item.pullQuote}</p>
            )}
            <div className="mt-auto flex flex-wrap gap-2">
              {item.tags.map((tag) => <TagChip key={tag} label={tag} />)}
            </div>
          </div>
        </div>
      </article>
    );
  }

  if (item.source === 'Twitter') {
    return (
      <article
        className="bg-surface-container-lowest rounded-xl overflow-hidden editorial-shadow group cursor-pointer flex flex-col p-6"
        onClick={handleClick}
      >
        <div className="flex items-center gap-2 mb-4">
          <span className="text-[0.625rem] font-bold tracking-widest uppercase text-on-surface-variant/60">Twitter</span>
          <span className="w-1 h-1 rounded-full bg-outline-variant" />
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant/60">description</span>
        </div>
        <p className="text-base text-on-surface leading-relaxed flex-1 italic font-headline">{item.description}</p>
        {item.tweetAuthor && (
          <div className="mt-6 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-on-primary text-xs font-bold">
              N
            </div>
            <div>
              <p className="text-sm font-medium text-on-surface">{item.tweetAuthor}</p>
              <p className="text-xs text-on-surface-variant">{item.tweetHandle}</p>
            </div>
          </div>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {item.tags.map((tag) => <TagChip key={tag} label={tag} />)}
        </div>
      </article>
    );
  }

  // Standard article / video card
  return (
    <article
      className="bg-surface-container-lowest rounded-xl overflow-hidden editorial-shadow group cursor-pointer flex flex-col"
      onClick={handleClick}
    >
      {item.imageUrl && (
        <div className="aspect-[4/3] md:h-48 md:aspect-auto relative overflow-hidden">
            <img
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              src={item.imageUrl}
              alt={item.title}
            />
            {item.isVideo && (
              <div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-colors flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-surface-container-lowest/90 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <span
                    className="material-symbols-outlined text-primary text-[24px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    play_arrow
                  </span>
                </div>
              </div>
            )}
            {item.badge && (
              <div className="absolute top-3 right-3 bg-secondary-container/90 backdrop-blur-sm text-on-secondary-container px-3 py-1 rounded-full text-[0.6rem] font-bold tracking-widest uppercase">
                {item.badge}
              </div>
            )}
        </div>
      )}
      <div className="p-4 md:p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2 md:mb-3">
          <span className="text-[0.625rem] font-bold tracking-widest uppercase text-on-surface-variant/60">{item.source}</span>
          <span className="w-1 h-1 rounded-full bg-outline-variant" />
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant/60">{item.sourceIcon}</span>
        </div>
        <h3 className="text-lg md:text-xl font-headline font-medium text-on-surface leading-snug mb-2 md:mb-3 group-hover:text-primary-container transition-colors line-clamp-2 md:line-clamp-none">
          {item.title}
        </h3>
        <p className="text-sm text-on-surface-variant/80 line-clamp-2 md:line-clamp-3 mb-4 md:mb-6 leading-relaxed hidden md:block">
          {item.description}
        </p>
        <div className="mt-auto hidden md:flex flex-wrap gap-2">
          {item.tags.map((tag) => <TagChip key={tag} label={tag} />)}
        </div>
      </div>
    </article>
  );
}
