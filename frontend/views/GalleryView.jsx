import React, { useEffect, useState, useRef } from "react";
import "../index.css";

const GalleryView = () => {
  const [albums, setAlbums] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [darkMode, setDarkMode] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    fetch("/api/collection")
      .then((res) => res.json())
      .then((data) => {
        setAlbums(data);
        setFiltered(data);
      });
  }, []);

  useEffect(() => {
    const filteredAlbums = albums.filter(
      (a) =>
        a.title.toLowerCase().includes(search.toLowerCase()) &&
        (genre === "" || a.genre === genre)
    );
    setFiltered(filteredAlbums);
  }, [search, genre, albums]);

  const scrollLeft = () => {
    containerRef.current.scrollBy({ left: -300, behavior: "smooth" });
  };

  const scrollRight = () => {
    containerRef.current.scrollBy({ left: 300, behavior: "smooth" });
  };

  const handleMouseDrag = () => {
    let isDragging = false;
    let startX;
    let scrollLeft;

    const container = containerRef.current;
    if (!container) return;

    const onMouseDown = (e) => {
      isDragging = true;
      startX = e.pageX - container.offsetLeft;
      scrollLeft = container.scrollLeft;
    };

    const onMouseLeave = () => (isDragging = false);
    const onMouseUp = () => (isDragging = false);

    const onMouseMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();
      const x = e.pageX - container.offsetLeft;
      const walk = (x - startX) * 1.5;
      container.scrollLeft = scrollLeft - walk;
    };

    container.addEventListener("mousedown", onMouseDown);
    container.addEventListener("mouseleave", onMouseLeave);
    container.addEventListener("mouseup", onMouseUp);
    container.addEventListener("mousemove", onMouseMove);

    return () => {
      container.removeEventListener("mousedown", onMouseDown);
      container.removeEventListener("mouseleave", onMouseLeave);
      container.removeEventListener("mouseup", onMouseUp);
      container.removeEventListener("mousemove", onMouseMove);
    };
  };

  useEffect(handleMouseDrag, []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "ArrowLeft") scrollLeft();
      else if (e.key === "ArrowRight") scrollRight();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className={darkMode ? "bg-black text-white" : "bg-white text-black"}>
      <div className="flex p-4 items-center gap-4">
        <input
          className="px-2 py-1 border rounded"
          type="text"
          placeholder="Search albums..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="px-2 py-1 border rounded"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        >
          <option value="">All Genres</option>
          {[...new Set(albums.map((a) => a.genre))].map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <button
          className="px-2 py-1 border rounded"
          onClick={() => setDarkMode((prev) => !prev)}
        >
          Toggle {darkMode ? "Light" : "Dark"} Mode
        </button>
      </div>

      <div
        ref={containerRef}
        className="scroll-smooth overflow-x-auto whitespace-nowrap scrollbar-hide px-4 cursor-grab select-none"
      >
        <div className="flex gap-4">
          {filtered.map((album) => (
            <div
              key={album.id}
              className="flex-shrink-0 text-center w-48 sm:w-56 md:w-64 lg:w-72"
            >
              <img
                src={album.cover_image}
                alt={album.title}
                className="w-full h-auto object-contain rounded shadow"
              />
              <p className="mt-2 text-sm font-medium">{album.title}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default GalleryView;
