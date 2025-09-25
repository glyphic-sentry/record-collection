// frontend/src/App.jsx
import React, { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom"; // <-- no BrowserRouter here
import GalleryView from "./views/GalleryView.jsx";
import ListView from "./views/ListView.jsx";
import ReportView from "./views/ReportView.jsx";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("Render error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, color: "crimson" }}>
          <h2>Something went wrong.</h2>
          <p>Check the browser console for details.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const API_BASE = import.meta.env?.VITE_API_BASE ?? "";

export default function App() {
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/collection`, {
          headers: { Accept: "application/json" },
        });
        if (!res.ok) throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
        const data = await res.json();

        // Normalize common shapes then prefer server-provided cover_image:
        let records = Array.isArray(data) ? data : (data?.records || data?.collection || data?.items || []);
        if (!Array.isArray(records)) records = [];
        if (!cancelled) setCollection(records);
      } catch (e) {
        console.error("Failed to load collection:", e);
        if (!cancelled) setErr(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <ErrorBoundary>
      <header style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
        <Link to="/">Gallery</Link>
        <Link to="/list">List</Link>
        <Link to="/report">Report</Link>
        <span style={{ opacity: 0.7 }}>{loading ? "Loading…" : `Total: ${collection.length}`}</span>
        {err && <span style={{ color: "crimson", marginLeft: 8 }}>Failed to load collection</span>}
      </header>

      {!loading && (
        <Routes>
          <Route path="/" element={<GalleryView items={collection} />} />
          <Route path="/list" element={<ListView items={collection} />} />
          <Route path="/report" element={<ReportView />} />
        </Routes>
      )}
    </ErrorBoundary>
  );
}
