import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Bell,
  CarFront,
  ChartNoAxesCombined,
  History,
  LogOut,
  Menu,
  Moon,
  Search,
  Send,
  Settings,
  Sun,
  X,
} from 'lucide-react';
import { BrandWordmark } from '../components/Brand';

const links = [
  { icon: ChartNoAxesCombined, label: 'داشبورد', to: '/' },
  { icon: Search, label: 'جستجوهای من', to: '/searches' },
  { icon: CarFront, label: 'آگهی‌های پیدا شده', to: '/listings' },
  { icon: Send, label: 'اتصال تلگرام', to: '/telegram' },
  { icon: History, label: 'تاریخچه بررسی‌ها', to: '/history' },
  { icon: Settings, label: 'تنظیمات', to: '/settings' },
] as const;

function useTheme() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);
  return [dark, setDark] as const;
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-2 pb-6 pt-2">
        <BrandWordmark />
      </div>

      <nav className="space-y-1">
        <p className="eyebrow px-3 pb-2 pt-1">منو</p>
        {links.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            onClick={onNavigate}
            className={({ isActive }) =>
              `group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition ${
                isActive
                  ? 'bg-wine/[.09] text-wine'
                  : 'muted hover:bg-[rgb(var(--foreground)/.045)] hover:text-ink'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`absolute right-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-l-full bg-wine transition-all ${
                    isActive ? 'opacity-100' : 'opacity-0'
                  }`}
                />
                <Icon size={19} strokeWidth={2} />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto pt-6">
        <div className="card-inset relative overflow-hidden p-4">
          <span className="absolute -left-6 -top-8 h-20 w-20 rounded-full bg-emerald-500/10 blur-2xl" />
          <div className="relative flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            سامانه فعال است
          </div>
          <p className="muted mt-1.5 text-[11px] leading-5">
            پایش خودکار جستجوها در حال انجام است.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const [dark, setDark] = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => setOpen(false), [location.pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    navigate('/login');
  };

  return (
    <div className="min-h-[100dvh] lg:grid lg:grid-cols-[264px_1fr]">
      {/* Desktop sidebar */}
      <aside
        className="sticky top-0 hidden h-[100dvh] border-l p-5 lg:block"
        style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--surface))' }}
        aria-label="ناوبری اصلی"
      >
        <SidebarContent />
      </aside>

      {/* Mobile drawer */}
      <div
        className={`fixed inset-0 z-50 lg:hidden ${open ? '' : 'pointer-events-none'}`}
        aria-hidden={!open}
      >
        <button
          aria-label="بستن منو"
          tabIndex={open ? 0 : -1}
          className={`absolute inset-0 bg-black/55 backdrop-blur-sm transition-opacity duration-300 ${
            open ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute inset-y-0 right-0 w-[290px] border-l p-5 shadow-lift transition-transform duration-300 ease-premium ${
            open ? 'translate-x-0' : 'translate-x-full'
          }`}
          style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--surface))' }}
        >
          <button
            aria-label="بستن منو"
            onClick={() => setOpen(false)}
            className="icon-btn absolute left-3 top-3"
          >
            <X size={20} />
          </button>
          <SidebarContent onNavigate={() => setOpen(false)} />
        </aside>
      </div>

      {/* Main column */}
      <div className="flex min-w-0 flex-col">
        <header
          className="glass sticky top-0 z-30 flex h-16 items-center justify-between border-b px-4 md:px-7"
          style={{ borderColor: 'rgb(var(--border))' }}
        >
          <div className="flex items-center gap-2">
            <button
              className="icon-btn lg:hidden"
              aria-label="باز کردن منو"
              onClick={() => setOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div className="hidden sm:block">
              <div className="text-sm font-bold">سلام، خوش آمدید 👋</div>
              <div className="faint text-[11px]">فرصت خوب خرید را از دست ندهید.</div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className="hidden items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/[.08] px-3 py-1.5 text-xs font-semibold text-emerald-700 sm:flex dark:text-emerald-300">
              <span className="status-dot bg-emerald-500" />
              سیستم فعال
            </div>
            <button
              className="icon-btn"
              aria-label={dark ? 'حالت روشن' : 'حالت تاریک'}
              onClick={() => setDark((x) => !x)}
            >
              {dark ? <Sun size={19} /> : <Moon size={19} />}
            </button>
            <button className="icon-btn relative" aria-label="اعلان‌ها">
              <Bell size={19} />
              <span className="absolute left-2.5 top-2.5 h-2 w-2 rounded-full bg-wine ring-2 ring-[rgb(var(--surface))]" />
            </button>
            <button className="icon-btn" aria-label="خروج از حساب" onClick={logout}>
              <LogOut size={19} />
            </button>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1440px] flex-1 p-4 pb-14 md:p-7 lg:p-9">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
