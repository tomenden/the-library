import { useState } from "react";
import { NavLink } from "react-router-dom";
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
  const [manualUrl, setManualUrl] = useState("");

  function handleSwitchToManual(url: string) {
    setShowAIAdd(false);
    setManualUrl(url);
    setShowAdd(true);
  }

  return (
    <>
      {/* Mobile header */}
      <header className="md:hidden flex items-center justify-between px-6 h-14 bg-background/80 backdrop-blur-2xl sticky top-0 z-50">
        <button
          onClick={() => setShowAIAdd(true)}
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
          aria-label="Add with AI"
        >
          <span className="material-symbols-outlined text-[22px]">add</span>
        </button>
        <h1 className="font-headline italic text-xl text-primary-container tracking-tight">
          The Library
        </h1>
        <NavLink
          to="/settings"
          className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
          aria-label="Settings"
        >
          <span className="material-symbols-outlined text-[22px]">account_circle</span>
        </NavLink>
      </header>

      {/* Desktop header */}
      <header className="hidden md:flex justify-between items-center px-8 w-full sticky top-0 h-16 bg-background/80 backdrop-blur-2xl z-50">
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
            Add with AI
          </button>
          <button
            onClick={() => setShowAdd(true)}
            className="signature-gradient text-on-primary px-5 py-2 rounded-lg text-[0.6875rem] font-bold tracking-[0.05em] uppercase shadow-sm hover:opacity-90 transition-opacity"
          >
            Add Content
          </button>
        </div>
      </header>

      {showAdd && (
        <AddContentModal
          onClose={() => { setShowAdd(false); setManualUrl(""); }}
          initialUrl={manualUrl}
        />
      )}
      {showAIAdd && (
        <SaveWithAIModal
          onClose={() => setShowAIAdd(false)}
          onSwitchToManual={handleSwitchToManual}
        />
      )}
    </>
  );
}
