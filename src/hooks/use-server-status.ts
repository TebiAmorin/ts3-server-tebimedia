"use client";

import { useState, useEffect, useCallback } from "react";
import type { ServerStatus, ConnectedClient, Channel } from "@/lib/ts3/types";

interface DashboardData {
  server: ServerStatus | null;
  clients: ConnectedClient[];
  channels: Channel[];
  timestamp: number;
  error: string | null;
  loading: boolean;
  refresh: () => void;
}

export function useServerStatus(intervalMs = 5000): DashboardData {
  const [server, setServer] = useState<ServerStatus | null>(null);
  const [clients, setClients] = useState<ConnectedClient[]>([]);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [timestamp, setTimestamp] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/ts3/status");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setServer(data.server);
      setClients(data.clients);
      setChannels(data.channels);
      setTimestamp(data.timestamp);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, intervalMs);
    return () => clearInterval(id);
  }, [fetchData, intervalMs]);

  return { server, clients, channels, timestamp, error, loading, refresh: fetchData };
}
