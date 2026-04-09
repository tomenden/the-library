import { useState } from "react";
import AddContentModal from "./AddContentModal";

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

      <div className="flex items-center gap-6 ml-8">
        <button
          onClick={() => setShowAdd(true)}
          className="signature-gradient text-on-primary px-5 py-2 rounded-lg text-[0.6875rem] font-bold tracking-[0.05em] uppercase shadow-sm hover:opacity-90 transition-opacity"
        >
          Add Content
        </button>
        <div className="flex items-center gap-4 text-on-surface-variant">
          <button className="hover:text-primary transition-colors">
            <span className="material-symbols-outlined">notifications</span>
          </button>
          <button className="w-8 h-8 rounded-full bg-surface-container-high overflow-hidden">
            <span className="material-symbols-outlined text-[32px] leading-none">account_circle</span>
          </button>
        </div>
      </div>
    </header>
      {showAdd && <AddContentModal onClose={() => setShowAdd(false)} />}
    </>
  );
}
