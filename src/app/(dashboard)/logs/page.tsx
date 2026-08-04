"use client";

import { useState, useEffect, useRef } from "react";

interface LogEntry {
  timestamp: string;
  message: string;
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoScroll, setAutoScroll] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  async function fetchLogs() {
    try {
      const res = await fetch("/api/ts3/logs?lines=200");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLogs();
    const id = setInterval(fetchLogs, 10000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (autoScroll && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  function getLogColor(msg: string): string {
    if (/error|fail/i.test(msg)) return "text-danger";
    if (/warn/i.test(msg)) return "text-warning";
    if (/connect|login/i.test(msg)) return "text-success";
    if (/disconnect|logout/i.test(msg)) return "text-text-muted";
    return "text-text-secondary";
  }

  return (
    <div className="flex h-full flex-col space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Logs del servidor</h1>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-text-muted">
            <input
              type="checkbox"
              checked={autoScroll}
              onChange={(e) => setAutoScroll(e.target.checked)}
              className="rounded"
            />
            Auto-scroll
          </label>
          <button
            onClick={fetchLogs}
            className="rounded-lg bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent transition hover:bg-accent/25"
          >
            Refrescar
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </div>
      )}

      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto rounded-xl border border-border bg-bg-card font-mono text-xs"
        style={{ minHeight: "400px", maxHeight: "calc(100vh - 200px)" }}
      >
        {loading ? (
          <div className="flex h-64 items-center justify-center text-text-muted">
            Cargando logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="flex h-64 items-center justify-center text-text-muted">
            No hay logs disponibles
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {logs.map((log, i) => (
              <div
                key={i}
                className={`px-4 py-1.5 hover:bg-bg-hover ${getLogColor(log.message)}`}
              >
                {log.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
