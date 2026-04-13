import { NavLink, useLocation } from 'react-router-dom';

interface NavItem {
  icon: string;
  label: string;
  to: string;
}

const navItems: NavItem[] = [
  { icon: 'auto_stories', label: 'Library', to: '/' },
  { icon: 'settings', label: 'Settings', to: '/settings' },
  { icon: 'key', label: 'API Keys', to: '/settings/api-keys' },
];

export default function Sidebar() {
  const location = useLocation();

  const navLinkClass = (to: string) => {
    const active = to === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(to);
    return [
      'flex items-center gap-3 px-6 py-2.5 transition-colors duration-200 text-[0.75rem] font-medium tracking-wide',
      active
        ? 'text-primary-container'
        : 'text-on-surface-variant/70 hover:text-primary-container',
    ].join(' ');
  };

  return (
    <aside className="fixed left-0 top-0 h-full z-40 w-48 bg-surface-container-low hidden md:flex flex-col">
      {/* Branding */}
      <div className="px-6 pt-8 pb-6">
        <h1 className="text-xl font-headline italic text-primary-container leading-tight">
          The Library
        </h1>
        <p className="text-[0.6rem] font-bold tracking-[0.12em] uppercase text-on-surface-variant/50 mt-0.5">
          Personal Edition
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 mt-2">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} className={navLinkClass(item.to)} end={item.to === '/'}>
            <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
