import { useState } from "react";
import { NavLink } from "react-router-dom";
import AddContentModal from "./AddContentModal";
import SaveWithAIModal from "./SaveWithAIModal";

export default function TopBar() {
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
      <header className="md:hidden flex items-center justify-between px-5 h-14 bg-background/80 backdrop-blur-2xl sticky top-0 z-50">
        <h1 className="font-headline italic text-lg text-primary-container tracking-tight">
          The Library
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAIAdd(true)}
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
            aria-label="Add with AI"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
          </button>
          <NavLink
            to="/settings"
            className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
            aria-label="Settings"
          >
            <span className="material-symbols-outlined text-[20px]">account_circle</span>
          </NavLink>
        </div>
      </header>

      {/* Desktop header */}
      <header className="hidden md:flex justify-between items-center px-8 w-full sticky top-0 h-14 bg-background/80 backdrop-blur-2xl z-50">
        <p className="text-sm text-on-surface-variant/60 font-medium tracking-wide">Gallery</p>

        <div className="flex items-center gap-3">
          <NavLink
            to="/explore"
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant"
            aria-label="Search"
          >
            <span className="material-symbols-outlined text-[20px]">search</span>
          </NavLink>
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
