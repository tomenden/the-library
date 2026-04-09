import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TagChip from '../components/TagChip';
import { contentPreviewArticle } from '../data/mockData';

export default function ContentPreview() {
  const navigate = useNavigate();
  const [notes, setNotes] = useState('');
  const article = contentPreviewArticle;

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between px-8 h-14 bg-background/80 backdrop-blur-2xl border-b border-outline-variant/20">
        <button
          className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors text-[0.6875rem] font-bold tracking-widest uppercase"
          onClick={() => navigate('/')}
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Gallery
        </button>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant">
            <span className="material-symbols-outlined text-[16px]">save</span>
            {article.savedDaysAgo}
          </span>
          <button className="text-on-surface-variant hover:text-on-surface transition-colors">
            <span className="material-symbols-outlined">more_vert</span>
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-8 py-12 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-16">
        {/* Main Content */}
        <article>
          <p className="text-[0.6875rem] font-bold tracking-[0.1em] uppercase text-on-surface-variant mb-4">
            {article.label}
          </p>
          <h1 className="text-4xl md:text-5xl font-headline font-light text-on-surface leading-tight mb-8">
            {article.title}
          </h1>

          {/* Metadata */}
          <div className="flex flex-wrap gap-8 mb-10">
            <div>
              <p className="text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant/60 mb-1">Author</p>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-primary-fixed flex items-center justify-center text-[0.6rem] font-bold text-on-primary-fixed">
                  JV
                </div>
                <span className="text-sm font-medium text-on-surface">{article.author}</span>
              </div>
            </div>
            <div>
              <p className="text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant/60 mb-1">Publication</p>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-on-surface-variant">language</span>
                <span className="text-sm font-medium text-on-surface uppercase tracking-wider">{article.publication}</span>
              </div>
            </div>
            <div>
              <p className="text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant/60 mb-1">Published</p>
              <span className="text-sm font-medium text-on-surface">{article.publishedDate}</span>
            </div>
          </div>

          {/* Hero Image */}
          <div className="rounded-xl overflow-hidden mb-10 aspect-video">
            <img className="w-full h-full object-cover" src={article.imageUrl} alt={article.title} />
          </div>

          {/* Pull Quote */}
          <blockquote className="my-10 px-0">
            <p className="text-lg font-headline italic text-on-surface-variant leading-relaxed border-l-4 border-primary-fixed-dim pl-6">
              {article.pullQuote}
            </p>
          </blockquote>

          {/* Body */}
          <div className="prose max-w-none">
            <p className="text-base text-on-surface leading-relaxed">{article.body}</p>
          </div>

          {/* Continue Reading */}
          <button className="mt-12 flex items-center gap-2 text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface hover:text-primary-container transition-colors border-b border-on-surface/30 pb-0.5">
            Continue Reading Original Source
            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
          </button>
        </article>

        {/* Right Panel */}
        <aside className="space-y-6">
          {/* External Link */}
          <a
            href="#"
            className="flex items-center justify-between p-4 signature-gradient text-on-primary rounded-xl group hover:opacity-90 transition-opacity"
          >
            <div>
              <p className="text-[0.6875rem] font-bold tracking-widest uppercase opacity-70 mb-1">External Link</p>
              <p className="font-medium">{article.externalLink}</p>
            </div>
            <span className="material-symbols-outlined">open_in_new</span>
          </a>

          {/* Collection */}
          <div className="bg-surface-container-lowest rounded-xl p-5 editorial-shadow">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant">Collection</p>
              <button className="text-[0.6875rem] font-bold tracking-widest uppercase text-primary-container hover:underline">
                Change
              </button>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary-container flex items-center justify-center">
                <span className="material-symbols-outlined text-on-primary text-[16px]">architecture</span>
              </div>
              <span className="text-sm font-medium text-on-surface">{article.collection}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="bg-surface-container-lowest rounded-xl p-5 editorial-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant">Tags</p>
              <button className="text-[0.6875rem] font-bold tracking-widest uppercase text-primary-container hover:underline">
                Add New
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {article.tags.map((tag) => <TagChip key={tag} label={tag} />)}
            </div>
          </div>

          {/* Private Notes */}
          <div className="bg-surface-container-lowest rounded-xl p-5 editorial-shadow">
            <p className="text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant mb-3">Private Notes</p>
            <textarea
              className="w-full text-sm text-on-surface-variant bg-transparent border border-outline-variant/40 rounded-lg p-3 min-h-[96px] resize-none focus:outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-on-surface-variant/40"
              placeholder="Add your reflections or context here..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Stats */}
          <div className="bg-surface-container-lowest rounded-xl p-5 editorial-shadow grid grid-cols-2 gap-4">
            <div>
              <p className="text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant/60 mb-1">Word Count</p>
              <p className="text-sm font-medium text-on-surface">{article.wordCount}</p>
            </div>
            <div>
              <p className="text-[0.6875rem] font-bold tracking-widest uppercase text-on-surface-variant/60 mb-1">Read Time</p>
              <p className="text-sm font-medium text-on-surface">{article.readTime}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-surface-container-lowest rounded-xl editorial-shadow divide-y divide-outline-variant/20">
            <button className="w-full flex items-center gap-3 px-5 py-4 text-on-surface hover:bg-surface-container-low transition-colors rounded-t-xl text-left">
              <span
                className="material-symbols-outlined text-primary-container"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
              <span className="text-sm font-medium">Mark as Consumed</span>
            </button>
            <button className="w-full flex items-center gap-3 px-5 py-4 text-on-surface hover:bg-surface-container-low transition-colors text-left">
              <span className="material-symbols-outlined text-on-surface-variant">star</span>
              <span className="text-sm font-medium">Favorite Item</span>
            </button>
            <button className="w-full flex items-center gap-3 px-5 py-4 text-error hover:bg-error-container/20 transition-colors rounded-b-xl text-left">
              <span className="material-symbols-outlined text-error">delete</span>
              <span className="text-sm font-medium">Delete from Library</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
