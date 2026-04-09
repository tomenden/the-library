import { useNavigate } from 'react-router-dom';
import type { ContentItem } from '../data/mockData';
import TagChip from './TagChip';

interface ContentCardProps {
  readonly item: ContentItem;
}

export default function ContentCard({ item }: ContentCardProps) {
  const navigate = useNavigate();

  const handleClick = () => navigate('/preview');

  if (item.isPodcast && !item.imageUrl) {
    // Text-only card (e.g. Spotify)
    return (
      <article
        className="bg-surface-container-lowest rounded-xl overflow-hidden editorial-shadow group cursor-pointer flex flex-col p-6"
        onClick={handleClick}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[0.625rem] font-bold tracking-widest uppercase text-on-surface-variant/60">{item.source}</span>
          <span className="w-1 h-1 rounded-full bg-outline-variant" />
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant/60">{item.sourceIcon}</span>
        </div>
        <h3 className="text-xl font-headline font-medium text-on-surface leading-snug mb-3 group-hover:text-primary-container transition-colors">
          {item.title}
        </h3>
        <p className="text-sm text-on-surface-variant/80 leading-relaxed flex-1">{item.description}</p>
        <div className="mt-6 flex flex-wrap gap-2">
          {item.tags.map((tag) => <TagChip key={tag} label={tag} />)}
        </div>
        {item.badge && (
          <p className="mt-4 text-[0.625rem] font-bold tracking-widest uppercase text-on-surface-variant/50">{item.badge}</p>
        )}
      </article>
    );
  }

  if (item.source === 'Twitter') {
    // Tweet card
    return (
      <article className="bg-surface-container-lowest rounded-xl overflow-hidden editorial-shadow group cursor-pointer flex flex-col p-6">
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

  if (item.isPodcast) {
    // Podcast card with thumbnail
    return (
      <article
        className="bg-surface-container-lowest rounded-xl overflow-hidden editorial-shadow group cursor-pointer flex flex-col"
        onClick={handleClick}
      >
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
      </article>
    );
  }

  // Standard card with image
  return (
    <article
      className="bg-surface-container-lowest rounded-xl overflow-hidden editorial-shadow group cursor-pointer flex flex-col"
      onClick={handleClick}
    >
      {item.imageUrl && (
        <div className="relative h-48 overflow-hidden">
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
            <div className="absolute top-4 right-4 bg-secondary-container/90 backdrop-blur-sm text-on-secondary-container px-2 py-1 rounded text-[0.625rem] font-bold tracking-widest uppercase">
              {item.badge}
            </div>
          )}
        </div>
      )}
      <div className="p-6 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-[0.625rem] font-bold tracking-widest uppercase text-on-surface-variant/60">{item.source}</span>
          <span className="w-1 h-1 rounded-full bg-outline-variant" />
          <span className="material-symbols-outlined text-[14px] text-on-surface-variant/60">{item.sourceIcon}</span>
        </div>
        <h3 className="text-xl font-headline font-medium text-on-surface leading-snug mb-3 group-hover:text-primary-container transition-colors">
          {item.title}
        </h3>
        <p className="text-sm text-on-surface-variant/80 line-clamp-3 mb-6 leading-relaxed">{item.description}</p>
        <div className="mt-auto flex flex-wrap gap-2">
          {item.tags.map((tag) => <TagChip key={tag} label={tag} />)}
        </div>
      </div>
    </article>
  );
}
