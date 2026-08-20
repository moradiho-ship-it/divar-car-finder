import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import type { AxiosError } from "axios";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { z } from "zod";
import { api } from "../api/client";
import type { SearchProfile } from "../types";
import { Autocomplete, MultiAutocomplete } from "../components/Autocomplete";
import { BellRing, CarFront, Check, MapPin, SlidersHorizontal, Sparkles, WalletCards } from "lucide-react";
import { faNum, money } from "../lib/format";
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
  TRIMS_BY_MODEL,
  YEARS,
} from "../data/vehicleOptions";
const optionalNumber = z.preprocess(
  (v) =>
    v === null ||
    v === undefined ||
    (typeof v === "string" && v.trim() === "")
      ? null
      : Number(v),
  z.number().nonnegative().nullable(),
);
const schema = z
  .object({
    title: z.string().min(2, "نام جستجو را وارد کنید"),
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
    path: ["max_price"],
    message: "حداکثر باید بیشتر از حداقل باشد",
  });
type Form = z.infer<typeof schema>;
const defaults: Form = {
  title: "",
  brand: "",
  model: "",
  trim: "",
  min_year: null,
  max_year: null,
  min_price: null,
  max_price: null,
  min_mileage: null,
  max_mileage: null,
  cities: ["تهران"],
  districts: [],
  colors: [],
  transmission: "",
  body_condition: "",
  description_keywords: "",
  excluded_keywords: "",
  telegram_enabled: true,
  send_images: false,
  notify_once: true,
  minimum_match_score: 70,
  crawl_interval_minutes: 60,
};
type ApiValidationErrors = Record<string, string | string[]>;

