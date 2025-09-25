import React, { useMemo, useState, useCallback } from "react";

/**
 * Returns a list of possible image URLs for a given record.
 * We try:
 *   <id>.(jpeg|jpg|png|webp)
 *   <id>_back.(...)
 *   thumb_<id>.(...)
 *   thumb_<id>_back.(...)
 * for both imageId (if present) and id.
 */
function buildImageCandidates(record, dir = "/images") {
  const ids = [];
  if (record?.imageId != null) ids.push(String(record.imageId));
  if (record?.id != null) ids.push(String(record.id));

  const bases = new Set();
  for (const id of ids) {
    if (!id) continue;
    const core = [id, `${id}_back`];
    const thumbs = core.map((c) => `thumb_${c}`);
    [...core, ...thumbs].forEach((b) => bases.add(b));
  }

  const exts = [".jpeg", ".jpg", ".png", ".webp"];
  const out = [];
  for (const b of bases) {
    for (const e of exts) out.push(`${dir}/${b}${e}`);
  }
  // Put non-thumb first to prefer full images
  out.sort((a, b) => a.includes("/thumb_") - b.includes("/thumb_"));
  return out;
}

function SmartImg({ record, alt, className, dir = "/images", ...imgProps }) {
  const candidates = useMemo(() => buildImageCandidates(record, dir), [record, dir]);
  const [idx, setIdx] = useState(0);
  const src = candidates[idx] ?? "";

  const onError = useCallback(
    (ev) => {
      if (idx < candidates.length - 1) setIdx((i) => i + 1);
      if (imgProps.onError) imgProps.onError(ev);
    },
    [idx, candidates.length, imgProps]
  );

  return <img src={src} alt={alt} className={className} onError={onError} {...imgProps} />;
}

export default function GalleryView({ items = [] }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: 16,
        padding: 16,
      }}
    >
      {items.map((r) => (
        <figure key={r.id ?? r.imageId} style={{ margin: 0 }}>
          <SmartImg
            record={r}
            alt={`${r.title ?? "Record"} cover`}
            className="gallery-cover"
            style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "cover", borderRadius: 8 }}
          />
          <figcaption style={{ marginTop: 8 }}>
            <div style={{ fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {r.title ?? r.name ?? "(untitled)"}
            </div>
            <div style={{ opacity: 0.7, fontSize: 12, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {r.artist ?? r.artists?.[0]?.name ?? ""}
            </div>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
