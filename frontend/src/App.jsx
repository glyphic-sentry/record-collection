import { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import GalleryView from "../views/GalleryView";
import ListView from "../views/ListView";
import ReportView from "../views/ReportView";

export default function App() {
  return (
    <div className="bg-gray-900 text-white min-h-screen">
      <nav className="p-4 flex gap-4 bg-gray-800 shadow">
        <Link to="/">Gallery</Link>
        <Link to="/list">List</Link>
        <Link to="/report">Reports</Link>
      </nav>
      <Routes>
        <Route path="/" element={<GalleryView />} />
        <Route path="/list" element={<ListView />} />
        <Route path="/report" element={<ReportView />} />
      </Routes>
    </div>
  );
}
