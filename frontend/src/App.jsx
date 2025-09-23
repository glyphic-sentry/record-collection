import { Routes, Route, Link } from "react-router-dom";
import GalleryView from "./views/GalleryView";
import ListView from "./views/ListView";
import ReportView from "./views/ReportView";

export default function App() {
  return (
    <>
      {/* Navigation bar */}
      <nav className="sticky top-0 bg-gray-800 text-white flex gap-4 p-4 shadow">
        <Link to="/">Gallery</Link>
        <Link to="/list">List</Link>
        <Link to="/report">Reports</Link>
      </nav>

      {/* Page routes */}
      <Routes>
        <Route path="/" element={<GalleryView />} />
        <Route path="/list" element={<ListView />} />
        <Route path="/report" element={<ReportView />} />
      </Routes>
    </>
  );
}
