// frontend/src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import GalleryView from "./views/GalleryView.jsx";
import ListView from "./views/ListView.jsx";

export default function App() {
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/collection", { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!cancelled) setCollection(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!cancelled) setErr(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return (
    <BrowserRouter>
      <header style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
        <Link to="/">Gallery</Link>
        <Link to="/list">List</Link>
        <span style={{ opacity: 0.6 }}>
          {loading ? "Loading…" : `Total: ${collection?.length ?? 0}`}
        </span>
        {err && <span style={{ color: "crimson", marginLeft: 8 }}>Failed to load collection</span>}
      </header>

      <Routes>
        <Route path="/" element={<GalleryView items={collection} />} />
        <Route path="/list" element={<ListView items={collection} />} />
      </Routes>
    </BrowserRouter>
  );
}
