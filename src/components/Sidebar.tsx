import { NavLink, useLocation } from 'react-router-dom';
import { useSidebar } from '../contexts/SidebarContext';

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
];

const formatNav: NavItem[] = [
  { icon: 'description', label: 'Articles', to: '/articles' },
  { icon: 'play_circle', label: 'Videos', to: '/videos' },
  { icon: 'headphones', label: 'Audio', to: '/audio' },
];

export default function Sidebar() {
  const location = useLocation();
  const { collapsed, toggle } = useSidebar();

  const navLinkClass = (to: string) => {
    const active = location.pathname === to || (to === '/' && location.pathname === '/');
    return [
      'flex items-center transition-colors duration-300',
      collapsed ? 'justify-center px-0 py-3' : 'gap-3 px-8 py-3',
      active
        ? 'text-primary-container bg-surface-container border-l-4 border-primary-container'
        : 'text-on-surface-variant hover:text-primary-container hover:bg-surface-container',
    ].join(' ');
  };

  const labelClass = 'text-[0.6875rem] font-bold tracking-[0.05em] uppercase font-sans';

  return (
    <aside
      className={[
        'fixed left-0 top-0 h-full z-40 bg-surface-container-low hidden md:flex flex-col transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      ].join(' ')}
    >
      {/* Branding — hidden when collapsed */}
      {!collapsed && (
        <div className="px-8 py-8 mb-2">
          <h1 className="text-2xl font-headline italic text-primary-container">The Library</h1>
          <p className="text-[0.6875rem] font-bold tracking-[0.05em] uppercase text-on-secondary-container mt-1">
            Your Reading List
          </p>
        </div>
      )}

      {/* Spacer when collapsed so nav doesn't sit at very top */}
      {collapsed && <div className="h-8" />}

      <nav className="flex-1 space-y-0.5">
        {primaryNav.map((item) => (
          <NavLink key={item.to} to={item.to} className={navLinkClass(item.to)} end={item.to === '/'}>
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            {!collapsed && <span className={labelClass}>{item.label}</span>}
          </NavLink>
        ))}

        {!collapsed && (
          <div className="px-8 pt-6 pb-2">
            <p className="text-[0.6875rem] font-bold tracking-[0.05em] uppercase text-on-surface-variant/50">Format</p>
          </div>
        )}
        {collapsed && <div className="pt-4" />}

        {formatNav.map((item) => (
          <NavLink key={item.to} to={item.to} className={navLinkClass(item.to)}>
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            {!collapsed && <span className={labelClass}>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6 border-t border-outline-variant/30">
        <NavLink to="/settings/api-keys" className={navLinkClass("/settings/api-keys")}>
          <span className="material-symbols-outlined text-[20px]">key</span>
          {!collapsed && <span className={labelClass}>API Keys</span>}
        </NavLink>
        <NavLink to="/settings" className={navLinkClass("/settings")}>
          <span className="material-symbols-outlined text-[20px]">settings</span>
          {!collapsed && <span className={labelClass}>Settings</span>}
        </NavLink>

        {/* Toggle button */}
        <button
          onClick={toggle}
          className={[
            'w-full flex items-center py-4 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors duration-200',
            collapsed ? 'justify-center px-0' : 'gap-3 px-8',
          ].join(' ')}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <span className="material-symbols-outlined text-[20px]">
            {collapsed ? 'chevron_right' : 'chevron_left'}
          </span>
          {!collapsed && <span className={labelClass}>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
