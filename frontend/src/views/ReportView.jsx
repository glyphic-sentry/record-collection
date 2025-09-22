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
  Brush,
} from "recharts";

/*
 * ReportView renders a set of charts summarising the user's record
 * collection.  The original page included a bar chart labelled
 * "By Label" that duplicated the genre chart but grouped by label.  To
 * declutter the report, this graph has been removed.  To make the
 * remaining charts more interactive, a `Brush` component has been
 * added to each chart.  The brush allows the user to zoom into a
 * subset of the data and scroll through it by dragging the handles.
 */

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

  // Apply genre and label filters to the album list
  const filteredAlbums = albums.filter((album) => {
    const genreMatch = genreFilter === "" || album.genre === genreFilter;
    const labelMatch = labelFilter === "" || album.label === labelFilter;
    return genreMatch && labelMatch;
  });

  // Compute counts grouped by genre and decade
  const genreCounts = filteredAlbums.reduce((acc, album) => {
    acc[album.genre] = (acc[album.genre] || 0) + 1;
    return acc;
  }, {});

  const decadeCounts = filteredAlbums.reduce((acc, album) => {
    const decade = album.year ? `${Math.floor(album.year / 10) * 10}s` : "Unknown";
    acc[decade] = (acc[decade] || 0) + 1;
    return acc;
  }, {});

  // Build a time series of album additions for the growth chart
  const growthData = filteredAlbums.reduce((acc, album) => {
    const date = album.date_added?.slice(0, 10);
    if (date) {
      const existing = acc.find((d) => d.date === date);
      if (!existing) {
        acc.push({ date, count: 1 });
      } else {
        existing.count++;
      }
    }
    // Sort chronologically so the line chart is ordered correctly
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
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>

        <select
          className="border rounded px-2 py-1 text-black"
          value={labelFilter}
          onChange={(e) => setLabelFilter(e.target.value)}
        >
          <option value="">All Labels</option>
          {labels.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>

        <button className="border rounded px-2 py-1" onClick={() => setIsDark(!isDark)}>
          Toggle {isDark ? "Light" : "Dark"} Mode
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* By Genre Chart */}
        <div>
          <h2 className="text-xl font-bold mb-2">By Genre</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(genreCounts).map(([name, value]) => ({ name, value }))}>
              <XAxis dataKey="name" interval={0} angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <CartesianGrid strokeDasharray="3 3" />
              <Bar dataKey="value" fill="#8884d8" />
              {/* Brush provides zoom and scroll for the bar chart */}
              <Brush dataKey="name" height={30} stroke="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* By Decade Chart */}
        <div>
          <h2 className="text-xl font-bold mb-2">By Decade</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={Object.entries(decadeCounts).map(([name, value]) => ({ name, value }))}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <CartesianGrid strokeDasharray="3 3" />
              <Bar dataKey="value" fill="#ffc658" />
              <Brush dataKey="name" height={30} stroke="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Collection Growth Over Time Chart */}
        <div className="md:col-span-2">
          <h2 className="text-xl font-bold mb-2">Collection Growth Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={growthData}>
              <XAxis dataKey="date" />
              <YAxis />
              <CartesianGrid strokeDasharray="3 3" />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="count" stroke="#8884d8" />
              <Brush dataKey="date" height={30} stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
