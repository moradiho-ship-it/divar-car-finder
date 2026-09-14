import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  BellRing,
  Check,
  CheckCircle2,
  ExternalLink,
  LoaderCircle,
  LockKeyhole,
  Send,
  ShieldCheck,
  Unplug,
} from 'lucide-react';
import { api } from '../api/client';
import { faDate } from '../lib/format';
import { ErrorState, PageHeader, PageSkeleton } from '../components/ui';

const TELEGRAM = '#229ed9';

export default function TelegramPage() {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ['telegram'],
    refetchInterval: 10000,
    queryFn: () => api.get('/telegram/status/').then((r) => r.data),
  });
  const connect = useMutation({
    mutationFn: () => api.post('/telegram/connect/').then((r) => r.data),
    onSuccess: (d) => {
      if (d.deep_link) window.open(d.deep_link, '_blank');
    },
  });
  const disconnect = useMutation({
    mutationFn: () => api.delete('/telegram/disconnect/'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['telegram'] }),
  });

  if (q.isLoading) return <PageSkeleton />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="اعلان‌های فوری"
        title="اتصال تلگرام"
        description="گزینه مناسب را همان لحظه، همراه تصویر و دلیل تطابق دریافت کنید."
      />

      {q.isError ? (
        <ErrorState retry={() => q.refetch()} />
      ) : q.data?.connected ? (
        <div className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <section className="card p-6 md:p-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <CheckCircle2 size={32} />
              </div>
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <h2 className="text-xl font-bold">تلگرام متصل است</h2>
                  <span className="status-dot bg-emerald-500" />
                </div>
                <p className="muted text-sm leading-7">
                  اعلان‌ها بدون وقفه به{' '}
                  <span className="font-semibold text-[rgb(var(--foreground))] ltr">
                    {q.data.username ? `@${q.data.username}` : 'حساب شما'}
                  </span>{' '}
                  ارسال می‌شوند.
                </p>
              </div>
            </div>

            <div className="card-inset mt-7 divide-y" style={{ borderColor: 'rgb(var(--border))' }}>
              {[
                ['وضعیت اتصال', 'سالم'],
                ['اتصال از', faDate(q.data.connected_at)],
                ['آخرین اعلان موفق', faDate(q.data.last_notification_at)],
              ].map(([a, b]) => (
                <div key={a} className="flex items-center justify-between px-4 py-3.5 text-sm">
                  <span className="muted">{a}</span>
                  <span className="font-semibold">{b}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button className="btn-secondary">
                <BellRing size={17} /> ارسال اعلان آزمایشی
              </button>
              <button
                className="btn-ghost text-red-600 dark:text-red-400"
                disabled={disconnect.isPending}
                onClick={() => confirm('اتصال تلگرام قطع شود؟') && disconnect.mutate()}
              >
                <Unplug size={17} /> قطع اتصال
              </button>
            </div>
          </section>

          <aside className="card p-6">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck size={24} />
            </div>
            <h3 className="mt-4 font-bold">اتصال امن و خصوصی</h3>
            <p className="muted mt-2 text-sm leading-7">
              خودروبان فقط اعلان‌های جستجو را ارسال می‌کند و به پیام‌ها یا مخاطبان شما دسترسی ندارد.
            </p>
          </aside>
        </div>
      ) : (
        <section className="card overflow-hidden">
          <div className="grid lg:grid-cols-[1fr_.9fr]">
            <div className="p-6 md:p-9">
              <div className="grid h-14 w-14 place-items-center rounded-2xl" style={{ background: `${TELEGRAM}1a`, color: TELEGRAM }}>
                <Send size={27} />
              </div>
              <h2 className="mt-6 text-2xl font-extrabold">فرصت خوب را زودتر ببینید</h2>
              <p className="muted mt-3 max-w-lg text-sm leading-7">
                هر آگهی منطبق همراه با تصویر، قیمت، مشخصات، امتیاز تطابق و لینک مستقیم برایتان ارسال می‌شود.
              </p>
              <button
                className="btn-primary mt-7 h-12"
                style={{ background: TELEGRAM, boxShadow: `0 8px 20px -8px ${TELEGRAM}` }}
                disabled={connect.isPending}
                onClick={() => connect.mutate()}
              >
                {connect.isPending ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" /> در حال آماده‌سازی…
                  </>
                ) : (
                  <>
                    باز کردن ربات تلگرام <ExternalLink size={17} />
                  </>
                )}
              </button>
              <p className="faint mt-4 flex items-center gap-2 text-xs">
                <LockKeyhole size={14} /> قطع اتصال هر زمان ممکن است.
              </p>
            </div>

            <div className="border-r p-6 md:p-9" style={{ background: 'rgb(var(--surface-2))', borderColor: 'rgb(var(--border))' }}>
              <p className="eyebrow">سه قدم تا اتصال</p>
              <ol className="mt-6 space-y-5">
                {[
                  'روی «باز کردن ربات تلگرام» بزنید.',
                  'در تلگرام دکمه Start را انتخاب کنید.',
                  'به این صفحه برگردید؛ وضعیت خودکار به‌روز می‌شود.',
                ].map((step, i) => (
                  <li key={step} className="flex gap-3 text-sm leading-7">
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-wine/[.1] text-xs font-bold text-wine tnum">
                      {i + 1}
                    </span>
                    <span>{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-7 flex items-center gap-2 rounded-xl border border-emerald-500/15 bg-emerald-500/[.08] p-3 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                <Check size={15} /> اعلان‌ها پس از اتصال جستجوها فعال می‌شوند.
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
