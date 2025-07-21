import React, { useEffect, useState } from "react";

export default function ListView() {
  const [albums, setAlbums] = useState([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [sortField, setSortField] = useState("date_added");
  const [sortDirection, setSortDirection] = useState("desc");
  const [isDark, setIsDark] = useState(true);
  const [binNumber, setBinNumber] = useState(1);
  const [endOfBinIds, setEndOfBinIds] = useState([]);

  useEffect(() => {
    fetch("/api/collection")
      .then((res) => res.json())
      .then((data) => setAlbums(data))
      .catch((err) => console.error("Error fetching collection:", err));
  }, []);

  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const sortedAlbums = [...albums].sort((a, b) => {
    let result = 0;
    if (sortField === "artist") {
      result = a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title);
    } else if (sortField === "title") {
      result = a.title.localeCompare(b.title);
    } else if (sortField === "year") {
      result = (a.year || 0) - (b.year || 0);
    } else {
      result = new Date(a.date_added) - new Date(b.date_added);
    }
    return sortDirection === "asc" ? result : -result;
  });

  const filtered = sortedAlbums.filter((album) => {
    const matchSearch = album.title.toLowerCase().includes(search.toLowerCase()) ||
                        album.artist.toLowerCase().includes(search.toLowerCase());
    const matchGenre = genre === "" || album.genre === genre;
    return matchSearch && matchGenre;
  });

  const genres = [...new Set(albums.map((a) => a.genre).filter(Boolean))];

  const applyBinMarking = () => {
    const updated = [...albums];
    const sorted = [...updated].sort((a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title));
    let currentBin = 1;
    for (let i = 0; i < sorted.length; i++) {
      sorted[i].bin = currentBin;
      if (endOfBinIds.includes(sorted[i].id)) {
        currentBin++;
      }
    }
    setAlbums(sorted);
    alert("Bins updated. Be sure to persist changes manually if needed.");
  };

  const toggleEndOfBin = (id) => {
    setEndOfBinIds((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

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

        <button
          className="border rounded px-2 py-1"
          onClick={() => setIsDark(!isDark)}
        >
          Toggle {isDark ? "Light" : "Dark"} Mode
        </button>
      </div>

      <div className="flex flex-wrap gap-2 items-center mb-4">
        <input
          type="number"
          value={binNumber}
          onChange={(e) => setBinNumber(Number(e.target.value))}
          className="border rounded px-2 py-1 text-black"
          placeholder="Bin Number"
        />
        <button
          className="border rounded px-2 py-1 bg-blue-500 text-white"
          onClick={applyBinMarking}
        >
          Apply Bin Marking
        </button>
        <span>Click a row to toggle End of Bin marker</span>
      </div>

      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-700 text-left">
            <th className="p-2">Cover</th>
            <th className="p-2 cursor-pointer" onClick={() => handleSort("title")}>Title</th>
            <th className="p-2 cursor-pointer" onClick={() => handleSort("artist")}>Artist</th>
            <th className="p-2 cursor-pointer" onClick={() => handleSort("year")}>Year</th>
            <th className="p-2">Genre</th>
            <th className="p-2">Label</th>
            <th className="p-2">Bin</th>
            <th className="p-2">Link</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((album) => (
            <tr
              key={album.id}
              className={`border-t border-gray-600 hover:bg-gray-800 cursor-pointer ${endOfBinIds.includes(album.id) ? "bg-red-400" : ""}`}
              onClick={() => toggleEndOfBin(album.id)}
            >
              <td className="p-2">
                <img src={album.thumb || album.cover_image} alt={album.title} className="h-16 w-16 object-cover rounded" />
              </td>
              <td className="p-2">{album.title}</td>
              <td className="p-2">{album.artist}</td>
              <td className="p-2">{album.year}</td>
              <td className="p-2">{album.genre}</td>
              <td className="p-2">{album.label}</td>
              <td className="p-2">{album.bin || ""}</td>
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
