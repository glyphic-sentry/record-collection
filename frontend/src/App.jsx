// frontend/src/App.jsx
import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import GalleryView from "./views/GalleryView.jsx";
import ListView from "./views/ListView.jsx";

/**
 * Minimal error boundary to prevent white-screen on render-time exceptions.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    // Log to console so we see the real, unminified error and component stack
    console.error("Render error:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 16, color: "crimson" }}>
          <h2>Something went wrong.</h2>
          <p>Check the browser console for details.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const API_BASE = import.meta.env?.VITE_API_BASE ?? ""; // e.g. http://localhost:5000

export default function App() {
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
