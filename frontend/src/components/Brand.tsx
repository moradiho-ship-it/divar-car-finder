import { CarFront } from 'lucide-react';

/** خودروبان mark — a wine badge with a subtle gold ring. */
export function BrandMark({ size = 44 }: { size?: number }) {
  return (
    <div
      className="relative grid shrink-0 place-items-center rounded-2xl text-white"
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(150deg, rgb(var(--primary)), rgb(var(--primary-hover)))',
        boxShadow: '0 6px 16px -6px rgb(var(--primary) / .6), inset 0 1px 0 rgb(255 255 255 / .16)',
      }}
    >
      <span className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-[rgb(var(--gold)/.35)]" />
      <CarFront size={size * 0.5} strokeWidth={2} />
    </div>
  );
}

export function BrandWordmark({ size = 44 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <BrandMark size={size} />
      <div className="leading-tight">
        <div className="text-[1.05rem] font-extrabold tracking-tight">خودروبان</div>
        <div className="faint text-[.6875rem] font-medium">دستیار هوشمند خرید خودرو</div>
      </div>
    </div>
  );
}
