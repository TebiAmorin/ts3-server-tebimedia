"use client";

import { useState, useEffect, useCallback } from "react";
import type { BanEntry } from "@/lib/ts3/types";

export default function BansPage() {
  const [bans, setBans] = useState<BanEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const fetchBans = useCallback(async () => {
    try {
      const res = await fetch("/api/ts3/bans");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBans(data.bans || []);
    } catch {
      // empty list on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBans();
  }, [fetchBans]);

  async function removeBan(banId: string) {
    if (!confirm("¿Eliminar este ban?")) return;
    const res = await fetch("/api/ts3/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "unban", banId }),
    });
    const data = await res.json();
    setFeedback(data.success ? "Ban eliminado" : data.message);
    setTimeout(() => setFeedback(null), 3000);
    fetchBans();
  }

  function formatDate(ts: number): string {
    if (!ts) return "-";
    return new Date(ts * 1000).toLocaleString("es-ES");
  }

  function formatDuration(seconds: number): string {
    if (!seconds) return "Permanente";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Lista de bans</h1>
        <button
          onClick={fetchBans}
          className="rounded-lg bg-accent/15 px-3 py-1.5 text-sm font-medium text-accent transition hover:bg-accent/25"
        >
          Refrescar
        </button>
      </div>

      {feedback && (
        <div className="rounded-lg bg-bg-card px-4 py-2 text-sm text-text-secondary">
          {feedback}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-text-muted">
              <th className="px-5 py-3">Nombre/UID</th>
              <th className="px-5 py-3">IP</th>
              <th className="px-5 py-3">Razón</th>
              <th className="px-5 py-3">Baneado por</th>
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3">Duración</th>
              <th className="px-5 py-3 text-right">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-text-muted">
                  Cargando...
                </td>
              </tr>
            ) : bans.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-text-muted">
                  No hay bans activos
                </td>
              </tr>
            ) : (
              bans.map((ban) => (
                <tr key={ban.banId} className="hover:bg-bg-hover">
                  <td className="px-5 py-3 text-text-primary">
                    {ban.name || ban.uid || "-"}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-text-muted">
                    {ban.ip || "-"}
                  </td>
                  <td className="px-5 py-3 text-text-secondary">
                    {ban.reason || "-"}
                  </td>
                  <td className="px-5 py-3 text-text-muted">
                    {ban.invokerName || "-"}
                  </td>
                  <td className="px-5 py-3 text-text-muted">
                    {formatDate(ban.created)}
                  </td>
                  <td className="px-5 py-3 text-text-muted">
                    {formatDuration(ban.duration)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      onClick={() => removeBan(ban.banId)}
                      className="rounded-md px-2.5 py-1 text-xs font-medium text-danger transition hover:bg-danger/10"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
