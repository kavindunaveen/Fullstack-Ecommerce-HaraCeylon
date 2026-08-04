'use client';
import { useAuthStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ShoppingBag, Package, Settings, Users, ArrowLeft, Tag } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === '/admin/login') return;
    
    if (!isAuthenticated) {
      router.push(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
    } else if (user && !user.is_staff) {
      router.push('/account');
    }
  }, [isAuthenticated, user, router, pathname]);

  if (pathname !== '/admin/login' && (!isAuthenticated || !user || !user.is_staff)) return null;

  const navItems = [
    { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { label: 'Orders', href: '/admin/orders', icon: ShoppingBag },
    { label: 'Products', href: '/admin/products', icon: Package },
    { label: 'Categories', href: '/admin/categories', icon: Tag },
    { label: 'Customers', href: '/admin/customers', icon: Users },
    { label: 'Hero Slides', href: '/admin/hero', icon: LayoutDashboard },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  if (pathname === '/admin/login') return <>{children}</>;

  return (
    <div className="admin-layout" style={{ zIndex: 1000, position: 'relative' }}>
      <aside className="admin-sidebar">
        <div className="admin-sidebar__logo">
          HARA <span>ADMINISTRATION</span>
        </div>
        <nav className="admin-nav">
          <div className="admin-nav-group">Main Menu</div>
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className={`admin-nav-item ${pathname === item.href ? 'active' : ''}`}>
              <item.icon size={18} /> {item.label}
            </Link>
          ))}
          <div className="admin-nav-group mt-6">System</div>
          <Link href="/" className="admin-nav-item text-gray-400">
            <ArrowLeft size={18} /> Back to Store
          </Link>
        </nav>
      </aside>
      <main className="admin-main bg-gray-50">
        <header className="admin-topbar shadow-sm">
          <div className="admin-topbar__title text-brand-dark font-serif">Management Portal</div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-gray-600">{user?.email}</span>
            <div className="w-8 h-8 rounded-full bg-brand-gold text-white flex items-center justify-center font-bold text-sm">
              {user?.first_name?.[0]}{user?.last_name?.[0]}
            </div>
          </div>
        </header>
        <div className="admin-content">
          {children}
        </div>
      </main>
    </div>
  );
}
