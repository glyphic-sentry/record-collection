import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
} from "recharts";

export default function ReportView() {
  const [albums, setAlbums] = useState([]);
  const [isDark, setIsDark] = useState(true);
  const [genreFilter, setGenreFilter] = useState("");
  const [labelFilter, setLabelFilter] = useState("");

  useEffect(() => {
    fetch("/api/collection")
      .then((res) => res.json())
      .then((data) => setAlbums(data))
      .catch((err) => console.error("Error fetching collection:", err));
  }, []);

  const filteredAlbums = albums.filter((album) => {
    const genreMatch = genreFilter === "" || album.genre === genreFilter;
    const labelMatch = labelFilter === "" || album.label === labelFilter;
    return genreMatch && labelMatch;
  });

  const genreCounts = filteredAlbums.reduce((acc, album) => {
    acc[album.genre] = (acc[album.genre] || 0) + 1;
    return acc;
  }, {});

  const labelCounts = filteredAlbums.reduce((acc, album) => {
    acc[album.label] = (acc[album.label] || 0) + 1;
    return acc;
  }, {});

  const decadeCounts = filteredAlbums.reduce((acc, album) => {
    const decade = album.year ? `${Math.floor(album.year / 10) * 10}s` : "Unknown";
    acc[decade] = (acc[decade] || 0) + 1;
    return acc;
  }, {});

  const growthData = filteredAlbums.reduce((acc, album) => {
    const date = album.date_added?.slice(0, 10);
    if (date) {
      if (!acc.find((d) => d.date === date)) {
        acc.push({ date, count: 1 });
      } else {
        acc.find((d) => d.date === date).count++;
      }
    }
    return acc.sort((a, b) => new Date(a.date) - new Date(b.date));
  }, []);

  const genres = [...new Set(albums.map((a) => a.genre).filter(Boolean))];
  const labels = [...new Set(albums.map((a) => a.label).filter(Boolean))];

  return (
    <div className={`min-h-screen p-4 ${isDark ? "bg-gray-900 text-white" : "bg-gray-100 text-black"}`}>
      <div className="flex flex-wrap gap-2 mb-6">
        <select
          className="border rounded px-2 py-1 text-black"
          value={genreFilter}
          onChange={(e) => setGenreFilter(e.target.value)}
        >
          <option value="">All Genres</option>
          {genres.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>

        <select
          className="border rounded px-2 py-1 text-black"
          value={labelFilter}
          onChange={(e) => setLabelFilter(e.target.value)}
        >
          <option value="">All Labels</option>
          {labels.map((l) => (
            <option key={l} value={l}>{l}</option>
          ))}
        </select>

        <button
          className="border rounded px-2 py-1"
          onClick={() => setIsDark(!isDark)}
        >
          Toggle {isDark ? "Light" : "Dark"} Mode
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-xl font-bold mb-2">By Genre</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(genreCounts).map(([name, value]) => ({ name, value }))}>
              <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2">By Label</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(labelCounts).map(([name, value]) => ({ name, value }))}>
              <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2">By Decade</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(decadeCounts).map(([name, value]) => ({ name, value }))}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h2 className="text-xl font-bold mb-2">Collection Growth Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData}>
              <XAxis dataKey="date" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
