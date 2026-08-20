import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CarFront, Grid2X2, List, Search, Trash2 } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { faDate, faNum, money } from "../lib/format";
import type { Listing, Paginated } from "../types";
export default function ListingsPage() {
  const [view, setView] = useState<"grid" | "table">("grid");
  const [q, setQ] = useState("");
  const [ordering, setOrdering] = useState("-discovered_at");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["listings", q, ordering],
    queryFn: () =>
      api
        .get<Paginated<Listing>>("/listings/", { params: { q, ordering } })
        .then((r) => r.data),
  });
  const pageIds = data?.results.map((item) => item.id) ?? [];
  const allSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const toggle = (id: number) =>
    setSelected((current) => {
      const next = new Set(current);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  const remove = useMutation({
    mutationFn: () =>
      api.post("/listings/bulk-delete/", { ids: Array.from(selected) }),
    onSuccess: () => {
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["listings"] });
    },
  });
  const removeSelected = () => {
    if (
      selected.size &&
      confirm(`${faNum(selected.size)} آگهی انتخاب‌شده حذف شود؟`)
    )
      remove.mutate();
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold">آگهی‌های پیدا شده</h1>
        <p className="mt-2 text-sm text-black/45">
          خودروهایی که با معیارهای شما تطابق دارند.
        </p>
      </div>
      <div className="card flex flex-col gap-3 p-3 md:flex-row">
        <label className="relative flex-1">
          <Search className="absolute right-3 top-3 text-black/30" size={19} />
          <input
            className="field pr-10"
            placeholder="جستجو در عنوان و توضیحات…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <select
          className="field md:w-48"
          value={ordering}
          onChange={(e) => setOrdering(e.target.value)}
        >
          <option value="-discovered_at">جدیدترین</option>
          <option value="price">کمترین قیمت</option>
          <option value="-price">بیشترین قیمت</option>
          <option value="mileage">کمترین کارکرد</option>
          <option value="-year">جدیدترین مدل</option>
          <option value="-matches__match_score">بیشترین تطابق</option>
        </select>
        <div className="flex rounded-xl border border-black/10 p-1">
          <button
            className={`px-3 ${view === "grid" ? "text-wine" : ""}`}
            onClick={() => setView("grid")}
          >
            <Grid2X2 size={18} />
          </button>
          <button
            className={`px-3 ${view === "table" ? "text-wine" : ""}`}
            onClick={() => setView("table")}
          >
            <List size={19} />
          </button>
        </div>
      </div>
      {!!data?.results.length && (
        <div className="card flex flex-wrap items-center justify-between gap-3 p-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={() =>
                setSelected((current) => {
                  const next = new Set(current);
                  if (allSelected) pageIds.forEach((id) => next.delete(id));
                  else pageIds.forEach((id) => next.add(id));
                  return next;
                })
              }
            />
            انتخاب همه آگهی‌های این صفحه
          </label>
          <button
            type="button"
            className="btn-secondary border-red-200 text-red-600 hover:bg-red-50"
            disabled={!selected.size || remove.isPending}
            onClick={removeSelected}
          >
            <Trash2 size={17} />
            {remove.isPending
              ? "در حال حذف…"
              : `حذف انتخاب‌شده‌ها (${faNum(selected.size)})`}
          </button>
        </div>
      )}
      {!isLoading && !data?.results.length ? (
        <div className="card grid min-h-72 place-items-center text-center">
          <div>
            <CarFront className="mx-auto text-black/20" size={48} />
            <h3 className="mt-4 font-bold">نتیجه‌ای وجود ندارد</h3>
            <p className="mt-2 text-sm text-black/45">
              پس از اولین بررسی، خودروهای منطبق اینجا نمایش داده می‌شوند.
            </p>
          </div>
        </div>
      ) : view === "grid" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data?.results.map((x) => (
            <article
              key={x.id}
              className={`card relative overflow-hidden transition hover:-translate-y-1 ${selected.has(x.id) ? "ring-2 ring-wine" : ""}`}
            >
              <label className="absolute right-3 top-3 z-10 grid h-9 w-9 cursor-pointer place-items-center rounded-lg bg-white/95 shadow-md">
                <input
                  type="checkbox"
                  checked={selected.has(x.id)}
                  onChange={() => toggle(x.id)}
                  aria-label={`انتخاب ${x.title}`}
                />
              </label>
              <Link to={`/listings/${x.id}`} className="block">
                <div className="h-48 bg-black/5">
                  {x.thumbnail_url ? (
                    <img
                      src={x.thumbnail_url}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <CarFront className="text-black/15" size={45} />
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <div className="flex justify-between gap-3">
                    <h3 className="font-bold">{x.title}</h3>
                    <span className="h-fit rounded-full bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                      {faNum(x.matches[0]?.match_score)}٪
                    </span>
                  </div>
                  <p className="mt-3 font-semibold text-wine">
                    {money(x.price)}
                  </p>
                  <div className="mt-3 flex gap-3 text-xs text-black/45">
                    <span>{faNum(x.year)}</span>
                    <span>{faNum(x.mileage)} کیلومتر</span>
                    <span>{x.city || "—"}</span>
                  </div>
                </div>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[800px] text-right text-sm">
            <thead className="bg-black/[.025] text-black/45">
              <tr>
                <th className="p-4 font-medium">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() =>
                      setSelected(allSelected ? new Set() : new Set(pageIds))
                    }
                    aria-label="انتخاب همه"
                  />
                </th>
                {[
                  "خودرو",
                  "قیمت",
                  "سال",
                  "کارکرد",
                  "شهر",
                  "تطابق",
                  "زمان کشف",
                ].map((x) => (
                  <th className="p-4 font-medium" key={x}>
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data?.results.map((x) => (
                <tr
                  className={`border-t border-black/5 ${selected.has(x.id) ? "bg-wine/[.04]" : ""}`}
                  key={x.id}
                >
                  <td className="p-4">
                    <input
                      type="checkbox"
                      checked={selected.has(x.id)}
                      onChange={() => toggle(x.id)}
                      aria-label={`انتخاب ${x.title}`}
                    />
                  </td>
                  <td className="p-4">
                    <Link
                      className="font-semibold hover:text-wine"
                      to={`/listings/${x.id}`}
                    >
                      {x.title}
                    </Link>
                  </td>
                  <td className="p-4">{money(x.price)}</td>
                  <td className="p-4">{faNum(x.year)}</td>
                  <td className="p-4">{faNum(x.mileage)}</td>
                  <td className="p-4">{x.city || "—"}</td>
                  <td className="p-4">{faNum(x.matches[0]?.match_score)}٪</td>
                  <td className="p-4">{faDate(x.discovered_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
