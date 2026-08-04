"use client";

import { useServerStatus } from "@/hooks/use-server-status";
import { useState } from "react";

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function DashboardPage() {
  const { server, clients, error, loading, refresh } = useServerStatus();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  async function serverAction(action: string) {
    if (!confirm(`¿Seguro que quieres ${action} el servidor?`)) return;
    setActionLoading(action);
    setActionMsg(null);
    try {
      const res = await fetch("/api/ts3/server", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      setActionMsg(data.success ? `Servidor: ${action} OK` : data.message || data.error);
      setTimeout(refresh, 3000);
    } catch (err) {
      setActionMsg(String(err));
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-text-muted">
        Conectando con el servidor TS3...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/10 p-6">
        <h2 className="mb-2 text-lg font-semibold text-danger">Error de conexión</h2>
        <p className="text-sm text-text-secondary">{error}</p>
        <button
          onClick={refresh}
          className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-sm text-text-muted">
            {server?.name || "Servidor TS3"}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => serverAction("restart")}
            disabled={actionLoading !== null}
            className="rounded-lg border border-warning/50 px-4 py-2 text-sm font-medium text-warning transition hover:bg-warning/10 disabled:opacity-50"
          >
            {actionLoading === "restart" ? "Reiniciando..." : "Reiniciar"}
          </button>
          <button
            onClick={() => serverAction("stop")}
            disabled={actionLoading !== null}
            className="rounded-lg border border-danger/50 px-4 py-2 text-sm font-medium text-danger transition hover:bg-danger/10 disabled:opacity-50"
          >
            {actionLoading === "stop" ? "Parando..." : "Detener"}
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="rounded-lg bg-bg-card px-4 py-3 text-sm text-text-secondary">
          {actionMsg}
        </div>
      )}

      {/* Stats cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Estado"
          value={server ? "Online" : "Offline"}
          color={server ? "text-success" : "text-danger"}
        />
        <StatCard
          label="Usuarios"
          value={`${server?.onlineClients ?? 0} / ${server?.maxClients ?? 0}`}
        />
        <StatCard
          label="Canales"
          value={String(server?.channelsOnline ?? 0)}
        />
        <StatCard
          label="Uptime"
          value={server ? formatUptime(server.uptime) : "-"}
        />
      </div>

      {/* Connected users quick view */}
      <div className="rounded-xl border border-border bg-bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold text-text-primary">
            Usuarios conectados ({clients.length})
          </h2>
          <button
            onClick={refresh}
            className="text-xs text-text-muted transition hover:text-accent"
          >
            Actualizar
          </button>
        </div>

        {clients.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-text-muted">
            No hay usuarios conectados
          </div>
        ) : (
          <div className="divide-y divide-border">
            {clients.map((client) => (
              <div
                key={client.clid}
                className="flex items-center justify-between px-5 py-3"
              >
                <div>
                  <span className="text-sm font-medium text-text-primary">
                    {client.nickname}
                  </span>
                  <span className="ml-3 text-xs text-text-muted">
                    {client.channelName}
                  </span>
                </div>
                <div className="flex gap-1">
                  <QuickAction
                    label="Kick"
                    className="text-warning hover:bg-warning/10"
                    onClick={async () => {
                      if (!confirm(`¿Kick a ${client.nickname}?`)) return;
                      await fetch("/api/ts3/actions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "kick",
                          clid: client.clid,
                          reason: "Kicked from panel",
                        }),
                      });
                      refresh();
                    }}
                  />
                  <QuickAction
                    label="Ban"
                    className="text-danger hover:bg-danger/10"
                    onClick={async () => {
                      if (!confirm(`¿Ban permanente a ${client.nickname}?`)) return;
                      await fetch("/api/ts3/actions", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "ban",
                          clid: client.clid,
                          reason: "Banned from panel",
                        }),
                      });
                      refresh();
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  color = "text-text-primary",
}: {
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-card px-5 py-4">
      <p className="text-xs font-medium uppercase tracking-wider text-text-muted">
        {label}
      </p>
      <p className={`mt-1 text-2xl font-bold ${color}`}>{value}</p>
    </div>
  );
}

function QuickAction({
  label,
  className,
  onClick,
}: {
  label: string;
  className: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${className}`}
    >
      {label}
    </button>
  );
}
