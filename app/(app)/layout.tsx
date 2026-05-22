'use client';

import { usePathname } from 'next/navigation';

const colors = {
  bg: '#111009',
  card: '#1C1914',
  gold: '#C7AB78',
  cream: '#F5F2EE',
  muted: '#807A74',
  divider: '#332F29',
};

const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/book', label: 'Book' },
  { href: '/events', label: 'Events' },
  { href: '/shop', label: 'Shop' },
  { href: '/profile', label: 'Profile' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: colors.bg }}>
      {/* Navigation */}
      <nav style={{
        backgroundColor: colors.card,
        borderBottom: `1px solid ${colors.divider}`,
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
      }}>
        <a href="/" style={{
          fontSize: 18, fontWeight: 700, color: colors.gold,
          letterSpacing: 6, textDecoration: 'none',
        }}>
          YVEY
        </a>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {NAV_LINKS.map(link => {
            const isActive = pathname === link.href ||
              (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <a
                key={link.href}
                href={link.href}
                style={{
                  color: isActive ? colors.gold : colors.muted,
                  textDecoration: 'none',
                  fontSize: 13,
                  fontWeight: 600,
                  letterSpacing: 1.5,
                  transition: 'color 0.2s',
                }}
              >
                {link.label.toUpperCase()}
              </a>
            );
          })}
        </div>
      </nav>

      {/* Page content */}
      {children}
    </div>
  );
}
