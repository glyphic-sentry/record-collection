// frontend/src/App.jsx
import React, { useMemo, useState } from "react";
import { Routes, Route, Link, useLocation, BrowserRouter } from "react-router-dom";
import GalleryView from "./views/GalleryView.jsx";
import ListView from "./views/ListView.jsx";
import ReportView from "./views/ReportView.jsx";
import useFilteredCollection from "../hooks/useFilteredCollection.js";

function useQuery() {
  const { search } = useLocation();
  return React.useMemo(() => new URLSearchParams(search), [search]);
}

export default function Root() {
  // Global UI state
  const [term, setTerm] = useState("");
  const [genre, setGenre] = useState("");
  const [label, setLabel] = useState("");
  const [year, setYear] = useState("");
  const [sort, setSort] = useState("recent"); // 'recent' | 'alpha'

  // Fetch & filter base on term/genre/year (from your existing hook)
  const { albums, isLoading, error } = useFilteredCollection({ term, genre, year });

  // Apply label filter and sort
  const filtered = useMemo(() => {
    let arr = albums;
    if (label) {
      const needle = label.toLowerCase();
      arr = arr.filter(a => (a.label || "").toLowerCase().includes(needle));
    }
    if (sort === "alpha") {
      return [...arr].sort((a, b) =>
        (a.artist || "").localeCompare(b.artist || "") || (a.title || "").localeCompare(b.title || "")
      );
    }
    // recent (date_added desc)
    return [...arr].sort((a, b) => (b.date_added || "").localeCompare(a.date_added || ""));
  }, [albums, label, sort]);

  // Pull default filters from querystring (e.g. /list?genre=Punk)
  const q = useQuery();
  React.useEffect(() => {
    const g = q.get("genre"); if (g) setGenre(g);
    const l = q.get("label"); if (l) setLabel(l);
    const y = q.get("year");  if (y) setYear(y);
  }, [q]);

  // Build filter options from data
  const genres = useMemo(() => [...new Set(albums.map(a => a.genre).filter(Boolean))].sort(), [albums]);
  const labels = useMemo(() => [...new Set(albums.map(a => a.label).filter(Boolean))].sort(), [albums]);

  return (
    <BrowserRouter>
      <header style={{ padding: 12, display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
        <nav style={{ display: "flex", gap: 12 }}>
          <Link to="/">Gallery</Link>
          <Link to="/list">List</Link>
          <Link to="/report">Report</Link>
        </nav>
        <span style={{ opacity: 0.7, marginLeft: 8 }}>
          {isLoading ? "Loading…" : `Total: ${albums.length}`}
        </span>
        {error && <span style={{ color: "crimson", marginLeft: 8 }}>Failed to load collection</span>}

        {/* Search / Filters / Sort */}
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Search title or artist…"
          style={{ marginLeft: "auto", padding: 6, minWidth: 200 }}
        />
        <select value={genre} onChange={(e) => setGenre(e.target.value)} style={{ padding: 6 }}>
          <option value="">All genres</option>
          {genres.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
        <select value={label} onChange={(e) => setLabel(e.target.value)} style={{ padding: 6 }}>
          <option value="">All labels</option>
          {labels.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ padding: 6 }}>
          <option value="recent">Recent</option>
          <option value="alpha">Alphabetical</option>
        </select>
      </header>

      {!isLoading && (
        <Routes>
          <Route path="/" element={<GalleryView items={filtered} />} />
          <Route path="/list" element={<ListView items={filtered} />} />
          <Route path="/report" element={<ReportView />} />
        </Routes>
      )}
    </BrowserRouter>
  );
}
