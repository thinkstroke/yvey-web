'use client';

import { usePathname } from 'next/navigation';

const c = {
  bg:      '#0E0C09',
  card:    '#181410',
  gold:    '#C7AB78',
  cream:   '#F5F2EE',
  muted:   '#807A74',
  divider: '#2A251E',
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
    <div style={{ minHeight: '100vh', backgroundColor: c.bg }}>
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Barlow:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      {/* Navigation */}
      <nav style={{
        backgroundColor: c.card,
        borderBottom: `1px solid ${c.divider}`,
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: 64,
      }}>
        <a href="/" style={{
          fontSize: 16, fontWeight: 600, color: c.gold,
          letterSpacing: 6, textDecoration: 'none',
          fontFamily: "'Barlow', sans-serif",
        }}>
          YVEY
        </a>
        <div style={{ display: 'flex', gap: 28, alignItems: 'center' }}>
          {NAV_LINKS.map(link => {
            const isActive = pathname === link.href ||
              (link.href !== '/' && pathname.startsWith(link.href));
            return (
              <a key={link.href} href={link.href}
                style={{
                  color: isActive ? c.gold : c.muted,
                  textDecoration: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  letterSpacing: 2,
                  transition: 'color 0.2s',
                  fontFamily: "'Barlow', sans-serif",
                  textTransform: 'uppercase' as const,
                }}>
                {link.label}
              </a>
            );
          })}
        </div>
      </nav>

      {children}
    </div>
  );
}
