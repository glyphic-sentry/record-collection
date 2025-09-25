import React from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import GalleryView from "./views/GalleryView.jsx";
import ListView from "./views/ListView.jsx";
import collection from "../collection.json";

export default function App() {
  return (
    <BrowserRouter>
      <header style={{ padding: 12, display: "flex", gap: 12 }}>
        <Link to="/">Gallery</Link>
        <Link to="/list">List</Link>
        <span style={{ opacity: 0.6 }}>Total: {collection?.length ?? 0}</span>
      </header>

      <Routes>
        <Route path="/" element={<GalleryView items={collection} />} />
        <Route path="/list" element={<ListView items={collection} />} />
      </Routes>
    </BrowserRouter>
  );
}
