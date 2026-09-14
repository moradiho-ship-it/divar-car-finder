import { CarFront, Gauge, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Listing } from '../types';
import { faDate, faNum, money } from '../lib/format';
import { MatchScore, TimeStamp } from './ui';

export default function VehicleCard({
  listing: x,
  select,
}: {
  listing: Listing;
  select?: { checked: boolean; toggle: () => void };
}) {
  const location = [x.city, x.district].filter(Boolean).join('، ') || 'نامشخص';

  return (
    <article
      className={`group card card-hover relative overflow-hidden ${
        select?.checked ? 'ring-2 ring-wine ring-offset-2 ring-offset-[rgb(var(--background))]' : ''
      }`}
    >
      {select && (
        <label
          className="absolute right-3 top-3 z-10 grid h-10 w-10 cursor-pointer place-items-center rounded-xl border border-white/40 bg-black/45 backdrop-blur transition hover:bg-black/60"
          onClick={(e) => e.stopPropagation()}
        >
          <input
            type="checkbox"
            className="check border-white/60 bg-white/20"
            checked={select.checked}
            onChange={select.toggle}
            aria-label={`انتخاب ${x.title}`}
          />
        </label>
      )}

      <Link to={`/listings/${x.id}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-[rgb(var(--surface-2))]">
          {x.thumbnail_url ? (
            <img
              src={x.thumbnail_url}
              alt={x.title}
              loading="lazy"
              className="h-full w-full object-cover transition duration-700 ease-premium group-hover:scale-[1.06]"
            />
          ) : (
            <div className="grid h-full place-items-center">
              <CarFront className="faint opacity-40" size={52} strokeWidth={1.5} />
            </div>
          )}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />
          <div className="absolute bottom-3 right-3">
            <MatchScore score={x.matches?.[0]?.match_score} compact />
          </div>
          <div className="absolute bottom-3 left-3 rounded-lg bg-black/45 px-2.5 py-1 text-sm font-bold text-white backdrop-blur tnum">
            {money(x.price)}
          </div>
        </div>

        <div className="p-5">
          <h3 className="line-clamp-2 min-h-[3rem] font-bold leading-7">{x.title}</h3>
          <div className="muted mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs">
            <span className="inline-flex items-center gap-1.5">
              <CarFront size={14} /> <span className="tnum">{faNum(x.year)}</span>
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Gauge size={14} /> <span className="tnum">{faNum(x.mileage)}</span> کیلومتر
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} /> {location}
            </span>
          </div>
          <div className="mt-4 border-t pt-3" style={{ borderColor: 'rgb(var(--border))' }}>
            <TimeStamp>کشف {faDate(x.discovered_at)}</TimeStamp>
          </div>
        </div>
      </Link>
    </article>
  );
}
