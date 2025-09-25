import React, { useMemo, useState, useCallback } from "react";

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

export default function ListView({ items = [] }) {
  return (
    <div style={{ padding: 16 }}>
      {items.map((r) => (
        <div
          key={r.id ?? r.imageId}
          style={{
            display: "grid",
            gridTemplateColumns: "64px 1fr",
            gap: 12,
            alignItems: "center",
            padding: "8px 0",
            borderBottom: "1px solid #eee",
          }}
        >
          <SmartImg
            record={r}
            alt={`${r.title ?? "Record"} cover`}
            className="list-cover"
            style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6 }}
          />
          <div>
            <div style={{ fontWeight: 600 }}>{r.title ?? r.name ?? "(untitled)"}</div>
            <div style={{ opacity: 0.7, fontSize: 12 }}>
              {r.artist ?? r.artists?.[0]?.name ?? ""} {r.year ? `• ${r.year}` : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
