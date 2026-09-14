import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CarFront, Plus, ScanSearch, Search, Send, Sparkles, Wifi } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { faNum } from '../lib/format';
import type { Listing } from '../types';
import VehicleCard from '../components/VehicleCard';
import { EmptyState, ErrorState, PageSkeleton, StatTile } from '../components/ui';

type Summary = {
  active_searches: number;
  scanned_today: number;
  matches_today: number;
  notifications_sent: number;
  latest_matches: Listing[];
};

function greeting() {
  const h = new Date().getHours();
  if (h < 5) return 'شب بخیر';
  if (h < 12) return 'صبح بخیر';
  if (h < 17) return 'ظهر بخیر';
  if (h < 20) return 'عصر بخیر';
  return 'شب بخیر';
}

export default function DashboardPage() {
  const q = useQuery({
    queryKey: ['summary'],
    queryFn: () => api.get<Summary>('/dashboard/summary/').then((r) => r.data),
  });

  if (q.isLoading) return <PageSkeleton />;
  if (q.isError) return <ErrorState retry={() => q.refetch()} />;
  const d = q.data!;

  const stats = [
    { icon: Search, label: 'جستجوهای فعال', value: d.active_searches, hint: 'در حال پایش', accent: true },
    { icon: ScanSearch, label: 'بررسی‌شده امروز', value: d.scanned_today, hint: 'آگهی دیوار' },
    { icon: CarFront, label: 'منطبق امروز', value: d.matches_today, hint: d.matches_today > 0 ? 'گزینه تازه' : 'امروز', accent: true },
    { icon: Send, label: 'اعلان ارسال‌شده', value: d.notifications_sent, hint: 'تلگرام' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section
        className="animate-fade-up relative overflow-hidden rounded-[1.75rem] px-6 py-8 text-white md:px-10 md:py-11"
        style={{ background: 'radial-gradient(130% 130% at 100% 0%, #2a2320 0%, #191412 60%, #120f0d 100%)' }}
      >
        <span className="animate-float absolute -right-24 -top-28 h-72 w-72 rounded-full bg-wine/30 blur-3xl" />
        <span className="animate-float absolute -bottom-28 left-10 h-64 w-64 rounded-full bg-[rgb(var(--gold)/.14)] blur-3xl" style={{ animationDelay: '-8s' }} />

        <div className="relative flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-1.5 text-xs font-semibold text-white/75">
              <Wifi size={14} className="text-emerald-400" />
              همه‌چیز مرتب است
            </div>
            <h1 className="text-[1.75rem] font-extrabold tracking-tight md:text-4xl">{greeting()} 👋</h1>
            <p className="mt-3 max-w-2xl text-sm leading-8 text-white/65 md:text-base">
              امروز <strong className="font-bold text-white tnum">{faNum(d.scanned_today)} آگهی</strong> بررسی شده و{' '}
              <strong className="font-bold text-[rgb(var(--gold))] tnum">{faNum(d.matches_today)} خودروی جدید</strong> مطابق جستجوهای شما پیدا شده است.
            </p>
          </div>
          <Link to="/searches/new" className="btn-light h-12 shrink-0 px-5">
            <Plus size={19} /> جستجوی جدید
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s, i) => (
          <StatTile key={s.label} {...s} delay={i * 60} />
        ))}
      </section>

      {/* Latest matches */}
      <section>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="eyebrow">پیشنهادهای هوشمند</p>
            <h2 className="section-title mt-1.5">تازه‌ترین خودروهای منطبق</h2>
          </div>
          <Link to="/listings" className="btn-ghost h-10 px-3">
            مشاهده همه <ArrowLeft size={16} />
          </Link>
        </div>

        {!d.latest_matches.length ? (
          <EmptyState
            icon="car"
            title="هنوز خودروی منطبقی پیدا نشده"
            description="جستجوهای شما فعال‌اند. به‌محض انتشار گزینه مناسب، آن را اینجا و در تلگرام می‌بینید."
            action={
              <Link to="/searches" className="btn-secondary">
                <Sparkles size={17} /> بررسی جستجوها
              </Link>
            }
          />
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {d.latest_matches.slice(0, 6).map((x, i) => (
              <div key={x.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                <VehicleCard listing={x} />
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
