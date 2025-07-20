import React, { useState, useEffect } from "react";

export default function SearchFilterBar({ onFilter }) {
  const [term, setTerm] = useState("");
  const [year, setYear] = useState("");
  const [genre, setGenre] = useState("");

  useEffect(() => {
    const delay = setTimeout(() => {
      onFilter({ term, year, genre });
    }, 300);
    return () => clearTimeout(delay);
  }, [term, year, genre]);

  return (
    <div className="flex gap-2 mb-4 items-center flex-wrap">
      <input
        type="text"
        placeholder="Search title/artist"
        className="p-1 text-black"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      <input
        type="number"
        placeholder="Year"
        className="p-1 text-black w-24"
        value={year}
        onChange={(e) => setYear(e.target.value)}
      />
      <input
        type="text"
        placeholder="Genre"
        className="p-1 text-black"
        value={genre}
        onChange={(e) => setGenre(e.target.value)}
      />
    </div>
  );
}
