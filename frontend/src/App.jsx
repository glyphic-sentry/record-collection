import { Routes, Route, Link } from "react-router-dom";
import GalleryView from "../views/GalleryView";
import ListView from "../views/ListView";
import ReportView from "../views/ReportView";

export default function App() {
  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Sticky navbar: stays fixed at the top and doesn’t affect page scrolling */}
      <nav className="p-4 flex gap-4 bg-gray-800 shadow sticky top-0 z-10 flex-shrink-0">
        <Link to="/">Gallery</Link>
        <Link to="/list">List</Link>
        <Link to="/report">Reports</Link>
      </nav>

      {/* Routed pages take up the rest of the vertical space */}
      <div className="flex-grow">
        <Routes>
          <Route path="/" element={<GalleryView />} />
          <Route path="/list" element={<ListView />} />
          <Route path="/report" element={<ReportView />} />
        </Routes>
      </div>
    </div>
  );
}
