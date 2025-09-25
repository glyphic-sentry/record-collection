// frontend/src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import GalleryView from "./views/GalleryView.jsx";
import ListView from "./views/ListView.jsx";

/**
 * Minimal error boundary to prevent white-screen on render-time exceptions.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // Log to console so we see the real, unminified error and component stack
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

const API_BASE = import.meta.env?.VITE_API_BASE ?? ""; // e.g. http://localhost:5000

export default function App() {
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const url = `${API_BASE}/api/collection`;
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) {
          throw new Error(`Fetch failed: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();

        // Normalize to an array — handle common shapes:
        // [ ... ], {records:[...]}, {collection:[...]}, {items:[...]}.
        let records = [];
        if (Array.isArray(data)) {
          records = data;
        } else if (data && typeof data === "object") {
          if (Array.isArray(data.records)) records = data.records;
          else if (Array.isArray(data.collection)) records = data.collection;
          else if (Array.isArray(data.items)) records = data.items;
        }

        if (!Array.isArray(records)) {
          console.warn("Unexpected API payload, got:", data);
          records = [];
        }

        if (!cancelled) setCollection(records);
      } catch (e) {
        console.error("Failed to load collection:", e);
        if (!cancelled) setErr(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <header style={{ padding: 12, display: "flex", gap: 12, alignItems: "center" }}>
          <Link to="/">Gallery</Link>
          <Link to="/list">List</Link>
          <span style={{ opacity: 0.7 }}>
            {loading ? "Loading…" : `Total: ${collection.length}`}
          </span>
          {err && (
            <span style={{ color: "crimson", marginLeft: 8 }}>
              Failed to load collection
            </span>
          )}
        </header>

        {/* Only render routes once we either loaded or failed (to avoid child assumptions during initial mount) */}
        {!loading && (
          <Routes>
            <Route path="/" element={<GalleryView items={Array.isArray(collection) ? collection : []} />} />
            <Route path="/list" element={<ListView items={Array.isArray(collection) ? collection : []} />} />
          </Routes>
        )}
      </ErrorBoundary>
    </BrowserRouter>
  );
}
