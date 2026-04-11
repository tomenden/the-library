import { useState } from "react";
import AddContentModal from "./AddContentModal";
import SaveWithAIModal from "./SaveWithAIModal";

interface TopBarProps {
  readonly searchPlaceholder?: string;
  readonly showSearch?: boolean;
  readonly showBrandName?: boolean;
}

export default function TopBar({
  searchPlaceholder = 'Search your library...',
  showSearch = true,
  showBrandName = false,
}: TopBarProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [showAIAdd, setShowAIAdd] = useState(false);

  return (
    <>
      <header className="flex justify-between items-center px-8 w-full sticky top-0 h-16 bg-background/80 backdrop-blur-2xl z-50">
        {showBrandName ? (
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-headline italic text-primary-container">The Gallery</h2>
          </div>
        ) : showSearch ? (
          <div className="flex items-center flex-1 max-w-xl">
            <div className="relative w-full">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[20px]">
                search
              </span>
              <input
                className="w-full bg-surface-container-low border-none rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary/20 placeholder:text-on-surface-variant/40 font-sans"
                placeholder={searchPlaceholder}
                type="text"
              />
            </div>
          </div>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-3 ml-8">
          <button
            onClick={() => setShowAIAdd(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-outline-variant
                       text-[0.6875rem] font-bold tracking-[0.05em] uppercase
                       text-on-surface-variant hover:bg-surface-container transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">auto_fix_high</span>
            Save with AI
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="signature-gradient text-on-primary px-5 py-2 rounded-lg text-[0.6875rem] font-bold tracking-[0.05em] uppercase shadow-sm hover:opacity-90 transition-opacity"
          >
            Add Content
          </button>
        </div>
      </header>
      {showAdd && <AddContentModal onClose={() => setShowAdd(false)} />}
      {showAIAdd && <SaveWithAIModal onClose={() => setShowAIAdd(false)} />}
    </>
  );
}
