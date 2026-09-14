import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, ChevronDown } from 'lucide-react';
import { Fragment, useState } from 'react';
import { api } from '../api/client';
import { faDate, faNum } from '../lib/format';
import type { Paginated } from '../types';
import { EmptyState, ErrorState, PageHeader, PageSkeleton, StatusBadge } from '../components/ui';

type Run = {
  id: number;
  search_title: string;
  started_at: string;
  duration_seconds: number | null;
  listings_scanned: number;
  matches_found: number;
  new_matches: number;
  status: string;
  error_message: string;
};

const COLS = ['جستجو', 'زمان شروع', 'مدت', 'بررسی‌شده', 'منطبق', 'جدید', 'وضعیت', ''];

export default function HistoryPage() {
  const [expanded, setExpanded] = useState<number | null>(null);
  const q = useQuery({
    queryKey: ['runs'],
    refetchInterval: 15000,
    queryFn: () => api.get<Paginated<Run>>('/crawl-runs/').then((r) => r.data),
  });

  if (q.isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="پایش سیستم"
        title="تاریخچه بررسی‌ها"
        description="نمای عملیاتی پایش‌ها، نتیجه هر اجرا و خطاهای قابل پیگیری."
      />

      {q.isError ? (
        <ErrorState retry={() => q.refetch()} />
      ) : !q.data?.results.length ? (
        <EmptyState
          title="هنوز بررسی‌ای ثبت نشده"
          description="پس از اجرای اولین جستجو، وضعیت و نتیجه آن را در این بخش خواهید دید."
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-right text-sm">
              <thead>
                <tr className="border-b text-xs" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--surface-2))' }}>
                  {COLS.map((h, i) => (
                    <th key={i} className="muted px-5 py-4 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {q.data.results.map((r) => (
                  <Fragment key={r.id}>
                    <tr className="border-b transition last:border-0 hover:bg-[rgb(var(--surface-2))]" style={{ borderColor: 'rgb(var(--border))' }}>
                      <td className="px-5 py-4 font-semibold">{r.search_title}</td>
                      <td className="muted px-5 py-4">{faDate(r.started_at)}</td>
                      <td className="px-5 py-4 tnum">
                        {r.duration_seconds == null ? '—' : `${faNum(Math.round(r.duration_seconds))} ثانیه`}
                      </td>
                      <td className="px-5 py-4 tnum">{faNum(r.listings_scanned)}</td>
                      <td className="px-5 py-4 tnum">{faNum(r.matches_found)}</td>
                      <td className="px-5 py-4 font-bold text-emerald-700 tnum dark:text-emerald-300">{faNum(r.new_matches)}</td>
                      <td className="px-5 py-4">
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-3 py-3">
                        {r.error_message && (
                          <button
                            aria-label="نمایش جزئیات خطا"
                            aria-expanded={expanded === r.id}
                            className="icon-btn h-9 w-9"
                            onClick={() => setExpanded(expanded === r.id ? null : r.id)}
                          >
                            <ChevronDown size={17} className={`transition-transform ${expanded === r.id ? 'rotate-180' : ''}`} />
                          </button>
                        )}
                      </td>
                    </tr>
                    {expanded === r.id && (
                      <tr className="border-b" style={{ borderColor: 'rgb(var(--border))' }}>
                        <td colSpan={COLS.length} className="border-r-2 border-red-500/50 bg-red-500/[.05] px-5 py-4">
                          <p className="flex items-center gap-2 text-sm font-bold text-red-700 dark:text-red-300">
                            <AlertTriangle size={15} /> علت توقف بررسی
                          </p>
                          <p className="muted mt-2 text-xs leading-6">{r.error_message}</p>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
