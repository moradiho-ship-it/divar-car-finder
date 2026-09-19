import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ReactNode } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { Control, FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { z } from 'zod';
import {
  BellRing,
  CarFront,
  Gauge,
  LoaderCircle,
  MapPin,
  Save,
  SlidersHorizontal,
  Sparkles,
  WalletCards,
} from 'lucide-react';
import { api } from '../api/client';
import type { SearchProfile } from '../types';
import { Autocomplete, MultiAutocomplete } from '../components/Autocomplete';
import { faNum, money } from '../lib/format';
import {
  BODY_CONDITIONS,
  BRAND_OPTIONS,
  CITIES,
  COLORS,
  MILEAGE_SUGGESTIONS,
  MODELS_BY_BRAND,
  PRICE_SUGGESTIONS,
  TEHRAN_DISTRICTS,
  TRANSMISSIONS,
  TRIMS_BY_BRAND_AND_MODEL,
  YEARS,
} from '../data/vehicleOptions';

const optionalNumber = z.preprocess(
  (v) => (v === null || v === undefined || (typeof v === 'string' && v.trim() === '') ? null : Number(v)),
  z.number().nonnegative().nullable(),
);

const schema = z
  .object({
    title: z.string().min(2, 'نام جستجو را وارد کنید'),
    brand: z.string(),
    model: z.string(),
    trim: z.string(),
    min_year: optionalNumber,
    max_year: optionalNumber,
    min_price: optionalNumber,
    max_price: optionalNumber,
    min_mileage: optionalNumber,
    max_mileage: optionalNumber,
    cities: z.array(z.string()),
    districts: z.array(z.string()),
    colors: z.array(z.string()),
    transmission: z.string(),
    body_condition: z.string(),
    description_keywords: z.string(),
    excluded_keywords: z.string(),
    telegram_enabled: z.boolean(),
    send_images: z.boolean(),
    notify_once: z.boolean(),
    minimum_match_score: z.coerce.number().min(0).max(100),
    crawl_interval_minutes: z.coerce.number().min(5),
  })
  .refine((x) => !x.min_price || !x.max_price || x.min_price <= x.max_price, {
    path: ['max_price'],
    message: 'حداکثر باید بیشتر از حداقل باشد',
  });

type Form = z.infer<typeof schema>;

const defaults: Form = {
  title: '',
  brand: '',
  model: '',
  trim: '',
  min_year: null,
  max_year: null,
  min_price: null,
  max_price: null,
  min_mileage: null,
  max_mileage: null,
  cities: ['تهران'],
  districts: [],
  colors: [],
  transmission: '',
  body_condition: '',
  description_keywords: '',
  excluded_keywords: '',
  telegram_enabled: true,
  send_images: false,
  notify_once: true,
  minimum_match_score: 70,
  crawl_interval_minutes: 60,
};

type ApiValidationErrors = Record<string, string | string[]>;

function validationMessages(error: unknown) {
  const payload = (error as AxiosError<ApiValidationErrors>)?.response?.data;
  if (!payload || typeof payload !== 'object') return [];
  return Object.values(payload).flatMap((message) => (Array.isArray(message) ? message : [String(message)]));
}

/* Section wrapper with a numbered, iconed header */
function Section({
  step,
  icon: Icon,
  title,
  children,
}: {
  step: number;
  icon: typeof CarFront;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="card p-6">
      <div className="mb-5 flex items-center gap-3">
        <div className="relative grid h-10 w-10 place-items-center rounded-xl bg-wine/[.1] text-wine">
          <Icon size={18} />
          <span className="absolute -left-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-[rgb(var(--gold))] text-[10px] font-bold text-white tnum">
            {faNum(step)}
          </span>
        </div>
        <h2 className="font-bold">{title}</h2>
      </div>
      {children}
    </section>
  );
}

/* Keep field component identities stable while the live summary updates. */
function Field({
  name,
  label,
  type = 'text',
  suggestions = [],
  placeholder,
  register,
  errors,
}: {
  name: keyof Form;
  label: string;
  type?: string;
  suggestions?: number[];
  placeholder?: string;
  register: UseFormRegister<Form>;
  errors: FieldErrors<Form>;
}) {
  const listId = `suggest-${String(name)}`;
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input
        type={type}
        inputMode={type === 'number' ? 'numeric' : undefined}
        placeholder={placeholder}
        list={suggestions.length ? listId : undefined}
        className="field"
        {...register(name)}
      />
      {suggestions.length > 0 && (
        <datalist id={listId}>
          {suggestions.map((x) => (
            <option key={x} value={x} />
          ))}
        </datalist>
      )}
      {errors[name] && <small className="field-error">{errors[name]?.message as string}</small>}
    </label>
  );
}

