import type { ReactNode } from 'react';
import {
  AlertTriangle,
  CarFront,
  Check,
  Clock3,
  Inbox,
  LoaderCircle,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';
import { faNum } from '../lib/format';

/* -------------------------------------------------------------------------- */
/* Page header                                                                 */
/* -------------------------------------------------------------------------- */
export function PageHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="animate-fade-up">
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {description && (
          <p className="muted mt-2 max-w-2xl text-sm leading-7">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Stat tile — used on the dashboard                                           */
/* -------------------------------------------------------------------------- */
export function StatTile({
  icon: Icon,
  label,
  value,
  hint,
  accent = false,
  delay = 0,
}: {
  icon: typeof CarFront;
  label: string;
  value: number;
  hint?: string;
  accent?: boolean;
  delay?: number;
}) {
  return (
    <article
      className="card card-hover animate-fade-up p-5"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between">
        <div
          className={`grid h-11 w-11 place-items-center rounded-2xl ${
            accent
              ? 'bg-wine/[.1] text-wine'
              : 'bg-[rgb(var(--gold)/.12)] text-[rgb(var(--gold))]'
          }`}
        >
          <Icon size={20} strokeWidth={2} />
        </div>
        {hint && <span className="chip">{hint}</span>}
      </div>
      <div className="mt-7 text-[2rem] font-extrabold leading-none tracking-tight tnum">
        {faNum(value)}
      </div>
      <div className="mt-2 text-sm font-medium">{label}</div>
    </article>
  );
}

/* -------------------------------------------------------------------------- */
/* Match score pill                                                            */
/* -------------------------------------------------------------------------- */
export function MatchScore({
  score = 0,
  compact = false,
}: {
  score?: number;
  compact?: boolean;
}) {
  const label = score >= 90 ? 'تطابق عالی' : score >= 75 ? 'تطابق بالا' : 'تطابق متوسط';
  const tone =
    score >= 90
      ? 'text-emerald-700 dark:text-emerald-300 border-emerald-600/20 bg-emerald-500/[.1]'
      : score >= 75
        ? 'text-[rgb(var(--gold))] border-[rgb(var(--gold)/.28)] bg-[rgb(var(--gold)/.1)]'
        : 'muted border-line bg-[rgb(var(--surface-2))]';
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold ${tone} ${
        compact ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm'
      }`}
    >
      <Check size={compact ? 12 : 14} strokeWidth={3} />
      <span className="tnum">
        {faNum(score)}٪{!compact && ` · ${label}`}
      </span>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Crawl run status badge                                                      */
/* -------------------------------------------------------------------------- */
export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string, ReactNode]> = {
    success: ['موفق', 'text-emerald-700 bg-emerald-500/10 border-emerald-600/15 dark:text-emerald-300', <Check size={13} strokeWidth={3} />],
    failed: ['ناموفق', 'text-red-700 bg-red-500/10 border-red-600/15 dark:text-red-300', <AlertTriangle size={12} />],
    partial: ['نیمه‌کامل', 'text-amber-700 bg-amber-500/10 border-amber-600/15 dark:text-amber-300', <AlertTriangle size={12} />],
    running: ['در حال اجرا', 'text-blue-700 bg-blue-500/10 border-blue-600/15 dark:text-blue-300', <LoaderCircle size={12} className="animate-spin" />],
  };
  const [label, cls, icon] = map[status] ?? [status, 'muted bg-[rgb(var(--surface-2))] border-line', null];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-bold ${cls}`}>
      {icon}
      {label}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/* Empty state                                                                 */
/* -------------------------------------------------------------------------- */
export function EmptyState({
  title,
  description,
  action,
  icon = 'empty',
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: 'empty' | 'car' | 'offline' | 'shield';
}) {
  const Icon = icon === 'car' ? CarFront : icon === 'offline' ? WifiOff : icon === 'shield' ? ShieldCheck : Inbox;
  return (
    <div className="card grid min-h-[19rem] place-items-center overflow-hidden p-8 text-center">
      <div className="max-w-md animate-fade-up">
        <div className="relative mx-auto grid h-20 w-20 place-items-center">
          <div className="absolute inset-0 rounded-full bg-wine/[.09]" />
          <div className="absolute inset-2 rounded-full bg-wine/[.08]" />
          <Icon size={30} className="relative text-wine" strokeWidth={1.75} />
        </div>
        <h2 className="mt-6 text-lg font-bold">{title}</h2>
        <p className="muted mx-auto mt-2 max-w-sm text-sm leading-7">{description}</p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Error state                                                                 */
/* -------------------------------------------------------------------------- */
export function ErrorState({ retry }: { retry?: () => void }) {
  return (
    <div className="rounded-3xl border border-red-500/25 bg-red-500/[.06] p-6">
      <div className="flex items-start gap-3.5">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-red-500/15 text-red-600 dark:text-red-400">
          <AlertTriangle size={20} />
        </div>
        <div>
          <p className="font-bold">در دریافت اطلاعات مشکلی پیش آمد</p>
          <p className="muted mt-1 text-sm leading-6">اتصال خود را بررسی کنید و دوباره تلاش کنید.</p>
          {retry && (
            <button className="btn-secondary mt-4 h-10 border-red-500/30 text-red-700 dark:text-red-300" onClick={retry}>
              تلاش دوباره
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Loading skeletons                                                           */
/* -------------------------------------------------------------------------- */
export function PageSkeleton() {
  return (
    <div className="space-y-8" aria-label="در حال بارگذاری" aria-busy="true">
      <div className="space-y-3">
        <div className="skeleton h-4 w-24" />
        <div className="skeleton h-9 w-56" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((x) => (
          <div key={x} className="card p-5">
            <div className="skeleton h-11 w-11 rounded-2xl" />
            <div className="skeleton mt-8 h-8 w-24" />
            <div className="skeleton mt-3 h-4 w-32" />
          </div>
        ))}
      </div>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {[0, 1, 2].map((x) => (
          <div key={x} className="card overflow-hidden">
            <div className="skeleton h-48 rounded-none" />
            <div className="space-y-3 p-5">
              <div className="skeleton h-5 w-4/5" />
              <div className="skeleton h-6 w-28" />
              <div className="skeleton h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Segmented control                                                           */
/* -------------------------------------------------------------------------- */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: ReactNode; title: string }[];
}) {
  return (
    <div className="inline-flex rounded-xl border border-line bg-[rgb(var(--surface-2))] p-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            title={o.title}
            aria-label={o.title}
            aria-pressed={active}
            onClick={() => onChange(o.value)}
            className={`grid h-9 min-w-9 place-items-center rounded-lg px-2.5 text-sm font-semibold transition ${
              active ? 'bg-[rgb(var(--surface))] text-wine shadow-soft' : 'muted hover:text-ink'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Timestamp with icon                                                         */
/* -------------------------------------------------------------------------- */
export function TimeStamp({ children }: { children: ReactNode }) {
  return (
    <span className="muted inline-flex items-center gap-1.5 text-xs">
      <Clock3 size={13} />
      {children}
    </span>
  );
}
