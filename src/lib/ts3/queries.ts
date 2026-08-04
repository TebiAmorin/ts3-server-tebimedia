import { getTS3 } from "./client";
import type {
  ServerStatus,
  ConnectedClient,
  Channel,
  ServerLog,
  BanEntry,
  ServerGroup,
  GroupPermission,
  ActionResult,
} from "./types";

// ─── Server Status ────────────────────────────────────────────

export async function getServerStatus(): Promise<ServerStatus> {
  const ts = await getTS3();
  const info = await ts.serverInfo();

  return {
    name: String((info as Record<string, unknown>).virtualserverName ?? ""),
    platform: String((info as Record<string, unknown>).virtualserverPlatform ?? ""),
    version: String((info as Record<string, unknown>).virtualserverVersion ?? ""),
    onlineClients: Number((info as Record<string, unknown>).virtualserverClientsonline ?? 0) - 1,
    maxClients: Number((info as Record<string, unknown>).virtualserverMaxclients ?? 0),
    uptime: Number((info as Record<string, unknown>).virtualserverUptime ?? 0),
    channelsOnline: Number((info as Record<string, unknown>).virtualserverChannelsonline ?? 0),
    ping: 0,
  };
}

// ─── Clients ──────────────────────────────────────────────────

export async function getConnectedClients(): Promise<ConnectedClient[]> {
  const ts = await getTS3();
  const clients = await ts.clientList({ clientType: 0 });

  return clients.map((c) => ({
    clid: String(c.clid),
    databaseId: String(c.databaseId ?? ""),
    nickname: c.nickname,
    channelId: String(c.cid),
    channelName: "",
    connectionTime: 0,
    idleTime: c.idleTime ?? 0,
    ip: c.connectionClientIp ?? "",
    uniqueIdentifier: c.uniqueIdentifier ?? "",
    serverGroups: String(c.servergroups ?? "").split(","),
    country: c.country ?? "",
    platform: c.platform ?? "",
  }));
}

// ─── Channels ─────────────────────────────────────────────────

export async function getChannels(): Promise<Channel[]> {
  const ts = await getTS3();
  const channels = await ts.channelList();

  return channels.map((ch) => ({
    cid: String(ch.cid),
    name: ch.name,
    parentId: String(ch.pid),
    order: String(ch.order),
    totalClients: ch.totalClients ?? 0,
    neededSubscribePower: ch.neededSubscribePower ?? 0,
    codec: ch.codec ?? 4,
    codecQuality: ch.codecQuality ?? 10,
    permanent: ch.flagPermanent ?? false,
    semiPermanent: ch.flagSemiPermanent ?? false,
    default: ch.flagDefault ?? false,
  }));
}

// ─── Logs ─────────────────────────────────────────────────────

export async function getServerLogs(
  lines = 50,
  beginPos = 0
): Promise<ServerLog[]> {
  const ts = await getTS3();
  try {
    const logs = await ts.logView(undefined, lines, 1, beginPos);
    return logs.map((entry) => ({
      timestamp: String((entry as Record<string, unknown>).l ?? ""),
      level: 0,
      message: String((entry as Record<string, unknown>).l ?? ""),
    }));
  } catch {
    return [];
  }
}

// ─── Bans ─────────────────────────────────────────────────────

export async function getBanList(): Promise<BanEntry[]> {
  const ts = await getTS3();
  try {
    const bans = await ts.banList();
    return bans.map((b) => ({
      banId: String(b.banid),
      ip: b.ip ?? "",
      uid: b.uid ?? "",
      name: b.name ?? "",
      reason: b.reason ?? "",
      created: b.created ?? 0,
      duration: b.duration ?? 0,
      invokerName: b.invokername ?? "",
    }));
  } catch {
    return [];
  }
}

// ─── Client Actions ───────────────────────────────────────────

