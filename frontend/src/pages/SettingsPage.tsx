import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Monitor, Moon, Sun } from 'lucide-react';
import { PageHeader } from '../components/ui';

type ThemePref = 'light' | 'dark' | 'system';

function applyTheme(pref: ThemePref) {
  const isDark = pref === 'dark' || (pref === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark', !!isDark);
  if (pref === 'system') localStorage.removeItem('theme');
  else localStorage.setItem('theme', pref);
}

export default function SettingsPage() {
  const nav = useNavigate();
  const [pref, setPref] = useState<ThemePref>(() => (localStorage.getItem('theme') as ThemePref) || 'system');

  useEffect(() => applyTheme(pref), [pref]);

  const options: { value: ThemePref; label: string; icon: typeof Sun }[] = [
    { value: 'light', label: 'روشن', icon: Sun },
    { value: 'dark', label: 'تاریک', icon: Moon },
    { value: 'system', label: 'سیستم', icon: Monitor },
  ];

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    nav('/login');
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader eyebrow="حساب کاربری" title="تنظیمات" description="ترجیحات نمایش و حساب خود را مدیریت کنید." />

      <section className="card p-6">
        <h2 className="section-title">حالت نمایش</h2>
        <p className="muted mt-1.5 text-sm leading-7">ظاهر برنامه را انتخاب کنید یا با تنظیمات دستگاه هماهنگ کنید.</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          {options.map(({ value, label, icon: Icon }) => {
            const active = pref === value;
            return (
              <button
                key={value}
                onClick={() => setPref(value)}
                aria-pressed={active}
                className={`card-inset flex items-center gap-3 p-4 text-right transition ${
                  active ? 'border-wine/40 bg-wine/[.06] ring-1 ring-wine/30' : 'hover:border-[rgb(var(--muted)/.4)]'
                }`}
              >
                <span className={`grid h-10 w-10 place-items-center rounded-xl ${active ? 'bg-wine/[.12] text-wine' : 'bg-[rgb(var(--surface))] text-[rgb(var(--muted))]'}`}>
                  <Icon size={19} />
                </span>
                <span className="font-semibold">{label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="card p-6">
        <h2 className="section-title">حساب کاربری</h2>
        <p className="muted mt-1.5 text-sm leading-7">
          مدیریت پروفایل، تغییر رمز عبور و تنظیمات اعلان در نسخه‌های بعدی اضافه می‌شود.
        </p>
        <button className="btn-secondary mt-5 text-red-600 hover:border-red-500/40 dark:text-red-400" onClick={logout}>
          <LogOut size={17} /> خروج از حساب
        </button>
      </section>
    </div>
  );
}
