// frontend/src/views/ListView.jsx
import React from "react";

export default function ListView({ items = [] }) {
  return (
    <div style={{ padding: 16 }}>
      {items.map((r) => (
        <div
          key={r.id ?? r.imageId ?? r.title}
          style={{
            display: "grid",
            gridTemplateColumns: "64px 1fr",
            gap: 12,
            alignItems: "center",
            padding: "8px 0",
            borderBottom: "1px solid #eee",
          }}
        >
          <img
            src={r?.cover_image || "/static/fallback.jpg"}
            alt={`${r?.title ?? "Record"} cover`}
            onError={(e) => { e.currentTarget.src = "/static/fallback.jpg"; }}
            style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6 }}
          />
          <div>
            <div style={{ fontWeight: 600 }}>{r?.title ?? r?.name ?? "(untitled)"}</div>
            <div style={{ opacity: 0.7, fontSize: 12 }}>
              {r?.artist ?? r?.artists?.[0]?.name ?? ""} {r?.year ? `• ${r.year}` : ""}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
