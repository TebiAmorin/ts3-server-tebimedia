"use client";

import { useState, useEffect, useCallback } from "react";
import type { ServerGroup, GroupPermission } from "@/lib/ts3/types";

interface DbClient {
  cldbid: string;
  nickname: string;
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<ServerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<ServerGroup | null>(null);
  const [perms, setPerms] = useState<GroupPermission[]>([]);
  const [permsLoading, setPermsLoading] = useState(false);

  const [newPermName, setNewPermName] = useState("");
  const [newPermValue, setNewPermValue] = useState("75");
  const [newPermSkip, setNewPermSkip] = useState(false);
  const [newPermNegated, setNewPermNegated] = useState(false);

  const [searchNick, setSearchNick] = useState("");
  const [searchResults, setSearchResults] = useState<DbClient[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<DbClient | null>(null);
  const [clientGroups, setClientGroups] = useState<ServerGroup[]>([]);

  const showFeedback = useCallback((msg: string, type: "ok" | "err" = "ok") => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  }, []);

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch("/api/ts3/groups");
      const data = await res.json();
      if (data.groups) setGroups(data.groups);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const fetchPerms = useCallback(async (sgid: string) => {
    setPermsLoading(true);
    try {
      const res = await fetch(`/api/ts3/groups/perms?sgid=${sgid}`);
      const data = await res.json();
      if (data.permissions) setPerms(data.permissions);
    } catch {
      setPerms([]);
    } finally {
      setPermsLoading(false);
    }
  }, []);

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return;
    const res = await fetch("/api/ts3/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newGroupName.trim() }),
    });
    const data = await res.json();
    showFeedback(
      data.success ? `Grupo "${newGroupName}" creado (sgid: ${data.sgid})` : `Error: ${data.message || data.error}`,
      data.success ? "ok" : "err"
    );
    setNewGroupName("");
    fetchGroups();
  }

  async function handleDeleteGroup(sgid: string, name: string) {
    if (!confirm(`¿Eliminar grupo "${name}" (sgid: ${sgid})?`)) return;
    const res = await fetch("/api/ts3/groups", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sgid }),
    });
    const data = await res.json();
    showFeedback(
      data.success ? `Grupo "${name}" eliminado` : `Error: ${data.message || data.error}`,
      data.success ? "ok" : "err"
    );
    if (selectedGroup?.sgid === sgid) {
      setSelectedGroup(null);
      setPerms([]);
    }
    fetchGroups();
  }

  function handleSelectGroup(group: ServerGroup) {
    setSelectedGroup(group);
    fetchPerms(group.sgid);
  }

  async function handleAddPerm() {
    if (!selectedGroup || !newPermName.trim()) return;
    const res = await fetch("/api/ts3/groups/perms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sgid: selectedGroup.sgid,
        permname: newPermName.trim(),
        permvalue: Number(newPermValue),
        permnegated: newPermNegated,
        permskip: newPermSkip,
      }),
    });
    const data = await res.json();
    showFeedback(
      data.success ? `Permiso "${newPermName}" añadido` : `Error: ${data.message || data.error}`,
      data.success ? "ok" : "err"
    );
    setNewPermName("");
    setNewPermValue("75");
    setNewPermSkip(false);
    setNewPermNegated(false);
    fetchPerms(selectedGroup.sgid);
  }

  async function handleRemovePerm(permname: string) {
    if (!selectedGroup) return;
    const res = await fetch("/api/ts3/groups/perms", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sgid: selectedGroup.sgid, permname }),
    });
    const data = await res.json();
    showFeedback(
      data.success ? `Permiso "${permname}" eliminado` : `Error: ${data.message || data.error}`,
      data.success ? "ok" : "err"
    );
    fetchPerms(selectedGroup.sgid);
  }

  async function handleSearchUser() {
    if (!searchNick.trim()) return;
    setSearchLoading(true);
    setSelectedClient(null);
    setClientGroups([]);
    try {
      const res = await fetch(`/api/ts3/groups/assign?search=${encodeURIComponent(searchNick.trim())}`);
      const data = await res.json();
      setSearchResults(data.results || []);
      if (!data.results?.length) {
        showFeedback(`No se encontró ningún usuario con "${searchNick}"`, "err");
      }
    } catch {
      showFeedback("Error buscando usuario", "err");
    } finally {
      setSearchLoading(false);
    }
  }

  async function handleSelectClient(client: DbClient) {
    setSelectedClient(client);
    try {
      const res = await fetch(`/api/ts3/groups/assign?cldbid=${client.cldbid}`);
      const data = await res.json();
      setClientGroups(data.groups || []);
    } catch {
      setClientGroups([]);
    }
  }

  async function handleAssignGroup(sgid: string, groupName: string) {
    if (!selectedClient) return;
    const res = await fetch("/api/ts3/groups/assign", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sgid, cldbid: selectedClient.cldbid }),
    });
    const data = await res.json();
    showFeedback(
      data.success
        ? `"${selectedClient.nickname}" añadido a "${groupName}"`
        : `Error: ${data.message || data.error}`,
      data.success ? "ok" : "err"
    );
    if (data.success) handleSelectClient(selectedClient);
  }

  async function handleRemoveFromGroup(sgid: string, groupName: string) {
    if (!selectedClient) return;
    const res = await fetch("/api/ts3/groups/assign", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sgid, cldbid: selectedClient.cldbid }),
    });
    const data = await res.json();
    showFeedback(
      data.success
        ? `"${selectedClient.nickname}" quitado de "${groupName}"`
        : `Error: ${data.message || data.error}`,
      data.success ? "ok" : "err"
    );
    if (data.success) handleSelectClient(selectedClient);
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

  const clientSgids = new Set(clientGroups.map((g) => g.sgid));
  const availableGroups = groups.filter((g) => !clientSgids.has(g.sgid));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestión de Grupos</h1>

      {feedback && (
        <div
          className={`rounded-lg px-4 py-2 text-sm ${
            feedback.type === "ok"
              ? "bg-success/10 text-success border border-success/30"
              : "bg-danger/10 text-danger border border-danger/30"
          }`}
        >
          {feedback.msg}
        </div>
      )}

      {/* Assign user to group */}
      <div className="rounded-xl border border-border bg-bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
            Asignar grupo a usuario
          </h2>
        </div>
        <div className="p-5 space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchNick}
              onChange={(e) => setSearchNick(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchUser()}
              placeholder="Buscar por nickname (ej: Tebii)..."
              className="flex-1 rounded-lg border border-border bg-bg-secondary px-4 py-2 text-sm text-text-primary outline-none focus:border-accent"
            />
            <button
              onClick={handleSearchUser}
              disabled={searchLoading}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent/80 disabled:opacity-50"
            >
              {searchLoading ? "Buscando..." : "Buscar"}
            </button>
          </div>

          {searchResults.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {searchResults.map((c) => (
                <button
                  key={c.cldbid}
                  onClick={() => handleSelectClient(c)}
                  className={`rounded-lg px-3 py-1.5 text-sm transition ${
                    selectedClient?.cldbid === c.cldbid
                      ? "bg-accent text-white"
                      : "bg-bg-secondary text-text-secondary hover:bg-bg-hover"
                  }`}
                >
                  {c.nickname} <span className="text-xs opacity-70">#{c.cldbid}</span>
                </button>
              ))}
            </div>
          )}

          {selectedClient && (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Grupos actuales de {selectedClient.nickname}
                </span>
                <div className="mt-1 divide-y divide-border rounded-lg border border-border">
                  {clientGroups.length === 0 ? (
                    <div className="px-3 py-2 text-sm text-text-muted">Sin grupos</div>
                  ) : (
                    clientGroups.map((g) => (
                      <div key={g.sgid} className="flex items-center justify-between px-3 py-2">
                        <span className="text-sm text-text-primary">{g.name}</span>
                        <button
                          onClick={() => handleRemoveFromGroup(g.sgid, g.name)}
                          className="rounded px-2 py-0.5 text-xs text-danger hover:bg-danger/10"
                        >
                          Quitar
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                  Añadir a grupo
                </span>
                <div className="mt-1 max-h-48 divide-y divide-border overflow-y-auto rounded-lg border border-border">
                  {availableGroups.map((g) => (
                    <div key={g.sgid} className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm text-text-secondary">{g.name}</span>
                      <button
                        onClick={() => handleAssignGroup(g.sgid, g.name)}
                        className="rounded px-2 py-0.5 text-xs text-success hover:bg-success/10"
                      >
                        Añadir
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create group */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreateGroup()}
          placeholder="Nombre del nuevo grupo..."
          className="flex-1 rounded-lg border border-border bg-bg-secondary px-4 py-2 text-sm text-text-primary outline-none focus:border-accent"
        />
        <button
          onClick={handleCreateGroup}
          className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent/80"
        >
          Crear Grupo
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Groups list */}
        <div className="rounded-xl border border-border bg-bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
              Grupos del servidor
            </h2>
          </div>
          <div className="divide-y divide-border">
            {groups.length === 0 ? (
              <div className="px-5 py-8 text-center text-text-muted">
                No hay grupos
              </div>
            ) : (
              groups.map((g) => (
                <div
                  key={g.sgid}
                  className={`flex cursor-pointer items-center justify-between px-5 py-3 transition hover:bg-bg-hover ${
                    selectedGroup?.sgid === g.sgid ? "bg-accent/10" : ""
                  }`}
                  onClick={() => handleSelectGroup(g)}
                >
                  <div>
                    <span className="font-medium text-text-primary">{g.name}</span>
                    <span className="ml-2 text-xs text-text-muted">sgid: {g.sgid}</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteGroup(g.sgid, g.name);
                    }}
                    className="rounded-md px-2 py-1 text-xs font-medium text-danger transition hover:bg-danger/10"
                  >
                    Eliminar
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Permissions panel */}
        <div className="rounded-xl border border-border bg-bg-card">
          <div className="border-b border-border px-5 py-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
              {selectedGroup
                ? `Permisos: ${selectedGroup.name}`
                : "Selecciona un grupo"}
            </h2>
          </div>

          {selectedGroup ? (
            <div>
              <div className="border-b border-border px-5 py-3">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPermName}
                      onChange={(e) => setNewPermName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddPerm()}
                      placeholder="i_group_member_add_power"
                      className="flex-1 rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent"
                    />
                    <input
                      type="number"
                      value={newPermValue}
                      onChange={(e) => setNewPermValue(e.target.value)}
                      className="w-20 rounded-lg border border-border bg-bg-secondary px-3 py-1.5 text-sm text-text-primary outline-none focus:border-accent"
                    />
                    <button
                      onClick={handleAddPerm}
                      className="rounded-lg bg-success px-3 py-1.5 text-sm font-medium text-white transition hover:bg-success/80"
                    >
                      Añadir
                    </button>
                  </div>
                  <div className="flex gap-4 text-xs text-text-muted">
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={newPermSkip}
                        onChange={(e) => setNewPermSkip(e.target.checked)}
                        className="rounded"
                      />
                      Skip
                    </label>
                    <label className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={newPermNegated}
                        onChange={(e) => setNewPermNegated(e.target.checked)}
                        className="rounded"
                      />
                      Negated
                    </label>
                  </div>
                </div>
              </div>

              {permsLoading ? (
                <div className="px-5 py-8 text-center text-text-muted">
                  Cargando permisos...
                </div>
              ) : perms.length === 0 ? (
                <div className="px-5 py-8 text-center text-text-muted">
                  Sin permisos configurados
                </div>
              ) : (
                <div className="max-h-96 divide-y divide-border overflow-y-auto">
                  {perms.map((p) => (
                    <div
                      key={p.permname}
                      className="flex items-center justify-between px-5 py-2 text-sm hover:bg-bg-hover"
                    >
                      <div className="flex flex-col">
                        <span className="font-mono text-text-primary">{p.permname}</span>
                        <div className="flex gap-3 text-xs text-text-muted">
                          <span>Valor: {p.permvalue}</span>
                          {p.permskip && <span className="text-warning">skip</span>}
                          {p.permnegated && <span className="text-danger">negated</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemovePerm(p.permname)}
                        className="rounded-md px-2 py-1 text-xs text-danger transition hover:bg-danger/10"
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="px-5 py-8 text-center text-text-muted">
              Haz clic en un grupo para ver sus permisos
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
