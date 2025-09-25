import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import GalleryView from "./GalleryView";
import ListView from "./ListView";
// Removed the direct import of collection.json

export default function App() {
  // State to hold the collection data
  const [collection, setCollection] = useState([]);

  // Fetch collection data from the API on component mount
  useEffect(() => {
    fetch("/api/collection")
      .then((res) => res.json())
      .then((data) => {
        setCollection(data);
      })
      .catch((error) => {
        console.error("Failed to fetch collection data:", error);
      });
  }, []);

  return (
    <BrowserRouter>
      <header style={{ padding: 12, display: "flex", gap: 12 }}>
        <Link to="/">Gallery</Link>
        <Link to="/list">List</Link>
        <span style={{ opacity: 0.6 }}>
          Total: {collection?.length ?? 0}
        </span>
      </header>

      <Routes>
        <Route path="/" element={<GalleryView items={collection} />} />
        <Route path="/list" element={<ListView items={collection} />} />
      </Routes>
    </BrowserRouter>
  );
}
