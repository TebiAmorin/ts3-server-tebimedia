"use client";

import { useState, useEffect, useCallback } from "react";
import type { ServerGroup, GroupPermission } from "@/lib/ts3/types";

export default function GroupsPage() {
  const [groups, setGroups] = useState<ServerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<ServerGroup | null>(null);
  const [perms, setPerms] = useState<GroupPermission[]>([]);
  const [permsLoading, setPermsLoading] = useState(false);

  const [newPermName, setNewPermName] = useState("");
  const [newPermValue, setNewPermValue] = useState("75");
  const [newPermSkip, setNewPermSkip] = useState(false);
  const [newPermNegated, setNewPermNegated] = useState(false);

  const showFeedback = useCallback((msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3000);
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
    showFeedback(data.success ? `Grupo "${newGroupName}" creado` : data.message);
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
    showFeedback(data.success ? `Grupo "${name}" eliminado` : data.message);
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
    showFeedback(data.success ? `Permiso "${newPermName}" añadido` : data.message);
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
    showFeedback(data.success ? `Permiso "${permname}" eliminado` : data.message);
    fetchPerms(selectedGroup.sgid);
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Gestión de Grupos</h1>

      {feedback && (
        <div className="rounded-lg bg-bg-card px-4 py-2 text-sm text-text-secondary">
          {feedback}
        </div>
      )}

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
              {/* Add permission form */}
              <div className="border-b border-border px-5 py-3">
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPermName}
                      onChange={(e) => setNewPermName(e.target.value)}
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

              {/* Permission list */}
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
