import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowUpLeft,
  Boxes,
  CalendarClock,
  CarFront,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Gauge,
  MapPin,
  Palette,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import { faDate, faNum, money } from '../lib/format';
import type { Listing } from '../types';
import { MatchScore } from '../components/ui';

const FIELD_LABELS: Record<string, string> = {
  brand: 'برند',
  model: 'مدل',
  trim: 'تیپ',
  year: 'سال',
  price: 'قیمت',
  mileage: 'کارکرد',
  color: 'رنگ',
  transmission: 'گیربکس',
  body_condition: 'وضعیت بدنه',
  city: 'شهر',
  district: 'محله',
};

function fieldLabel(field: string) {
  if (field.startsWith('keyword:')) return `واژه: ${field.slice(8)}`;
  return FIELD_LABELS[field] ?? field;
}

export default function ListingDetailPage() {
  const { id } = useParams();
  const [activeImage, setActiveImage] = useState(0);
  const { data: x, isLoading } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => api.get<Listing>(`/listings/${id}/`).then((r) => r.data),
  });
  useEffect(() => setActiveImage(0), [id]);

  if (isLoading || !x) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="skeleton h-[420px]" />
        <div className="skeleton h-[420px]" />
      </div>
    );
  }

  const images = Array.from(new Set([...(x.image_urls ?? []), x.thumbnail_url].filter(Boolean)));
  const showImage = (direction: number) =>
    setActiveImage((current) => (current + direction + images.length) % images.length);

  const specs: [typeof CarFront, string, string][] = [
    [CalendarClock, 'سال', faNum(x.year)],
    [Gauge, 'کارکرد', `${faNum(x.mileage)} کیلومتر`],
    [Palette, 'رنگ', x.color || '—'],
    [Boxes, 'گیربکس', x.transmission || '—'],
    [ShieldCheck, 'بدنه', x.body_condition || '—'],
    [MapPin, 'مکان', [x.city, x.district].filter(Boolean).join('، ') || '—'],
  ];

  const matchedFields = Object.entries(x.matches[0]?.matched_fields ?? {}).filter(([, ok]) => ok);

  return (
    <div className="space-y-6">
      <Link to="/listings" className="btn-ghost h-9 -mr-2 w-fit px-2">
        <ArrowRight size={16} /> بازگشت به آگهی‌ها
      </Link>

      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        {/* Gallery */}
        <div className="card overflow-hidden">
          <div className="relative aspect-[4/3] bg-[rgb(var(--surface-2))]">
            {images.length ? (
              <img
                src={images[activeImage]}
                alt={`${x.title} - تصویر ${activeImage + 1}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center">
                <CarFront size={72} className="faint opacity-40" strokeWidth={1.25} />
              </div>
            )}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="تصویر قبلی"
                  onClick={() => showImage(-1)}
                  className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
                >
                  <ChevronRight size={24} />
                </button>
                <button
                  type="button"
                  aria-label="تصویر بعدی"
                  onClick={() => showImage(1)}
                  className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
                >
                  <ChevronLeft size={24} />
                </button>
                <span className="absolute bottom-4 left-4 rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-white backdrop-blur tnum">
                  {faNum(activeImage + 1)} / {faNum(images.length)}
                </span>
              </>
            )}
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto p-3" dir="rtl">
              {images.map((image, index) => (
                <button
                  type="button"
                  key={image}
                  onClick={() => setActiveImage(index)}
                  className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    activeImage === index ? 'border-wine' : 'border-transparent opacity-55 hover:opacity-100'
                  }`}
                >
                  <img src={image} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Summary */}
        <div className="card flex flex-col p-6 md:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <p className="faint flex items-center gap-1.5 text-xs">
                <CalendarClock size={13} /> کشف‌شده در {faDate(x.discovered_at)}
              </p>
              <h1 className="mt-2 text-2xl font-extrabold leading-tight">{x.title}</h1>
            </div>
            <MatchScore score={x.matches[0]?.match_score} compact />
          </div>

          <div className="card-inset mb-6 flex items-baseline gap-2 p-4">
            <span className="faint text-xs">قیمت</span>
            <span className="text-2xl font-extrabold text-wine tnum">{money(x.price)}</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {specs.map(([Icon, k, v]) => (
              <div key={k} className="card-inset p-3.5">
                <span className="muted flex items-center gap-1.5 text-xs">
                  <Icon size={14} /> {k}
                </span>
                <span className="mt-1.5 block font-bold">{v}</span>
              </div>
            ))}
          </div>

          <a className="btn-primary mt-6 h-12 w-full" href={x.url} target="_blank" rel="noreferrer">
            مشاهده در دیوار <ArrowUpLeft size={18} />
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="section-title mb-4">توضیحات آگهی</h2>
          <p className="muted whitespace-pre-line text-sm leading-8">
            {x.description || 'توضیحی برای این آگهی ثبت نشده است.'}
          </p>
        </section>

        <section className="card p-6">
          <h2 className="section-title mb-4">چرا این آگهی منطبق است؟</h2>
          {matchedFields.length ? (
            <div className="flex flex-wrap gap-2">
              {matchedFields.map(([field]) => (
                <span
                  key={field}
                  className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-500/[.09] px-3 py-1.5 text-sm font-medium text-emerald-700 dark:text-emerald-300"
                >
                  <CheckCircle2 size={15} />
                  {fieldLabel(field)}
                </span>
              ))}
            </div>
          ) : (
            <p className="muted text-sm leading-7">جزئیات تطابق برای این آگهی ثبت نشده است.</p>
          )}
        </section>
      </div>
    </div>
  );
}
