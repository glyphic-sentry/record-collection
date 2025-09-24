// frontend/src/views/ListView.jsx
import React, { useState, useEffect, useMemo } from "react";

export default function ListView() {
  const [albums, setAlbums] = useState([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState("recent");

  // Fetch collection on mount
  useEffect(() => {
    fetch("/api/collection")
      .then((res) => res.json())
      .then((data) => setAlbums(data))
      .catch((err) => console.error("Error fetching collection:", err));
  }, []);

  // Filter by search and genre first
  const filtered = useMemo(() => {
    return albums.filter((album) => {
      const q = search.trim().toLowerCase();
      const matchTerm =
        !q ||
        album.title?.toLowerCase().includes(q) ||
        album.artist?.toLowerCase().includes(q) ||
        album.tracklist?.some((t) =>
          (typeof t === "string" ? t : t.title).toLowerCase().includes(q)
        );
      const matchGenre = !genre || album.genre === genre;
      return matchTerm && matchGenre;
    });
  }, [albums, search, genre]);

  // Then sort a COPY of the filtered list
  const sorted = useMemo(() => {
    const list = [...filtered]; // <- copy, don’t mutate
    if (sort === "alphabetical") {
      return list.sort((a, b) => a.artist.localeCompare(b.artist));
    } else {
      // Default: sort by date added descending
      return list.sort(
        (a, b) =>
          new Date(b.date_added || 0) - new Date(a.date_added || 0)
      );
    }
  }, [filtered, sort]);

  return (
    <div className="p-4">
      {/* Controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        <input
          className="border rounded px-2 py-1 text-black w-full sm:w-1/3"
          placeholder="Search albums…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="border rounded px-2 py-1 text-black"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        >
          <option value="">All genres</option>
          {[...new Set(albums.map((a) => a.genre).filter(Boolean))].map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          className="border rounded px-2 py-1 text-black"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="recent">Sort by date</option>
          <option value="alphabetical">Sort by artist</option>
        </select>
      </div>

      {/* Table */}
      <table className="w-full border-collapse">
      <thead>
        <tr className="bg-gray-700 text-white">
          <th className="p-2">Cover</th>
          <th className="p-2">Title</th>
          <th
            className="p-2 cursor-pointer"
            onClick={() =>
              setSort((prev) =>
                prev === "alphabetical" ? "recent" : "alphabetical"
              )
            }
          >
            Artist{sort === "alphabetical" ? " ▲" : ""}
          </th>
          <th className="p-2">Year</th>
          <th className="p-2">Genre</th>
          <th className="p-2">Label</th>
        </tr>
      </thead>
      <tbody>
        {sorted.map((album) => (
          <tr
            key={album.id}
            className="odd:bg-gray-800 even:bg-gray-700 text-white"
          >
            <td className="p-2">
              <img
                src={album.thumb || album.cover_image}
                alt={album.title}
                className="w-12 h-12 object-cover rounded"
              />
            </td>
            <td className="p-2">{album.title}</td>
            <td className="p-2">{album.artist}</td>
            <td className="p-2">{album.year}</td>
            <td className="p-2">{album.genre}</td>
            <td className="p-2">{album.label}</td>
          </tr>
        ))}
      </tbody>
      </table>
    </div>
  );
}
