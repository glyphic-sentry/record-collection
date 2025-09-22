import React, { useState, useEffect } from 'react';

export default function SearchFilterBar({ onFilter }) {
  const [term, setTerm] = useState('');
  const [year, setYear] = useState('');
  const [genre, setGenre] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      onFilter({ term: term.trim(), year: year.trim(), genre: genre.trim() });
    }, 300);
    return () => clearTimeout(timer);
  }, [term, year, genre, onFilter]);

  return (
    <div className="flex gap-2">
      <input className="input" placeholder="Search…" value={term} onChange={(e) => setTerm(e.target.value)} />
      <input className="input" type="number" placeholder="Year" value={year} onChange={(e) => setYear(e.target.value)} />
      <input className="input" placeholder="Genre" value={genre} onChange={(e) => setGenre(e.target.value)} />
    </div>
  );
}
