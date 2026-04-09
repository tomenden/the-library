import { NavLink, useLocation } from 'react-router-dom';

interface NavItem {
  icon: string;
  label: string;
  to: string;
}

const primaryNav: NavItem[] = [
  { icon: 'dashboard', label: 'All', to: '/' },
  { icon: 'search', label: 'Explore', to: '/explore' },
  { icon: 'mark_as_unread', label: 'Unread', to: '/unread' },
  { icon: 'star', label: 'Favorites', to: '/favorites' },
  { icon: 'archive', label: 'Archive', to: '/archive' },
];

const formatNav: NavItem[] = [
  { icon: 'description', label: 'Articles', to: '/articles' },
  { icon: 'play_circle', label: 'Videos', to: '/videos' },
  { icon: 'headphones', label: 'Audio', to: '/audio' },
];

export interface SidebarProps {
  readonly showAddButton?: boolean;
}

export default function Sidebar({ showAddButton = false }: SidebarProps) {
  const location = useLocation();

  const navLinkClass = (to: string) => {
    const active = location.pathname === to || (to === '/' && location.pathname === '/');
    return [
      'flex items-center gap-3 px-8 py-3 transition-colors duration-300',
      active
        ? 'text-primary-container bg-surface-container border-l-4 border-primary-container'
        : 'text-on-surface-variant hover:text-primary-container hover:bg-surface-container',
    ].join(' ');
  };

  const labelClass = 'text-[0.6875rem] font-bold tracking-[0.05em] uppercase font-sans';

  return (
    <aside className="fixed left-0 top-0 h-full z-40 w-64 bg-surface-container-low border-r-0 flex flex-col">
      <div className="px-8 py-8 mb-2">
        <h1 className="text-2xl font-headline italic text-primary-container">The Gallery</h1>
        <p className="text-[0.6875rem] font-bold tracking-[0.05em] uppercase text-on-secondary-container mt-1">
          Premium Curation
        </p>
      </div>

      <nav className="flex-1 space-y-0.5">
        {primaryNav.map((item) => (
          <NavLink key={item.to} to={item.to} className={navLinkClass(item.to)} end={item.to === '/'}>
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className={labelClass}>{item.label}</span>
          </NavLink>
        ))}

        <div className="px-8 pt-6 pb-2">
          <p className="text-[0.6875rem] font-bold tracking-[0.05em] uppercase text-on-surface-variant/50">Format</p>
        </div>

        {formatNav.map((item) => (
          <NavLink key={item.to} to={item.to} className={navLinkClass(item.to)}>
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span className={labelClass}>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {showAddButton && (
        <div className="px-8 pb-4">
          <button className="w-full py-3 px-4 signature-gradient text-on-primary rounded-xl text-[0.6875rem] font-bold uppercase tracking-[0.05em]">
            + Add New Content
          </button>
        </div>
      )}

      <div className="mt-auto pt-6 border-t border-outline-variant/30">
        <a href="#" className="flex items-center gap-3 px-8 py-3 text-on-surface-variant hover:text-primary-container hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span className={labelClass}>Settings</span>
        </a>
        <a href="#" className="flex items-center gap-3 px-8 py-3 text-on-surface-variant hover:text-primary-container hover:bg-surface-container transition-colors">
          <span className="material-symbols-outlined text-[20px]">help</span>
          <span className={labelClass}>Support</span>
        </a>
      </div>
    </aside>
  );
}
