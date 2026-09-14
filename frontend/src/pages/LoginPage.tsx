import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  BellRing,
  Eye,
  EyeOff,
  Gauge,
  LoaderCircle,
  LogIn,
  ShieldCheck,
} from 'lucide-react';
import { api } from '../api/client';
import { BrandMark } from '../components/Brand';

const highlights = [
  { icon: Gauge, title: 'پایش بی‌وقفه', text: 'آگهی‌های دیوار هر ساعت به‌صورت خودکار بررسی می‌شوند.' },
  { icon: BellRing, title: 'اعلان فوری تلگرام', text: 'گزینه مناسب را همان لحظه، همراه تصویر و مشخصات دریافت کنید.' },
  { icon: ShieldCheck, title: 'امن و خصوصی', text: 'اطلاعات جستجوی شما محرمانه و تنها در اختیار خودتان است.' },
];

export default function LoginPage() {
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login/', { email, password });
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      nav('/');
    } catch {
      setError('ایمیل یا رمز عبور درست نیست.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid min-h-[100dvh] lg:grid-cols-2">
      {/* Brand / showcase panel */}
      <div
        className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between"
        style={{ background: 'radial-gradient(120% 120% at 15% 0%, #2a2320 0%, #171310 55%, #100d0b 100%)' }}
      >
        <span className="animate-float absolute -right-16 -top-20 h-72 w-72 rounded-full bg-wine/30 blur-3xl" />
        <span className="animate-float absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-[rgb(var(--gold)/.16)] blur-3xl" style={{ animationDelay: '-6s' }} />

        <div className="relative">
          <BrandMark size={52} />
          <p className="mt-10 max-w-md text-3xl font-extrabold leading-snug">
            خرید هوشمند خودرو،
            <br />
            <span className="text-[rgb(var(--gold))]">بدون جا ماندن از آگهی خوب.</span>
          </p>
          <p className="mt-4 max-w-md text-sm leading-7 text-white/60">
            خودروبان جستجوهای شما را می‌سازد، آگهی‌های دیوار را دائم می‌پاید و بهترین گزینه‌ها را برایتان پیدا می‌کند.
          </p>
        </div>

        <div className="relative space-y-4">
          {highlights.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[.04] p-4 backdrop-blur-sm"
            >
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/[.08] text-[rgb(var(--gold))]">
                <Icon size={20} />
              </div>
              <div>
                <div className="text-sm font-bold">{title}</div>
                <div className="mt-0.5 text-xs leading-6 text-white/55">{text}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Form panel */}
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm animate-fade-up">
          <div className="mb-8 lg:hidden">
            <BrandMark size={48} />
          </div>
          <p className="eyebrow">پنل کاربری</p>
          <h1 className="page-title mt-2">ورود به خودروبان</h1>
          <p className="muted mt-2 text-sm leading-7">
            برای مدیریت جستجوها و مشاهده آگهی‌های منطبق وارد شوید.
          </p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <label className="block">
              <span className="label">ایمیل</span>
              <input
                dir="ltr"
                type="email"
                autoComplete="email"
                className="field text-right"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </label>

            <label className="block">
              <span className="label">رمز عبور</span>
              <div className="relative">
                <input
                  dir="ltr"
                  type={show ? 'text' : 'password'}
                  autoComplete="current-password"
                  className="field pl-11 text-right"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShow((x) => !x)}
                  aria-label={show ? 'پنهان کردن رمز' : 'نمایش رمز'}
                  className="absolute left-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-[rgb(var(--muted))] hover:bg-[rgb(var(--foreground)/.06)]"
                >
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </label>

            {error && (
              <p className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/[.08] p-3 text-sm font-medium text-red-700 dark:text-red-300">
                <AlertTriangle size={16} />
                {error}
              </p>
            )}

            <button className="btn-primary h-12 w-full" disabled={loading}>
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" /> در حال ورود…
                </>
              ) : (
                <>
                  <LogIn size={18} /> ورود به داشبورد
                </>
              )}
            </button>
          </form>

          <p className="faint mt-8 text-center text-xs leading-6">
            با ورود، استفاده از سرویس را طبق قوانین دیوار و شرایط خودروبان می‌پذیرید.
          </p>
        </div>
      </div>
    </div>
  );
}
