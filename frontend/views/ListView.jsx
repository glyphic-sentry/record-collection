import React, { useEffect, useState } from "react";

/*
 * ListView displays the collection in a tabular form.  To improve
 * usability across different devices and user preferences, this
 * version introduces a view size control and a search-by selector.
 * Users can choose between "compact", "comfortable" and "large" modes,
 * and can limit the search to title, artist or both fields.
 * Sorting, filtering and bin marking are preserved.
 */

export default function ListView() {
  const [albums, setAlbums] = useState([]);
  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [sortField, setSortField] = useState("date_added");
  const [sortDirection, setSortDirection] = useState("desc");
  const [isDark, setIsDark] = useState(true);
  const [binNumber, setBinNumber] = useState(1);
  const [endOfBinIds, setEndOfBinIds] = useState([]);
  // New state controlling the size of the list view.
  // Possible values: 'compact', 'comfortable', 'large'.  Default is comfortable.
  const [viewSize, setViewSize] = useState("comfortable");
  // State controlling which field the search box applies to: title, artist or both.
  const [searchBy, setSearchBy] = useState("title");

  // Fetch albums on mount
  useEffect(() => {
    fetch("/api/collection")
      .then((res) => res.json())
      .then((data) => setAlbums(data))
      .catch((err) => console.error("Error fetching collection:", err));
  }, []);

  // Toggle sorting on column headers
  const handleSort = (field) => {
    if (field === sortField) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Class names for image size, cell padding and text size based on view size
  const imageSizeClass =
    viewSize === "compact"
      ? "h-6 w-6"
      : viewSize === "large"
      ? "h-40 w-40"
      : "h-16 w-16";
  const cellPaddingClass =
    viewSize === "compact"
      ? "p-1"
      : viewSize === "large"
      ? "p-4"
      : "p-2";
  const textSizeClass =
    viewSize === "compact"
      ? "text-xs"
      : viewSize === "large"
      ? "text-lg"
      : "text-base";

// ... imports and component setup ...

  // Sort albums
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

  // Lowercase search once for efficiency
  const searchLower = search.toLowerCase();

  const filtered = sortedAlbums.filter((album) => {
    // Check title, artist and track titles
    const trackMatch =
      album.tracklist &&
      album.tracklist.some((t) => {
        const title = typeof t === "string" ? t : t.title;
        return title.toLowerCase().includes(searchLower);
      });

    let matchSearch;
    if (searchBy === "artist") {
      matchSearch = album.artist.toLowerCase().includes(searchLower) || trackMatch;
    } else if (searchBy === "title") {
      matchSearch = album.title.toLowerCase().includes(searchLower) || trackMatch;
    } else {
      matchSearch =
        album.title.toLowerCase().includes(searchLower) ||
        album.artist.toLowerCase().includes(searchLower) ||
        trackMatch;
    }

    const matchGenre = genre === "" || album.genre === genre;
    return matchSearch && matchGenre;
  });

  // ... render the rest of your ListView ...


  // Unique genre list
  const genres = [...new Set(albums.map((a) => a.genre).filter(Boolean))];

  // Bin marking logic remains unchanged
  const applyBinMarking = () => {
    const updated = [...albums];
    const sorted = [...updated].sort(
      (a, b) => a.artist.localeCompare(b.artist) || a.title.localeCompare(b.title)
    );
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

  const resetBinMarkings = () => {
    const resetAlbums = albums.map((album) => ({ ...album, bin: undefined }));
    setAlbums(resetAlbums);
    setEndOfBinIds([]);
    alert("All bin markings have been reset.");
  };

  const toggleEndOfBin = (id) => {
    setEndOfBinIds((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  return (
    <div
      className={`min-h-screen p-4 ${
        isDark ? "bg-gray-900 text-white" : "bg-gray-100 text-black"
      }`}
    >
      {/* Search, search-by, genre filter and dark mode toggle */}
      <div className="flex flex-wrap gap-2 justify-between items-center mb-4">
        {/* Search input */}
        <input
          className="border rounded px-2 py-1 text-black w-full sm:w-auto"
          placeholder="Search albums..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Search by: title, artist or both */}
        <select
          className="border rounded px-2 py-1 text-black"
          value={searchBy}
          onChange={(e) => setSearchBy(e.target.value)}
        >
          <option value="title">Title</option>
          <option value="artist">Artist</option>
          <option value="both">Both</option>
        </select>

        {/* Genre filter */}
        <select
          className="border rounded px-2 py-1 text-black"
          value={genre}
          onChange={(e) => setGenre(e.target.value)}
        >
          <option value="">All Genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        {/* Dark mode toggle */}
        <button
          className="border rounded px-2 py-1"
          onClick={() => setIsDark(!isDark)}
        >
          Toggle {isDark ? "Light" : "Dark"} Mode
        </button>
      </div>

      {/* View size selector and bin controls */}
      <div className="flex flex-wrap gap-2 items-center mb-4">
        <label htmlFor="viewSize" className="sr-only">
          View size
        </label>
        <select
          id="viewSize"
          className="border rounded px-2 py-1 text-black"
          value={viewSize}
          onChange={(e) => setViewSize(e.target.value)}
        >
          <option value="compact">Compact</option>
          <option value="comfortable">Comfortable</option>
          <option value="large">Large</option>
        </select>

        {/* Bin marking controls */}
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
        <button
          className="border rounded px-2 py-1 bg-red-500 text-white"
          onClick={resetBinMarkings}
        >
          Reset Bins
        </button>
        <span>Click a row to toggle End of Bin marker</span>
      </div>

      {/* Table displaying the albums */}
      <table className="w-full table-auto border-collapse">
        <thead>
          <tr className="bg-gray-700 text-left">
            <th className="p-2">Cover</th>
            <th className="p-2 cursor-pointer" onClick={() => handleSort("title")}>
              Title
            </th>
            <th className="p-2 cursor-pointer" onClick={() => handleSort("artist")}>
              Artist
            </th>
            <th className="p-2 cursor-pointer" onClick={() => handleSort("year")}>
              Year
            </th>
            <th className="p-2">Genre</th>
            <th className="p-2">Label</th>
            <th className="p-2">Bin</th>
            <th className="p-2">Link</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map((album) => {
            const rowClasses = `border-t border-gray-600 hover:bg-gray-800 cursor-pointer ${
              endOfBinIds.includes(album.id) ? "bg-red-400" : ""
            }`;
            return (
              <tr
                key={album.id}
                className={rowClasses}
                onClick={() => toggleEndOfBin(album.id)}
              >
                <td className={cellPaddingClass}>
                  <img
                    src={album.thumb || album.cover_image}
                    alt={album.title}
                    className={`${imageSizeClass} object-cover rounded`}
                  />
                </td>
                <td className={`${cellPaddingClass} ${textSizeClass}`}>
                  {album.title}
                </td>
                <td className={`${cellPaddingClass} ${textSizeClass}`}>
                  {album.artist}
                </td>
                <td className={`${cellPaddingClass} ${textSizeClass}`}>
                  {album.year}
                </td>
                <td className={`${cellPaddingClass} ${textSizeClass}`}>
                  {album.genre}
                </td>
                <td className={`${cellPaddingClass} ${textSizeClass}`}>
                  {album.label}
                </td>
                <td className={`${cellPaddingClass} ${textSizeClass}`}>
                  {album.bin || ""}
                </td>
                <td className={cellPaddingClass}>
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
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