function validationMessages(error: unknown) {
  const payload = (error as AxiosError<ApiValidationErrors>)?.response?.data;
  if (!payload || typeof payload !== "object") return [];
  return Object.values(payload).flatMap((message) =>
    Array.isArray(message) ? message : [String(message)],
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
  const brand = watch("brand"),
    model = watch("model");
  const values = watch();
  const filterCount = [values.brand,values.model,values.trim,values.min_year,values.max_year,values.min_price,values.max_price,values.max_mileage,values.transmission,values.body_condition,values.cities.length,values.districts.length,values.colors.length,values.description_keywords].filter(Boolean).length;
  const restrictiveness = filterCount >= 10 ? "محدود" : filterCount >= 5 ? "متعادل" : "گسترده";
  useQuery({
    queryKey: ["search", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await api.get<SearchProfile>(`/searches/${id}/`);
      reset({
        ...data,
        districts: data.districts ?? [],
        description_keywords: data.description_keywords.join("\n"),
        excluded_keywords: data.excluded_keywords.join("\n"),
      });
      return data;
    },
  });
  const save = useMutation({
    mutationFn: (v: Form) => {
      const list = (s: string) =>
        s
          .split(/[،,\n]/)
          .map((x) => x.trim())
          .filter(Boolean);
      const transmission =
        v.transmission === "اتوماتیک"
          ? "automatic"
          : v.transmission === "دنده‌ای"
            ? "manual"
            : v.transmission;
      const payload = {
        ...v,
        transmission,
        description_keywords: list(v.description_keywords),
        excluded_keywords: list(v.excluded_keywords),
      };
      return id
        ? api.patch(`/searches/${id}/`, payload)
        : api.post("/searches/", payload);
    },
    onSuccess: () => nav("/searches"),
    onError: (error: AxiosError<ApiValidationErrors>) => {
      const payload = error.response?.data;
      if (!payload || typeof payload !== "object") return;
      Object.entries(payload).forEach(([name, message]) => {
        if (!(name in defaults)) return;
        setError(name as keyof Form, {
          type: "server",
          message: Array.isArray(message) ? message.join(" ") : String(message),
        });
      });
    },
  });
  const Field = ({
    name,
    label,
    type = "text",
    suggestions = [],
  }: {
    name: keyof Form;
    label: string;
    type?: string;
    suggestions?: number[];
  }) => {
    const listId = `suggest-${String(name)}`;
    return (
      <label>
        <span className="label">{label}</span>
        <input
          type={type}
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
        {errors[name] && (
          <small className="mt-1 block text-red-600">
            {errors[name]?.message as string}
          </small>
        )}
      </label>
    );
  };
  const Auto = ({
    name,
    label,
    options,
    disabled = false,
  }: {
    name: "brand" | "model" | "trim" | "transmission" | "body_condition";
    label: string;
    options: string[];
    disabled?: boolean;
  }) => (
    <label>
      <span className="label">{label}</span>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Autocomplete
            value={field.value}
            onChange={(v) => {
              field.onChange(v);
              if (name === "brand") {
                setValue("model", "");
                setValue("trim", "");
              }
              if (name === "model") setValue("trim", "");
            }}
            options={options}
            disabled={disabled}
          />
        )}
      />
    </label>
  );
  return (
    <form
      onSubmit={handleSubmit((v) => save.mutate(v))}
      className="mx-auto max-w-5xl space-y-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
       <div>
        <p className="eyebrow mb-2">دستیار ساخت جستجو</p>
        <h1 className="page-title">
          {id ? "ویرایش جستجو" : "جستجوی جدید خودرو"}
        </h1>
        <p className="muted mt-2 text-sm leading-7">
          مشخصات خودروی دلخواه را مرحله‌به‌مرحله تعریف کنید؛ هر گزینه بعداً قابل ویرایش است.
        </p>
       </div>
       <div className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs" style={{borderColor:'rgb(var(--border))'}}><span className={`status-dot ${restrictiveness==='محدود'?'bg-amber-500':restrictiveness==='متعادل'?'bg-emerald-500':'bg-blue-500'}`}/>دامنه جستجو: <strong>{restrictiveness}</strong></div>
      </div>
      <nav aria-label="مراحل ساخت جستجو" className="card overflow-x-auto p-2"><ol className="flex min-w-[680px] items-center">{[[CarFront,'خودرو'],[WalletCards,'بودجه و سال'],[SlidersHorizontal,'شرایط'],[MapPin,'موقعیت'],[Sparkles,'فیلتر هوشمند'],[BellRing,'اعلان‌ها']].map(([Icon,label],i)=><li className="flex flex-1 items-center" key={label as string}><div className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium"><span className="grid h-7 w-7 place-items-center rounded-lg bg-wine/[.08] text-wine"><Icon size={15}/></span>{label as string}</div>{i<5&&<span className="h-px flex-1" style={{background:'rgb(var(--border))'}}/>}</li>)}</ol></nav>
      <aside className="card border-wine/15 bg-wine/[.025] p-5"><div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between"><div><div className="flex items-center gap-2 text-sm font-semibold"><Sparkles size={17} className="text-wine"/>در حال جستجوی</div><p className="mt-2 text-lg font-semibold">{[values.brand,values.model,values.trim].filter(Boolean).join(' ')||'همه خودروها'}</p><div className="muted mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs"><span>{values.min_year||values.max_year?`مدل ${faNum(values.min_year)} تا ${faNum(values.max_year)}`:'بدون محدودیت سال'}</span><span>{values.max_price?`تا ${money(values.max_price)}`:'بدون سقف قیمت'}</span><span>{values.max_mileage?`زیر ${faNum(values.max_mileage)} کیلومتر`:'هر میزان کارکرد'}</span><span>{values.cities.join('، ')||'همه شهرها'}</span></div></div><div className="flex items-center gap-2 text-xs text-emerald-700 dark:text-emerald-300"><Check size={16}/>خلاصه با تغییر گزینه‌ها به‌روز می‌شود</div></div></aside>
      <section className="card p-6">
        <h2 className="mb-5 font-bold">اطلاعات پایه خودرو</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Field name="title" label="نام جستجو" />
          <Auto name="brand" label="برند" options={BRAND_OPTIONS} />
          <Auto
            name="model"
            label="مدل"
            options={MODELS_BY_BRAND[brand] ?? []}
            disabled={!brand}
          />
          <Auto
            name="trim"
            label="تیپ"
            options={TRIMS_BY_MODEL[model] ?? []}
            disabled={!model}
          />
          <label>
            <span className="label">حداقل سال</span>
            <Controller
              name="min_year"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value?.toString() ?? ""}
                  onChange={(v) => field.onChange(v ? Number(v) : null)}
                  options={YEARS}
                />
              )}
            />
            {errors.min_year && (
              <small className="mt-1 block text-red-600">
                {errors.min_year.message}
              </small>
            )}
          </label>
          <label>
            <span className="label">حداکثر سال</span>
            <Controller
              name="max_year"
              control={control}
              render={({ field }) => (
                <Autocomplete
                  value={field.value?.toString() ?? ""}
                  onChange={(v) => field.onChange(v ? Number(v) : null)}
                  options={YEARS}
                />
              )}
            />
            {errors.max_year && (
              <small className="mt-1 block text-red-600">
                {errors.max_year.message}
              </small>
            )}
          </label>
        </div>
      </section>
      <section className="card p-6">
        <h2 className="mb-5 font-bold">قیمت و کارکرد</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <Field
            name="min_price"
            label="حداقل قیمت (تومان)"
            type="number"
            suggestions={PRICE_SUGGESTIONS}
          />
          <Field
            name="max_price"
            label="حداکثر قیمت (تومان)"
            type="number"
            suggestions={PRICE_SUGGESTIONS}
          />
          <Field
            name="min_mileage"
            label="حداقل کارکرد"
            type="number"
            suggestions={MILEAGE_SUGGESTIONS}
          />
          <Field
            name="max_mileage"
            label="حداکثر کارکرد"
            type="number"
            suggestions={MILEAGE_SUGGESTIONS}
          />
        </div>
      </section>
      <section className="card p-6">
        <h2 className="mb-5 font-bold">مکان و مشخصات</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <label>
            <span className="label">شهرها</span>
            <Controller
              name="cities"
              control={control}
              render={({ field }) => (
                <MultiAutocomplete
                  values={field.value}
                  onChange={field.onChange}
                  options={CITIES}
                  placeholder="جستجو و افزودن شهر"
                />
              )}
            />
          </label>
          <label>
            <span className="label">محله‌ها</span>
            <Controller
              name="districts"
              control={control}
              render={({ field }) => (
                <MultiAutocomplete
                  values={field.value}
                  onChange={field.onChange}
                  options={TEHRAN_DISTRICTS}
                  placeholder="جستجو و افزودن محله"
                />
              )}
            />
          </label>
          <label>
            <span className="label">رنگ‌های مجاز</span>
            <Controller
              name="colors"
              control={control}
              render={({ field }) => (
                <MultiAutocomplete
                  values={field.value}
                  onChange={field.onChange}
                  options={COLORS}
                  placeholder="جستجو و افزودن رنگ"
                />
              )}
            />
          </label>
          <Auto
            name="transmission"
            label="نوع گیربکس"
            options={TRANSMISSIONS}
          />
          <Auto
            name="body_condition"
            label="وضعیت بدنه"
            options={BODY_CONDITIONS}
          />
        </div>
      </section>
      <section className="card p-6">
        <h2 className="mb-5 font-bold">فیلتر واژه‌ها</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <label>
            <span className="label">واژه‌های لازم (هر خط یک مورد)</span>
            <textarea
              rows={4}
              className="field"
              {...register("description_keywords")}
            />
          </label>
          <label>
            <span className="label">واژه‌های حذف‌کننده</span>
            <textarea
              rows={4}
              className="field"
              {...register("excluded_keywords")}
            />
          </label>
        </div>
      </section>
      <section className="card p-6">
        <h2 className="mb-5 font-bold">اعلان و زمان‌بندی</h2>
        <div className="grid gap-5 md:grid-cols-2">
          <Field
            name="minimum_match_score"
            label="حداقل امتیاز تطابق"
            type="number"
          />
          <Field
            name="crawl_interval_minutes"
            label="فاصله بررسی (دقیقه)"
            type="number"
          />
        </div>
        <div className="mt-5 flex flex-wrap gap-6">
          <Controller
            name="telegram_enabled"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                />{" "}
                اعلان تلگرام فعال باشد
              </label>
            )}
          />
          <Controller
            name="notify_once"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                />{" "}
                هر آگهی فقط یک‌بار ارسال شود
              </label>
            )}
          />
          <Controller
            name="send_images"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={field.onChange}
                />{" "}
                ارسال عکس‌ها به‌صورت آلبوم
              </label>
            )}
          />
        </div>
      </section>
      {save.isError && (
        <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">ذخیره انجام نشد:</p>
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
      <div className="flex justify-end gap-3">
        <button type="button" className="btn-secondary" onClick={() => nav(-1)}>
          انصراف
        </button>
        <button className="btn-primary" disabled={save.isPending}>
          {save.isPending ? "در حال ذخیره…" : "ذخیره جستجو"}
        </button>
      </div>
    </form>
  );
}
