// frontend/src/views/ListView.js
import React, { useCallback, useMemo, useState } from "react";

function resolveImg(album) {
  if (!album) return "/static/fallback.jpg";
  if (album.cover_image) return album.cover_image;
  if (album.id) return `/cover/${album.id}`; // trigger auto-download on first view
  return "/static/fallback.jpg";
}

/** Focusable, fully clickable row that opens a modal with details. */
function ListRow({ album, onOpen }) {
  const cover = resolveImg(album);
  const subtitle = [
    album?.artist ?? album?.artists?.[0]?.name ?? "",
    album?.year ? `• ${album.year}` : "",
    album?.label ? `• ${album.label}` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const handleOpen = useCallback(() => onOpen?.(album), [album, onOpen]);
  const handleKey = useCallback(
    (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onOpen?.(album);
      }
    },
    [album, onOpen]
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKey}
      style={{
        display: "grid",
        gridTemplateColumns: "64px 1fr 24px",
        gap: 12,
        alignItems: "center",
        padding: "10px 12px",
        borderBottom: "1px solid #e9e9e9",
        cursor: "pointer",
        background: "transparent",
      }}
      aria-label={`Open details for ${album?.artist ?? ""} – ${album?.title ?? ""}`}
    >
      <img
        src={cover}
        alt={`${album?.title ?? "Record"} cover`}
        onError={(e) => {
          e.currentTarget.src = "/static/fallback.jpg";
        }}
        style={{
          width: 64,
          height: 64,
          objectFit: "cover",
          borderRadius: 6,
          background: "#f0f0f0",
        }}
        loading="lazy"
      />

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontWeight: 600,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: 1.2,
          }}
          title={album?.title || ""}
        >
          {album?.title ?? album?.name ?? "(untitled)"}
        </div>
        <div
          style={{
            opacity: 0.75,
            fontSize: 12,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: 1.3,
            marginTop: 2,
          }}
          title={subtitle}
        >
          {subtitle}
        </div>
        {album?.genre && (
          <div style={{ opacity: 0.65, fontSize: 12, marginTop: 2 }}>
            {Array.isArray(album.genre) ? album.genre.join(", ") : album.genre}
          </div>
        )}
      </div>

      {/* chevron */}
      <div
        aria-hidden
        style={{
          justifySelf: "end",
          color: "#bbb",
          fontSize: 18,
          lineHeight: 1,
          userSelect: "none",
        }}
      >
        ▸
      </div>
    </div>
  );
}

function Modal({ album, onClose }) {
  if (!album) return null;

  const discogsUrl = album?.id ? `https://www.discogs.com/release/${album.id}` : null;
  const cover = album?.cover_image || (album?.id ? `/cover/${album.id}` : "/static/fallback.jpg");
  const back = album?.back_image || album?.back_thumb || (album?.id ? `/back/${album.id}` : null);

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        display: "grid",
        placeItems: "center",
        zIndex: 1000,
        padding: 16,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(100%, 960px)",
          background: "#111",
          color: "#fff",
          borderRadius: 12,
          overflow: "hidden",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: back ? "1fr 1fr" : "1fr",
            gap: 8,
            background: "#000",
          }}
        >
          <img
            src={cover}
            alt="front cover"
            style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
            onError={(e) => {
              e.currentTarget.src = "/static/fallback.jpg";
            }}
          />
          {back && (
            <img
              src={back}
              alt="back cover"
              style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
              onError={(e) => {
                e.currentTarget.src = "/static/fallback.jpg";
              }}
            />
          )}
        </div>

        <div style={{ padding: 16, display: "grid", gap: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <div>
              <h3 style={{ margin: 0 }}>{album.title}</h3>
              <div style={{ opacity: 0.8 }}>{album.artist}</div>
              <div style={{ opacity: 0.7, fontSize: 12 }}>
                {[
                  album.year,
                  album.label,
                  album.format,
                  Array.isArray(album.genre) ? album.genre.join(", ") : album.genre,
                ]
                  .filter(Boolean)
                  .join(" • ")}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {discogsUrl && (
                <a
                  href={discogsUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#9ae6b4", textDecoration: "none" }}
                >
                  View on Discogs ↗
                </a>
              )}
              <button
                onClick={onClose}
                style={{
                  color: "#ddd",
                  background: "transparent",
                  border: "1px solid #555",
                  borderRadius: 8,
                  padding: "6px 10px",
                }}
              >
                Close
              </button>
            </div>
          </div>

          {Array.isArray(album.tracklist) && album.tracklist.length > 0 && (
            <div>
              <h4 style={{ margin: "12px 0 6px" }}>Tracklist</h4>
              <ol style={{ margin: 0, paddingLeft: 18, columns: 2, columnGap: 24 }}>
                {album.tracklist.map((t, i) => (
                  <li key={i} style={{ marginBottom: 4 }}>
                    {t}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ListView({ items = [] }) {
  const [selected, setSelected] = useState(null);
  const handleOpen = useCallback((album) => setSelected(album), []);
  const handleClose = useCallback(() => setSelected(null), []);

  const rows = useMemo(
    () =>
      items.map((album) => (
        <ListRow key={album.id ?? `${album.artist}-${album.title}`} album={album} onOpen={handleOpen} />
      )),
    [items, handleOpen]
  );

  return (
    <div style={{ padding: "8px 0" }}>
      {rows.length > 0 ? rows : <div style={{ padding: 16, opacity: 0.7 }}>No records found.</div>}
      <Modal album={selected} onClose={handleClose} />
    </div>
  );
}
