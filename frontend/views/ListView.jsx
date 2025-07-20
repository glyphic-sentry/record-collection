import React, { useEffect, useState } from "react";

export default function ListView() {
  const [albums, setAlbums] = useState([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [sort, setSort] = useState("recent");
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    fetch("/api/collection")
      .then((res) => res.json())
      .then((data) => setAlbums(data))
      .catch((err) => console.error("Error fetching collection:", err));
  }, []);

  const sortedAlbums = [...albums].sort((a, b) => {
    if (sort === "alphabetical") {
      const artistCompare = a.artist.localeCompare(b.artist);
      if (artistCompare !== 0) return artistCompare;
      return a.title.localeCompare(b.title);
    }
    return new Date(b.date_added) - new Date(a.date_added);
  });

  const filtered = sortedAlbums.filter((album) => {
    const matchSearch = album.title.toLowerCase().includes(search.toLowerCase()) ||
                        album.artist.toLowerCase().includes(search.toLowerCase());
    const matchGenre = genre === "" || album.genre === genre;
    return matchSearch && matchGenre;
  });

  const genres = [...new Set(albums.map((a) => a.genre).filter(Boolean))];

  return (
    <div className={`min-h-screen p-4 ${isDark ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
        <input
          className="border rounded px-2 py-1 text-black w-full sm:w-auto"
          placeholder="Search albums..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          className="border rounded px-2 py-1 text-black"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        >
          <option value="">All Genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select
          className="border rounded px-2 py-1 text-black"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
        >
          <option value="recent">Recent</option>
          <option value="alphabetical">Alphabetical</option>
        </select>

        <button
          className="border rounded px-2 py-1"
          onClick={() => setIsDark(!isDark)}
        >
          Toggle {isDark ? "Light" : "Dark"} Mode
        </button>
      </div>

      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-700 text-left">
            <th className="p-2">Cover</th>
            <th className="p-2">Title</th>
            <th className="p-2">Artist</th>
            <th className="p-2">Year</th>
            <th className="p-2">Genre</th>
            <th className="p-2">Label</th>
            <th className="p-2">Link</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((album) => (
            <tr key={album.id} className="border-t border-gray-600 hover:bg-gray-800">
              <td className="p-2">
                <img src={album.thumb || album.cover_image} alt={album.title} className="h-16 w-16 object-cover rounded" />
              </td>
              <td className="p-2">{album.title}</td>
              <td className="p-2">{album.artist}</td>
              <td className="p-2">{album.year}</td>
              <td className="p-2">{album.genre}</td>
              <td className="p-2">{album.label}</td>
              <td className="p-2">
                <a
                  href={`https://www.discogs.com/release/${album.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  View
                </a>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
