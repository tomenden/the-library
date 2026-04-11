import { NavLink, useLocation } from 'react-router-dom';

const tabs = [
  { icon: 'auto_stories', label: 'Library', to: '/' },
  { icon: 'search', label: 'Explore', to: '/explore' },
  { icon: 'mark_as_unread', label: 'Unread', to: '/unread' },
];

export default function BottomNav() {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden flex justify-around items-center px-8 pt-4 rounded-t-3xl bg-surface-container-low/90 backdrop-blur-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.04)]" style={{ paddingBottom: 'max(2rem, env(safe-area-inset-bottom))' }}>
      {tabs.map(({ icon, label, to }) => {
        const active =
          to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
        return (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className="flex flex-col items-center gap-0.5 transition-all duration-300"
          >
            <span
              className={`material-symbols-outlined text-[24px] ${active ? 'text-primary-container' : 'text-on-surface-variant/50'}`}
              style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
            >
              {icon}
            </span>
            <span
              className={`text-[10px] font-bold tracking-widest uppercase font-sans ${active ? 'text-primary-container' : 'text-on-surface-variant/50'}`}
            >
              {label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
