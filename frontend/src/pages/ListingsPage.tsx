import { useDeferredValue, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCheck, Grid2X2, LayoutList, Search, Trash2, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { faDate, faNum, money } from '../lib/format';
import type { Listing, Paginated } from '../types';
import VehicleCard from '../components/VehicleCard';
import { EmptyState, ErrorState, MatchScore, PageHeader, PageSkeleton, Segmented } from '../components/ui';

const SORTS = [
  { value: '-discovered_at', label: 'جدیدترین' },
  { value: '-matches__match_score', label: 'بیشترین تطابق' },
  { value: 'price', label: 'کمترین قیمت' },
  { value: '-price', label: 'بیشترین قیمت' },
  { value: 'mileage', label: 'کمترین کارکرد' },
  { value: '-year', label: 'جدیدترین مدل' },
];

export default function ListingsPage() {
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [q, setQ] = useState('');
  const search = useDeferredValue(q);
  const [ordering, setOrdering] = useState('-discovered_at');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ['listings', search, ordering],
    queryFn: () =>
      api.get<Paginated<Listing>>('/listings/', { params: { q: search, ordering } }).then((r) => r.data),
  });

  const ids = query.data?.results.map((x) => x.id) ?? [];
  const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
  const toggle = (id: number) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const remove = useMutation({
    mutationFn: () => api.post('/listings/bulk-delete/', { ids: [...selected] }),
    onSuccess: () => {
      setSelected(new Set());
      qc.invalidateQueries({ queryKey: ['listings'] });
    },
  });

  if (query.isLoading) return <PageSkeleton />;

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        eyebrow="کشف خودرو"
        title="آگهی‌های پیدا شده"
        description={`${faNum(query.data?.count ?? 0)} خودرو مطابق معیارهای شما پیدا شده است.`}
      />

      {/* Toolbar */}
      <section className="card flex flex-col gap-3 p-3 lg:flex-row lg:items-center">
        <label className="relative flex-1">
          <span className="sr-only">جستجو در آگهی‌ها</span>
          <Search className="muted pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" size={19} />
          <input
            className="field pr-11"
            placeholder="جستجو در عنوان و توضیحات…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q && (
            <button
              aria-label="پاک کردن جستجو"
              className="absolute left-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg text-[rgb(var(--muted))] hover:bg-[rgb(var(--foreground)/.06)]"
              onClick={() => setQ('')}
            >
              <X size={16} />
            </button>
          )}
        </label>
        <div className="flex items-center gap-3">
          <select
            aria-label="مرتب‌سازی"
            className="field flex-1 lg:w-52"
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <Segmented
            value={view}
            onChange={setView}
            options={[
              { value: 'grid', label: <Grid2X2 size={18} />, title: 'نمایش شبکه‌ای' },
              { value: 'table', label: <LayoutList size={19} />, title: 'نمایش فهرستی' },
            ]}
          />
        </div>
      </section>

      {/* Content */}
      {query.isError ? (
        <ErrorState retry={() => query.refetch()} />
      ) : !query.data?.results.length ? (
        <EmptyState
          icon="car"
          title={q ? 'نتیجه‌ای برای این جستجو نیست' : 'هنوز آگهی منطبقی پیدا نشده'}
          description={
            q
              ? 'عبارت جستجو را تغییر دهید یا فیلترها را بازتر کنید.'
              : 'جستجوها فعال‌اند و گزینه‌های تازه به‌صورت خودکار اینجا ظاهر می‌شوند.'
          }
        />
      ) : view === 'grid' ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {query.data.results.map((x, i) => (
            <div key={x.id} className="animate-fade-up" style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}>
              <VehicleCard listing={x} select={{ checked: selected.has(x.id), toggle: () => toggle(x.id) }} />
            </div>
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-right text-sm">
              <thead>
                <tr className="border-b text-xs" style={{ borderColor: 'rgb(var(--border))', background: 'rgb(var(--surface-2))' }}>
                  <th className="p-4">
                    <input
                      type="checkbox"
                      className="check"
                      aria-label="انتخاب همه"
                      checked={allSelected}
                      onChange={() => setSelected(allSelected ? new Set() : new Set(ids))}
                    />
                  </th>
                  {['خودرو', 'قیمت', 'سال', 'کارکرد', 'شهر', 'تطابق', 'زمان کشف'].map((h) => (
                    <th key={h} className="muted p-4 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {query.data.results.map((x) => (
                  <tr
                    key={x.id}
                    className={`border-b transition last:border-0 hover:bg-[rgb(var(--surface-2))] ${
                      selected.has(x.id) ? 'bg-wine/[.05]' : ''
                    }`}
                    style={{ borderColor: 'rgb(var(--border))' }}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        className="check"
                        aria-label={`انتخاب ${x.title}`}
                        checked={selected.has(x.id)}
                        onChange={() => toggle(x.id)}
                      />
                    </td>
                    <td className="max-w-xs p-4 font-semibold">
                      <Link to={`/listings/${x.id}`} className="line-clamp-1 hover:text-wine">
                        {x.title}
                      </Link>
                    </td>
                    <td className="p-4 font-semibold tnum">{money(x.price)}</td>
                    <td className="p-4 tnum">{faNum(x.year)}</td>
                    <td className="p-4 tnum">{faNum(x.mileage)}</td>
                    <td className="muted p-4">{x.city || '—'}</td>
                    <td className="p-4">
                      <MatchScore score={x.matches[0]?.match_score} compact />
                    </td>
                    <td className="faint p-4 text-xs">{faDate(x.discovered_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Floating bulk-action bar */}
      {selected.size > 0 && (
        <div className="animate-fade-up fixed inset-x-4 bottom-6 z-40 mx-auto max-w-lg">
          <div
            className="flex items-center justify-between gap-3 rounded-2xl px-5 py-3 text-white shadow-lift"
            style={{ background: 'rgb(var(--espresso))' }}
          >
            <span className="flex items-center gap-2 text-sm font-semibold">
              <CheckCheck size={17} className="text-[rgb(var(--gold))]" />
              <span className="tnum">{faNum(selected.size)}</span> آگهی انتخاب شده
            </span>
            <div className="flex items-center gap-2">
              <button className="btn-ghost h-10 text-white/70 hover:bg-white/10 hover:text-white" onClick={() => setSelected(new Set())}>
                لغو
              </button>
              <button
                className="btn h-10 bg-white/12 text-white hover:bg-white/20"
                onClick={() => confirm('آگهی‌های انتخاب‌شده حذف شوند؟') && remove.mutate()}
                disabled={remove.isPending}
              >
                <Trash2 size={16} /> حذف
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
