import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Copy,
  MoreHorizontal,
  Pause,
  Play,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { faDate, faNum, money } from "../lib/format";
import type { Paginated, SearchProfile } from "../types";
export default function SearchesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["searches"],
    queryFn: () =>
      api.get<Paginated<SearchProfile>>("/searches/").then((r) => r.data),
  });
  const mutate = useMutation({
    mutationFn: ({
      id,
      action,
      payload,
    }: {
      id: number;
      action: string;
      payload?: unknown;
    }) =>
      action === "delete"
        ? api.delete(`/searches/${id}/`)
        : action === "run"
          ? api.post(`/searches/${id}/run/`)
          : action === "duplicate"
            ? api.post(`/searches/${id}/duplicate/`)
            : api.patch(`/searches/${id}/`, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["searches"] }),
  });
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">جستجوهای من</h1>
          <p className="mt-2 text-sm text-black/45">
            معیارهای دقیق را تعریف کنید؛ باقی کار با خودروبان.
          </p>
        </div>
        <Link to="/searches/new" className="btn-primary">
          <Plus size={18} /> جستجوی جدید
        </Link>
      </div>
      {!isLoading && !data?.results.length ? (
        <div className="card grid min-h-[420px] place-items-center p-8 text-center">
          <div>
            <div className="mx-auto mb-5 grid h-20 w-20 place-items-center rounded-full bg-wine/10 text-wine">
              <Search size={35} />
            </div>
            <h2 className="text-xl font-bold">
              اولین شکار هوشمندتان را بسازید
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-black/45">
              برند، بودجه و ویژگی‌های خودرو را وارد کنید تا آگهی‌های جدید را
              برایتان پیدا کنیم.
            </p>
            <Link to="/searches/new" className="btn-primary mt-6">
              ساخت اولین جستجو
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {data?.results.map((p) => (
            <article className="card p-5" key={p.id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${p.is_active ? "bg-emerald-500" : "bg-black/20"}`}
                    />
                    <h3 className="font-bold">{p.title}</h3>
                  </div>
                  <p className="text-sm text-black/45">
                    {[p.brand, p.model, p.trim].filter(Boolean).join(" ") ||
                      "همه خودروها"}
                  </p>
                </div>
                <MoreHorizontal className="text-black/30" />
              </div>
              <div className="my-5 grid grid-cols-2 gap-3 rounded-xl bg-cream p-4 text-sm">
                <div>
                  <span className="block text-xs text-black/35">بازه قیمت</span>
                  {money(p.min_price)} تا {money(p.max_price)}
                </div>
                <div>
                  <span className="block text-xs text-black/35">نتایج</span>
                  {faNum(p.matches_count)} آگهی
                </div>
              </div>
              <p className="mb-4 text-xs text-black/35">
                آخرین بررسی: {faDate(p.last_checked_at)}
              </p>
              <label className="mb-4 flex cursor-pointer items-center gap-2 text-sm text-black/60">
                <input
                  type="checkbox"
                  checked={p.send_images}
                  disabled={mutate.isPending}
                  onChange={() =>
                    mutate.mutate({
                      id: p.id,
                      action: "images",
                      payload: { send_images: !p.send_images },
                    })
                  }
                />
                ارسال عکس‌ها به‌صورت آلبوم
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  className="btn-primary flex-1"
                  disabled={mutate.isPending}
                  onClick={() => mutate.mutate({ id: p.id, action: "run" })}
                >
                  <RefreshCw size={16} /> بررسی الان
                </button>
                <button
                  title="فعال/غیرفعال"
                  className="btn-secondary px-3"
                  onClick={() =>
                    mutate.mutate({
                      id: p.id,
                      action: "toggle",
                      payload: { is_active: !p.is_active },
                    })
                  }
                >
                  {p.is_active ? <Pause size={16} /> : <Play size={16} />}
                </button>
                <button
                  title="کپی"
                  className="btn-secondary px-3"
                  onClick={() =>
                    mutate.mutate({ id: p.id, action: "duplicate" })
                  }
                >
                  <Copy size={16} />
                </button>
                <button
                  title="حذف"
                  className="btn-secondary px-3 text-red-600"
                  onClick={() =>
                    confirm("این جستجو حذف شود؟") &&
                    mutate.mutate({ id: p.id, action: "delete" })
                  }
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <Link
                to={`/searches/${p.id}/edit`}
                className="mt-3 block text-center text-xs text-wine"
              >
                ویرایش معیارها
              </Link>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
