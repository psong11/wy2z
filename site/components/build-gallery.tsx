// Bench-side photos from the build, ordered newest-first. Static assets
// live in site/public/gallery/. Dimensions are baked in so Next/Image
// can reserve the right aspect ratio without a layout shift on slow
// connections — most are landscape 4:3, two are portrait 3:4.

import Image from "next/image";

type GalleryPhoto = {
  src: string;
  width: number;
  height: number;
  date: string; // editorial caption, not the photo's EXIF
  alt: string;
};

const PHOTOS: GalleryPhoto[] = [
  { src: "/gallery/build-6403.jpg", width: 1600, height: 1200, date: "May 10", alt: "Build photo, May 10, 2026" },
  { src: "/gallery/build-6401.jpg", width: 1200, height: 1600, date: "May 10", alt: "Build photo, May 10, 2026" },
  { src: "/gallery/build-6389.jpg", width: 1200, height: 1600, date: "May 7",  alt: "Build photo, May 7, 2026" },
  { src: "/gallery/build-6377.jpg", width: 1600, height: 1200, date: "May 6",  alt: "Build photo, May 6, 2026 — first automated watering night" },
  { src: "/gallery/build-6373.jpg", width: 1600, height: 1200, date: "May 6",  alt: "Build photo, May 6, 2026" },
  { src: "/gallery/build-6372.jpg", width: 1600, height: 1200, date: "May 6",  alt: "Build photo, May 6, 2026" },
  { src: "/gallery/build-6371.jpg", width: 1600, height: 1200, date: "May 6",  alt: "Build photo, May 6, 2026" },
  { src: "/gallery/build-6370.jpg", width: 1600, height: 1200, date: "May 6",  alt: "Build photo, May 6, 2026" },
  { src: "/gallery/build-6368.jpg", width: 1600, height: 1200, date: "May 6",  alt: "Build photo, May 6, 2026 — wiring the BJT pump driver" },
  { src: "/gallery/build-6361.jpg", width: 1200, height: 1600, date: "May 3",  alt: "Build photo, May 3, 2026" },
  { src: "/gallery/build-6353.jpg", width: 1600, height: 1200, date: "May 2",  alt: "Build photo, May 2, 2026 — late night" },
  { src: "/gallery/build-6346.jpg", width: 1600, height: 1200, date: "May 2",  alt: "Build photo, May 2, 2026" },
  { src: "/gallery/build-6337.jpg", width: 1600, height: 1200, date: "May 2",  alt: "Build photo, May 2, 2026 — Day 1" },
];

export function BuildGallery() {
  return (
    <section className="mt-12 border-t border-slate-700">
      <div className="mx-auto max-w-[68ch] px-6 pt-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-slate-400">
          Build Gallery
        </p>
        <p className="mt-2 font-serif text-sm text-slate-500">
          Behind the dashboard — photos from the bench during the build.
        </p>
      </div>

      <div
        className="mt-6 overflow-x-auto px-6 pb-4 [scrollbar-width:thin]"
        style={{ scrollSnapType: "x mandatory" }}
      >
        <ul className="mx-auto flex max-w-[68ch] gap-4">
          {PHOTOS.map((p) => (
            <li
              key={p.src}
              className="shrink-0 basis-[80%] sm:basis-[55%]"
              style={{ scrollSnapAlign: "start" }}
            >
              <a href={p.src} target="_blank" rel="noopener noreferrer" className="block">
                <Image
                  src={p.src}
                  alt={p.alt}
                  width={p.width}
                  height={p.height}
                  sizes="(max-width: 640px) 80vw, 360px"
                  className="h-auto w-full rounded-sm border border-slate-700 bg-slate-900"
                />
                <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.15em] text-slate-500">
                  {p.date}
                </p>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
