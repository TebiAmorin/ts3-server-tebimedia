"use client";

import { useServerStatus } from "@/hooks/use-server-status";
import { useState, useEffect, useCallback } from "react";
import type { ServerGroup } from "@/lib/ts3/types";

function formatDuration(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

interface GroupModalProps {
  nickname: string;
  cldbid: string;
  allGroups: ServerGroup[];
  onClose: () => void;
  onUpdated: () => void;
}

function GroupModal({ nickname, cldbid, allGroups, onClose, onUpdated }: GroupModalProps) {
  const [clientGroups, setClientGroups] = useState<ServerGroup[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchClientGroups = useCallback(async () => {
    try {
      const res = await fetch(`/api/ts3/groups/assign?cldbid=${cldbid}`);
      const data = await res.json();
      if (data.groups) setClientGroups(data.groups);
    } catch { /* ignore */ }
    setLoading(false);
  }, [cldbid]);

  useEffect(() => {
    fetchClientGroups();
  }, [fetchClientGroups]);

  async function addGroup(sgid: string) {
    await fetch("/api/ts3/groups/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sgid, cldbid }),
    });
    fetchClientGroups();
    onUpdated();
  }

  async function removeGroup(sgid: string) {
    await fetch("/api/ts3/groups/assign", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sgid, cldbid }),
    });
    fetchClientGroups();
    onUpdated();
  }

  const clientSgids = new Set(clientGroups.map((g) => g.sgid));
  const availableGroups = allGroups.filter((g) => !clientSgids.has(g.sgid));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-xl border border-border bg-bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <h3 className="text-sm font-semibold text-text-primary">
            Grupos de {nickname}
          </h3>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary">
            ✕
          </button>
        </div>

        {loading ? (
          <div className="px-5 py-8 text-center text-text-muted">Cargando...</div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {clientGroups.length > 0 && (
              <div className="border-b border-border px-5 py-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Grupos actuales
                </span>
              </div>
            )}
            {clientGroups.map((g) => (
              <div
                key={g.sgid}
                className="flex items-center justify-between px-5 py-2 hover:bg-bg-hover"
              >
                <span className="text-sm text-text-primary">{g.name}</span>
                <button
                  onClick={() => removeGroup(g.sgid)}
                  className="rounded-md px-2 py-1 text-xs text-danger transition hover:bg-danger/10"
                >
                  Quitar
                </button>
              </div>
            ))}

            {availableGroups.length > 0 && (
              <div className="border-b border-t border-border px-5 py-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Añadir grupo
                </span>
              </div>
            )}
            {availableGroups.map((g) => (
              <div
                key={g.sgid}
                className="flex items-center justify-between px-5 py-2 hover:bg-bg-hover"
              >
                <span className="text-sm text-text-secondary">{g.name}</span>
                <button
                  onClick={() => addGroup(g.sgid)}
                  className="rounded-md px-2 py-1 text-xs text-success transition hover:bg-success/10"
                >
                  Añadir
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { clients, channels, loading, error, refresh } = useServerStatus();
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [allGroups, setAllGroups] = useState<ServerGroup[]>([]);
  const [groupModal, setGroupModal] = useState<{ nickname: string; cldbid: string } | null>(null);

  useEffect(() => {
    fetch("/api/ts3/groups")
      .then((r) => r.json())
      .then((d) => { if (d.groups) setAllGroups(d.groups); })
      .catch(() => {});
  }, []);

  async function doAction(
    action: string,
    clid: string,
    nickname: string,
    extra: Record<string, unknown> = {}
  ) {
    const confirmMsg =
      action === "kick"
        ? `¿Kick a ${nickname}?`
        : action === "ban"
          ? `¿Ban permanente a ${nickname}?`
          : `¿${action} a ${nickname}?`;
    if (!confirm(confirmMsg)) return;

    const res = await fetch("/api/ts3/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, clid, reason: `${action} from panel`, ...extra }),
    });
    const data = await res.json();
    setActionFeedback(
      data.success ? `${action} aplicado a ${nickname}` : data.message
    );
    setTimeout(() => setActionFeedback(null), 3000);
    refresh();
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-text-muted">
        Cargando...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-danger/30 bg-danger/10 p-6 text-sm text-danger">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Usuarios conectados</h1>
        <span className="rounded-full bg-accent/15 px-3 py-1 text-sm font-semibold text-accent">
          {clients.length} online
        </span>
      </div>

      {actionFeedback && (
        <div className="rounded-lg bg-bg-card px-4 py-2 text-sm text-text-secondary">
          {actionFeedback}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-border bg-bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wider text-text-muted">
              <th className="px-5 py-3">Nickname</th>
              <th className="px-5 py-3">Canal</th>
              <th className="px-5 py-3">Plataforma</th>
              <th className="px-5 py-3">País</th>
              <th className="px-5 py-3">Conectado</th>
              <th className="px-5 py-3">Idle</th>
              <th className="px-5 py-3 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-text-muted">
                  No hay usuarios conectados
                </td>
              </tr>
            ) : (
              clients.map((client) => {
                const channel = channels.find((c) => c.cid === client.channelId);
                return (
                  <tr key={client.clid} className="hover:bg-bg-hover">
                    <td className="px-5 py-3 font-medium text-text-primary">
                      {client.nickname}
                    </td>
                    <td className="px-5 py-3 text-text-secondary">
                      {channel?.name || client.channelName || "-"}
                    </td>
                    <td className="px-5 py-3 text-text-muted">
                      {client.platform || "-"}
                    </td>
                    <td className="px-5 py-3 text-text-muted">
                      {client.country || "-"}
                    </td>
                    <td className="px-5 py-3 text-text-muted">
                      {formatDuration(client.connectionTime * 1000)}
                    </td>
                    <td className="px-5 py-3 text-text-muted">
                      {formatDuration(client.idleTime)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() =>
                            setGroupModal({ nickname: client.nickname, cldbid: client.databaseId })
                          }
                          className="rounded-md px-2.5 py-1 text-xs font-medium text-accent transition hover:bg-accent/10"
                        >
                          Grupos
                        </button>
                        <button
                          onClick={() => doAction("kick", client.clid, client.nickname)}
                          className="rounded-md px-2.5 py-1 text-xs font-medium text-warning transition hover:bg-warning/10"
                        >
                          Kick
                        </button>
                        <button
                          onClick={() => doAction("ban", client.clid, client.nickname)}
                          className="rounded-md px-2.5 py-1 text-xs font-medium text-danger transition hover:bg-danger/10"
                        >
                          Ban
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {groupModal && (
        <GroupModal
          nickname={groupModal.nickname}
          cldbid={groupModal.cldbid}
          allGroups={allGroups}
          onClose={() => setGroupModal(null)}
          onUpdated={refresh}
        />
      )}
    </div>
  );
}
