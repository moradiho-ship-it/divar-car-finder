import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, Plus, X } from 'lucide-react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSelect?: (v: string) => void;
  options: string[];
  placeholder?: string;
  disabled?: boolean;
  allowCustom?: boolean;
};

export function Autocomplete({
  value,
  onChange,
  onSelect,
  options,
  placeholder = 'انتخاب کنید',
  disabled,
  allowCustom = true,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value), [value]);
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const filtered = options.filter((x) => x.includes(query.trim())).slice(0, 60);

  return (
    <div ref={ref} className="relative">
      <div className={`field flex items-center gap-1 px-0 ${disabled ? 'cursor-not-allowed opacity-55' : ''}`}>
        <input
          className="min-w-0 flex-1 bg-transparent px-3.5 py-3 outline-none"
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            if (allowCustom) onChange(e.target.value);
            setOpen(true);
          }}
        />
        <button
          type="button"
          tabIndex={-1}
          aria-label="باز کردن فهرست"
          className="grid h-full place-items-center px-3 text-[rgb(var(--faint))]"
          onClick={() => !disabled && setOpen((x) => !x)}
        >
          <ChevronDown size={17} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {open && !disabled && (
        <div className="animate-fade-in absolute z-50 mt-1.5 max-h-64 w-full overflow-auto rounded-xl border p-1.5 shadow-lift"
          style={{ borderColor: 'rgb(var(--border-strong))', background: 'rgb(var(--surface))' }}>
          {filtered.length ? (
            filtered.map((x) => {
              const active = value === x;
              return (
                <button
                  type="button"
                  key={x}
                  onClick={() => {
                    onChange(x);
                    onSelect?.(x);
                    setQuery(onSelect ? '' : x);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-right text-sm transition ${
                    active ? 'bg-wine/[.09] font-semibold text-wine' : 'hover:bg-[rgb(var(--surface-2))]'
                  }`}
                >
                  <span>{x}</span>
                  {active && <Check size={16} className="text-wine" />}
                </button>
              );
            })
          ) : (
            <div className="faint p-3 text-xs leading-6">
              {allowCustom ? 'مقدار واردشده به‌صورت سفارشی ثبت می‌شود.' : 'گزینه‌ای پیدا نشد.'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function MultiAutocomplete({
  values,
  onChange,
  options,
  placeholder,
}: {
  values: string[];
  onChange: (v: string[]) => void;
  options: string[];
  placeholder: string;
}) {
  const [draft, setDraft] = useState('');
  const add = (v: string) => {
    const t = v.trim();
    if (t && !values.includes(t)) onChange([...values, t]);
    setDraft('');
  };
  return (
    <div>
      <div className="flex gap-2">
        <div className="flex-1">
          <Autocomplete value={draft} options={options} placeholder={placeholder} onChange={setDraft} onSelect={add} />
        </div>
        <button
          type="button"
          className="btn-secondary h-12 px-3"
          aria-label="افزودن"
          onClick={() => add(draft)}
        >
          <Plus size={17} />
        </button>
      </div>
      {values.length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-2">
          {values.map((x) => (
            <span key={x} className="chip-active chip">
              {x}
              <button type="button" aria-label={`حذف ${x}`} onClick={() => onChange(values.filter((v) => v !== x))}>
                <X size={13} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
