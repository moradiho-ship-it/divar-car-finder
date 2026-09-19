import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  Copy,
  ImageIcon,
  Pause,
  Pencil,
  Play,
  Plus,
  RefreshCw,
  Search,
  Tag,
  Trash2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { faDate, faNum, money } from '../lib/format';
import type { Paginated, SearchProfile } from '../types';
import { EmptyState, ErrorState, PageHeader, PageSkeleton } from '../components/ui';

type Action = 'delete' | 'run' | 'duplicate' | 'toggle' | 'images';

export default function SearchesPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['searches'],
    queryFn: () => api.get<Paginated<SearchProfile>>('/searches/').then((r) => r.data),
  });

  const mutate = useMutation({
    mutationFn: ({ id, action, payload }: { id: number; action: Action; payload?: unknown }) =>
      action === 'delete'
        ? api.delete(`/searches/${id}/`)
        : action === 'run'
          ? api.post(`/searches/${id}/run/`)
          : action === 'duplicate'
            ? api.post(`/searches/${id}/duplicate/`)
            : api.patch(`/searches/${id}/`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['searches'] }),
  });

  if (isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="پایش خودکار"
        title="جستجوهای من"
        description="معیارهای دقیق را تعریف کنید؛ باقی کار با خودروبان."
        action={
          <Link to="/searches/new" className="btn-primary">
            <Plus size={18} /> جستجوی جدید
          </Link>
        }
      />

      {isError ? (
        <ErrorState retry={() => refetch()} />
      ) : !data?.results.length ? (
        <EmptyState
          title="اولین شکار هوشمندتان را بسازید"
          description="برند، بودجه و ویژگی‌های خودرو را وارد کنید تا آگهی‌های جدید را برایتان پیدا کنیم."
          action={
            <Link to="/searches/new" className="btn-primary">
              <Plus size={18} /> ساخت اولین جستجو
            </Link>
          }
        />
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {data.results.map((p, i) => {
            const spec = [
              p.brand,
              (p.models?.length ? p.models : p.model ? [p.model] : []).join('، '),
              (p.trims?.length ? p.trims : p.trim ? [p.trim] : []).join('، '),
            ].filter(Boolean).join(' · ') || 'همه خودروها';
            return (
              <article
                key={p.id}
                className="card card-hover animate-fade-up flex flex-col p-5"
                style={{ animationDelay: `${i * 45}ms` }}
              >
                {/* Head */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-[1.05rem] font-bold">{p.title}</h3>
                    <p className="muted mt-1 flex items-center gap-1.5 truncate text-sm">
                      <Tag size={13} className="shrink-0" />
                      {spec}
                    </p>
                  </div>
                  <span
                    className={`chip shrink-0 ${
                      p.is_active
                        ? 'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : ''
                    }`}
                  >
                    <span className={`status-dot ${p.is_active ? 'bg-emerald-500' : 'bg-[rgb(var(--faint))]'}`} />
                    {p.is_active ? 'فعال' : 'متوقف'}
                  </span>
                </div>

                {/* Stats */}
                <div className="card-inset my-5 grid grid-cols-2 gap-3 p-4 text-sm">
                  <div>
                    <span className="faint block text-xs">بازه قیمت</span>
                    <span className="mt-1 block font-semibold tnum">
                      {money(p.min_price)}
                      <span className="muted"> تا </span>
                      {money(p.max_price)}
                    </span>
                  </div>
                  <div>
                    <span className="faint block text-xs">نتایج</span>
                    <span className="mt-1 block font-semibold">
                      <span className="tnum">{faNum(p.matches_count)}</span> آگهی
                    </span>
                  </div>
                </div>

                <p className="faint flex items-center gap-1.5 text-xs">
                  <CalendarClock size={13} />
                  آخرین بررسی: {faDate(p.last_checked_at)}
                </p>

                <label className="muted mt-4 flex cursor-pointer items-center gap-2.5 text-sm">
                  <input
                    type="checkbox"
                    className="check"
                    checked={p.send_images}
                    disabled={mutate.isPending}
                    onChange={() => mutate.mutate({ id: p.id, action: 'images', payload: { send_images: !p.send_images } })}
                  />
                  <ImageIcon size={15} />
                  ارسال عکس‌ها به‌صورت آلبوم
                </label>

                {/* Actions */}
                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <button
                    className="btn-primary h-10 flex-1"
                    disabled={mutate.isPending}
                    onClick={() => mutate.mutate({ id: p.id, action: 'run' })}
                  >
                    <RefreshCw size={16} className={mutate.isPending ? 'animate-spin' : ''} /> بررسی الان
                  </button>
                  <Link to={`/searches/${p.id}/edit`} className="btn-secondary h-10 px-3" title="ویرایش معیارها" aria-label="ویرایش">
                    <Pencil size={16} />
                  </Link>
                  <button
                    className="btn-secondary h-10 px-3"
                    title={p.is_active ? 'توقف پایش' : 'فعال‌سازی'}
                    aria-label="فعال/غیرفعال"
                    onClick={() => mutate.mutate({ id: p.id, action: 'toggle', payload: { is_active: !p.is_active } })}
                  >
                    {p.is_active ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button
                    className="btn-secondary h-10 px-3"
                    title="کپی جستجو"
                    aria-label="کپی"
                    onClick={() => mutate.mutate({ id: p.id, action: 'duplicate' })}
                  >
                    <Copy size={16} />
                  </button>
                  <button
                    className="btn-secondary h-10 px-3 text-red-600 hover:border-red-500/40 dark:text-red-400"
                    title="حذف جستجو"
                    aria-label="حذف"
                    onClick={() => confirm('این جستجو حذف شود؟') && mutate.mutate({ id: p.id, action: 'delete' })}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