export async function kickClient(clid: string, reason: string): Promise<ActionResult> {
  const ts = await getTS3();
  try {
    await ts.clientKick(clid, 5, reason);
    return { success: true, message: `Kicked client ${clid}` };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export async function banClient(clid: string, reason: string, duration = 0): Promise<ActionResult> {
  const ts = await getTS3();
  try {
    const client = await ts.getClientById(clid);
    if (!client) return { success: false, message: "Client not found" };
    await ts.ban({ uid: client.uniqueIdentifier, banreason: reason, time: duration });
    return { success: true, message: `Banned client ${clid}` };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export async function unban(banId: string): Promise<ActionResult> {
  const ts = await getTS3();
  try {
    await ts.banDel(banId);
    return { success: true, message: `Removed ban ${banId}` };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export async function sendGlobalMessage(msg: string): Promise<ActionResult> {
  const ts = await getTS3();
  try {
    await ts.sendTextMessage("0", 3, msg);
    return { success: true, message: "Message sent" };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export async function moveClient(clid: string, channelId: string): Promise<ActionResult> {
  const ts = await getTS3();
  try {
    await ts.clientMove(clid, channelId);
    return { success: true, message: `Moved client ${clid}` };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

// ─── Server Control ───────────────────────────────────────────

export async function serverStop(): Promise<ActionResult> {
  const ts = await getTS3();
  try {
    const servers = await ts.serverList();
    if (servers.length === 0) return { success: false, message: "No server found" };
    await ts.serverStop(servers[0]);
    return { success: true, message: "Server stopped" };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export async function serverStart(): Promise<ActionResult> {
  try {
    const ts = await getTS3();
    await ts.serverStart("1");
    return { success: true, message: "Server started" };
  } catch {
    try {
      const { TeamSpeak, QueryProtocol } = await import("ts3-nodejs-library");
      const raw = await TeamSpeak.connect({
        host: process.env.TS3_HOST!,
        protocol: QueryProtocol.RAW,
        queryport: parseInt(process.env.TS3_QUERY_PORT || "10011"),
        username: process.env.TS3_QUERY_USER!,
        password: process.env.TS3_QUERY_PASSWORD!,
        nickname: "TS3Panel_Recovery",
      });
      await raw.serverStart("1");
      await raw.quit().catch(() => {});
      return { success: true, message: "Server started (recovery mode)" };
    } catch (err2) {
      return { success: false, message: String(err2) };
    }
  }
}

// ─── Server Groups ────────────────────────────────────────────

export async function getServerGroups(): Promise<ServerGroup[]> {
  const ts = await getTS3();
  const groups = await ts.serverGroupList();

  return groups.map((g) => ({
    sgid: String(g.sgid),
    name: g.name,
    type: (g as unknown as Record<string, unknown>).type as number ?? 1,
    iconId: (g as unknown as Record<string, unknown>).iconid as number ?? 0,
    memberCount: 0,
  }));
}

export async function createServerGroup(name: string): Promise<ActionResult & { sgid?: string }> {
  const ts = await getTS3();
  try {
    const group = await ts.serverGroupCreate(name, 1);
    return { success: true, message: `Created group "${name}"`, sgid: String(group.sgid) };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export async function deleteServerGroup(sgid: string): Promise<ActionResult> {
  const ts = await getTS3();
  try {
    await ts.serverGroupDel(sgid, true);
    return { success: true, message: `Deleted group ${sgid}` };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export async function getGroupPermissions(sgid: string): Promise<GroupPermission[]> {
  const ts = await getTS3();
  try {
    const perms = await ts.serverGroupPermList(sgid);
    return perms.map((p) => {
      const raw = p as unknown as Record<string, unknown>;
      return {
        permname: String(raw.permsid ?? raw.permname ?? raw.permid ?? ""),
        permvalue: Number(raw.permvalue ?? 0),
        permnegated: Boolean(raw.permnegated),
        permskip: Boolean(raw.permskip),
      };
    });
  } catch {
    return [];
  }
}

export async function addGroupPermission(
  sgid: string,
  permname: string,
  permvalue: number,
  permnegated = false,
  permskip = false
): Promise<ActionResult> {
  const ts = await getTS3();
  try {
    await ts.serverGroupAddPerm(sgid, { permname, permvalue, permnegated, permskip });
    return { success: true, message: `Set ${permname}=${permvalue} on group ${sgid}` };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export async function removeGroupPermission(sgid: string, permname: string): Promise<ActionResult> {
  const ts = await getTS3();
  try {
    await ts.serverGroupDelPerm(sgid, permname);
    return { success: true, message: `Removed ${permname} from group ${sgid}` };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export async function addClientToGroup(sgid: string, cldbid: string): Promise<ActionResult> {
  const ts = await getTS3();
  try {
    await ts.serverGroupAddClient(sgid, cldbid);
    return { success: true, message: `Added client ${cldbid} to group ${sgid}` };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export async function removeClientFromGroup(sgid: string, cldbid: string): Promise<ActionResult> {
  const ts = await getTS3();
  try {
    await ts.serverGroupDelClient(sgid, cldbid);
    return { success: true, message: `Removed client ${cldbid} from group ${sgid}` };
  } catch (err) {
    return { success: false, message: String(err) };
  }
}

export async function getClientGroups(cldbid: string): Promise<ServerGroup[]> {
  const ts = await getTS3();
  try {
    const groups = await ts.serverGroupsByClientId(cldbid);
    return groups.map((g) => ({
      sgid: String(g.sgid),
      name: g.name,
      type: 1,
      iconId: 0,
      memberCount: 0,
    }));
  } catch {
    return [];
  }
}
