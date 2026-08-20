import { useQuery } from "@tanstack/react-query";
import {
  ArrowUpLeft,
  CarFront,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { faDate, faNum, money } from "../lib/format";
import type { Listing } from "../types";
export default function ListingDetailPage() {
  const { id } = useParams();
  const [activeImage, setActiveImage] = useState(0);
  const { data: x, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: () => api.get<Listing>(`/listings/${id}/`).then((r) => r.data),
  });
  useEffect(() => setActiveImage(0), [id]);
  if (isLoading || !x) return <div className="card h-96 animate-pulse" />;
  const images = Array.from(
    new Set([...(x.image_urls ?? []), x.thumbnail_url].filter(Boolean)),
  );
  const showImage = (direction: number) =>
    setActiveImage((current) =>
      (current + direction + images.length) % images.length,
    );
  const specs = [
    ["سال", faNum(x.year)],
    ["کارکرد", `${faNum(x.mileage)} کیلومتر`],
    ["رنگ", x.color || "—"],
    ["گیربکس", x.transmission || "—"],
    ["بدنه", x.body_condition || "—"],
    ["مکان", [x.city, x.district].filter(Boolean).join("، ") || "—"],
  ];
  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="card overflow-hidden">
          <div className="relative h-[420px] bg-black/5">
            {images.length ? (
              <img
                src={images[activeImage]}
                alt={`${x.title} - تصویر ${activeImage + 1}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full place-items-center">
                <CarFront size={70} className="text-black/15" />
              </div>
            )}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="تصویر قبلی"
                  onClick={() => showImage(-1)}
                  className="absolute right-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/75"
                >
                  <ChevronRight size={24} />
                </button>
                <button
                  type="button"
                  aria-label="تصویر بعدی"
                  onClick={() => showImage(1)}
                  className="absolute left-4 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition hover:bg-black/75"
                >
                  <ChevronLeft size={24} />
                </button>
                <span className="absolute bottom-4 left-4 rounded-full bg-black/60 px-3 py-1 text-xs font-bold text-white backdrop-blur">
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
                  className={`h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${activeImage === index ? "border-wine" : "border-transparent opacity-60 hover:opacity-100"}`}
                >
                  <img
                    src={image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="card p-7">
          <div className="mb-5 flex items-start justify-between">
            <div>
              <p className="text-xs text-black/40">
                کشف‌شده در {faDate(x.discovered_at)}
              </p>
              <h1 className="mt-2 text-2xl font-extrabold">{x.title}</h1>
            </div>
            <span className="rounded-full bg-emerald-50 px-3 py-1.5 font-bold text-emerald-700">
              {faNum(x.matches[0]?.match_score)}٪ تطابق
            </span>
          </div>
          <div className="mb-6 text-2xl font-bold text-wine">
            {money(x.price)}
          </div>
          <div className="grid grid-cols-2 gap-3">
            {specs.map(([a, b]) => (
              <div className="rounded-xl bg-cream p-3" key={a}>
                <span className="block text-xs text-black/40">{a}</span>
                <span className="mt-1 block font-semibold">{b}</span>
              </div>
            ))}
          </div>
          <a
            className="btn-primary mt-6 w-full"
            href={x.url}
            target="_blank"
            rel="noreferrer"
          >
            مشاهده در دیوار <ArrowUpLeft size={17} />
          </a>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="mb-4 font-bold">توضیحات آگهی</h2>
          <p className="whitespace-pre-line text-sm leading-8 text-black/60">
            {x.description || "توضیحی برای این آگهی ثبت نشده است."}
          </p>
        </section>
        <section className="card p-6">
          <h2 className="mb-4 font-bold">چرا این آگهی منطبق است؟</h2>
          <div className="space-y-3">
            {Object.entries(x.matches[0]?.matched_fields ?? {})
              .filter(([, ok]) => ok)
              .map(([field]) => (
                <div className="flex items-center gap-2 text-sm" key={field}>
                  <CheckCircle2 className="text-emerald-600" size={18} />
                  <span>{field.replace("keyword:", "واژه: ")}</span>
                </div>
              ))}
          </div>
        </section>
      </div>
    </div>
  );
}