function Auto({
  name,
  label,
  options,
  disabled = false,
  control,
  setValue,
}: {
  name: 'brand' | 'model' | 'trim' | 'transmission' | 'body_condition';
  label: string;
  options: string[];
  disabled?: boolean;
  control: Control<Form>;
  setValue: UseFormSetValue<Form>;
}) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Autocomplete
            value={field.value}
            onChange={(v) => {
              field.onChange(v);
              if (name === 'brand') {
                setValue('model', '');
                setValue('trim', '');
              }
              if (name === 'model') setValue('trim', '');
            }}
            options={options}
            disabled={disabled}
          />
        )}
      />
    </label>
  );
}

export default function SearchFormPage() {
  const { id } = useParams();
  const nav = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: defaults });

  const brand = watch('brand');
  const model = watch('model');
  const values = watch();

  const filterCount = [
    values.brand, values.model, values.trim, values.min_year, values.max_year,
    values.min_price, values.max_price, values.max_mileage, values.transmission,
    values.body_condition, values.cities.length, values.districts.length,
    values.colors.length, values.description_keywords,
  ].filter(Boolean).length;
  const restrictiveness = filterCount >= 10 ? 'محدود' : filterCount >= 5 ? 'متعادل' : 'گسترده';
  const rangeTone =
    restrictiveness === 'محدود'
      ? 'bg-amber-500 text-amber-700 dark:text-amber-300'
      : restrictiveness === 'متعادل'
        ? 'bg-emerald-500 text-emerald-700 dark:text-emerald-300'
        : 'bg-blue-500 text-blue-700 dark:text-blue-300';

  useQuery({
    queryKey: ['search', id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<SearchProfile>(`/searches/${id}/`);
      reset({
        ...data,
        districts: data.districts ?? [],
        description_keywords: data.description_keywords.join('\n'),
        excluded_keywords: data.excluded_keywords.join('\n'),
      });
      return data;
    },
  });

  const save = useMutation({
    mutationFn: (v: Form) => {
      const list = (s: string) => s.split(/[،,\n]/).map((x) => x.trim()).filter(Boolean);
      const transmission =
        v.transmission === 'اتوماتیک' ? 'automatic' : v.transmission === 'دنده‌ای' ? 'manual' : v.transmission;
      const payload = {
        ...v,
        transmission,
        description_keywords: list(v.description_keywords),
        excluded_keywords: list(v.excluded_keywords),
      };
      return id ? api.patch(`/searches/${id}/`, payload) : api.post('/searches/', payload);
    },
    onSuccess: () => nav('/searches'),
    onError: (error: AxiosError<ApiValidationErrors>) => {
      const payload = error.response?.data;
      if (!payload || typeof payload !== 'object') return;
      Object.entries(payload).forEach(([name, message]) => {
        if (!(name in defaults)) return;
        setError(name as keyof Form, {
          type: 'server',
          message: Array.isArray(message) ? message.join(' ') : String(message),
        });
      });
    },
  });

  const toggles: { name: 'telegram_enabled' | 'notify_once' | 'send_images'; label: string }[] = [
    { name: 'telegram_enabled', label: 'اعلان تلگرام فعال باشد' },
    { name: 'notify_once', label: 'هر آگهی فقط یک‌بار ارسال شود' },
    { name: 'send_images', label: 'ارسال عکس‌ها به‌صورت آلبوم' },
  ];

  return (
    <form onSubmit={handleSubmit((v) => save.mutate(v))} className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="animate-fade-up">
          <p className="eyebrow mb-2">دستیار ساخت جستجو</p>
          <h1 className="page-title">{id ? 'ویرایش جستجو' : 'جستجوی جدید خودرو'}</h1>
          <p className="muted mt-2 text-sm leading-7">
            مشخصات خودروی دلخواه را تعریف کنید؛ هر گزینه بعداً قابل ویرایش است.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Form column */}
        <div className="space-y-6">
          <Section step={1} icon={CarFront} title="اطلاعات پایه خودرو">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field name="title" label="نام جستجو" placeholder="مثلاً پژو ۲۰۷ اتوماتیک تهران" register={register} errors={errors} />
              <Auto name="brand" label="برند" options={BRAND_OPTIONS} control={control} setValue={setValue} />
              <Auto name="model" label="مدل" options={MODELS_BY_BRAND[brand] ?? []} disabled={!brand} control={control} setValue={setValue} />
              <Auto name="trim" label="تیپ" options={TRIMS_BY_BRAND_AND_MODEL[brand]?.[model] ?? []} disabled={!model} control={control} setValue={setValue} />
              <label className="block">
                <span className="label">حداقل سال</span>
                <Controller
                  name="min_year"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      value={field.value?.toString() ?? ''}
                      onChange={(v) => field.onChange(v ? Number(v) : null)}
                      options={YEARS}
                    />
                  )}
                />
                {errors.min_year && <small className="field-error">{errors.min_year.message}</small>}
              </label>
              <label className="block">
                <span className="label">حداکثر سال</span>
                <Controller
                  name="max_year"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      value={field.value?.toString() ?? ''}
                      onChange={(v) => field.onChange(v ? Number(v) : null)}
                      options={YEARS}
                    />
                  )}
                />
                {errors.max_year && <small className="field-error">{errors.max_year.message}</small>}
              </label>
            </div>
          </Section>

          <Section step={2} icon={WalletCards} title="قیمت و کارکرد">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field name="min_price" label="حداقل قیمت (تومان)" type="number" suggestions={PRICE_SUGGESTIONS} register={register} errors={errors} />
              <Field name="max_price" label="حداکثر قیمت (تومان)" type="number" suggestions={PRICE_SUGGESTIONS} register={register} errors={errors} />
              <Field name="min_mileage" label="حداقل کارکرد" type="number" suggestions={MILEAGE_SUGGESTIONS} register={register} errors={errors} />
              <Field name="max_mileage" label="حداکثر کارکرد" type="number" suggestions={MILEAGE_SUGGESTIONS} register={register} errors={errors} />
              {errors.max_price && <small className="field-error -mt-3">{errors.max_price.message}</small>}
            </div>
          </Section>

          <Section step={3} icon={MapPin} title="مکان و مشخصات">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="label">شهرها</span>
                <Controller
                  name="cities"
                  control={control}
                  render={({ field }) => (
                    <MultiAutocomplete values={field.value} onChange={field.onChange} options={CITIES} placeholder="جستجو و افزودن شهر" />
                  )}
                />
              </label>
              <label className="block">
                <span className="label">محله‌ها</span>
                <Controller
                  name="districts"
                  control={control}
                  render={({ field }) => (
                    <MultiAutocomplete values={field.value} onChange={field.onChange} options={TEHRAN_DISTRICTS} placeholder="جستجو و افزودن محله" />
                  )}
                />
              </label>
              <label className="block">
                <span className="label">رنگ‌های مجاز</span>
                <Controller
                  name="colors"
                  control={control}
                  render={({ field }) => (
                    <MultiAutocomplete values={field.value} onChange={field.onChange} options={COLORS} placeholder="جستجو و افزودن رنگ" />
                  )}
                />
              </label>
              <Auto name="transmission" label="نوع گیربکس" options={TRANSMISSIONS} control={control} setValue={setValue} />
              <Auto name="body_condition" label="وضعیت بدنه" options={BODY_CONDITIONS} control={control} setValue={setValue} />
            </div>
          </Section>

          <Section step={4} icon={SlidersHorizontal} title="فیلتر واژه‌ها">
            <div className="grid gap-5 sm:grid-cols-2">
              <label className="block">
                <span className="label">واژه‌های لازم (هر خط یک مورد)</span>
                <textarea rows={4} className="field" placeholder={'بی‌رنگ\nفول آپشن'} {...register('description_keywords')} />
              </label>
              <label className="block">
                <span className="label">واژه‌های حذف‌کننده</span>
                <textarea rows={4} className="field" placeholder={'تصادفی\nمعاوضه'} {...register('excluded_keywords')} />
              </label>
            </div>
          </Section>

          <Section step={5} icon={BellRing} title="اعلان و زمان‌بندی">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field name="minimum_match_score" label="حداقل امتیاز تطابق (۰ تا ۱۰۰)" type="number" register={register} errors={errors} />
              <Field name="crawl_interval_minutes" label="فاصله بررسی (دقیقه)" type="number" register={register} errors={errors} />
            </div>
            <div className="mt-5 space-y-3">
              {toggles.map(({ name, label }) => (
                <Controller
                  key={name}
                  name={name}
                  control={control}
                  render={({ field }) => (
                    <label className="card-inset flex cursor-pointer items-center gap-3 p-3.5 text-sm font-medium">
                      <input type="checkbox" className="check" checked={field.value} onChange={field.onChange} />
                      {label}
                    </label>
                  )}
                />
              ))}
            </div>
          </Section>

          {save.isError && (
            <div className="rounded-2xl border border-red-500/25 bg-red-500/[.06] p-4 text-sm text-red-700 dark:text-red-300">
              <p className="font-bold">ذخیره انجام نشد:</p>
              {validationMessages(save.error).length ? (
                <ul className="mt-2 list-inside list-disc space-y-1">
                  {validationMessages(save.error).map((message, index) => (
                    <li key={`${message}-${index}`}>{message}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2">ورودی‌ها را بررسی کنید و دوباره تلاش کنید.</p>
              )}
            </div>
          )}
        </div>

        {/* Sticky live summary */}
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <div className="card overflow-hidden">
            <div
              className="relative overflow-hidden p-5 text-white"
              style={{ background: 'radial-gradient(120% 120% at 100% 0%, #2a2320, #17120f)' }}
            >
              <span className="absolute -left-10 -top-12 h-32 w-32 rounded-full bg-wine/30 blur-2xl" />
              <div className="relative flex items-center gap-2 text-xs font-semibold text-white/70">
                <Sparkles size={15} className="text-[rgb(var(--gold))]" /> در حال جستجوی
              </div>
              <p className="relative mt-2 text-lg font-bold">
                {[values.brand, values.model, values.trim].filter(Boolean).join(' ') || 'همه خودروها'}
              </p>
            </div>

            <div className="divide-y" style={{ borderColor: 'rgb(var(--border))' }}>
              {[
                [CarFront, 'سال', values.min_year || values.max_year ? `${faNum(values.min_year)} تا ${faNum(values.max_year)}` : 'بدون محدودیت'],
                [WalletCards, 'سقف قیمت', values.max_price ? money(values.max_price) : 'بدون سقف'],
                [Gauge, 'کارکرد', values.max_mileage ? `زیر ${faNum(values.max_mileage)} کیلومتر` : 'هر میزان'],
                [MapPin, 'شهرها', values.cities.join('، ') || 'همه شهرها'],
              ].map(([Icon, k, v]) => {
                const I = Icon as typeof CarFront;
                return (
                  <div key={k as string} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                    <span className="muted flex items-center gap-2">
                      <I size={15} />
                      {k as string}
                    </span>
                    <span className="truncate text-left font-medium">{v as string}</span>
                  </div>
                );
              })}
            </div>

            <div className="p-5">
              <div className="card-inset flex items-center justify-between p-3 text-xs">
                <span className="muted flex items-center gap-2">
                  <span className={`status-dot ${rangeTone.split(' ')[0]}`} /> دامنه جستجو
                </span>
                <strong className={rangeTone.split(' ').slice(1).join(' ')}>{restrictiveness}</strong>
              </div>
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button type="button" className="btn-secondary flex-1" onClick={() => nav(-1)}>
              انصراف
            </button>
            <button className="btn-primary flex-1" disabled={save.isPending}>
              {save.isPending ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" /> ذخیره…
                </>
              ) : (
                <>
                  <Save size={17} /> ذخیره
                </>
              )}
            </button>
          </div>
        </aside>
      </div>
    </form>
  );
}
