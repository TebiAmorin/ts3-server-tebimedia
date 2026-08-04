/**
 * TS3 Premium Server Setup
 *
 * Configures identity, security, server groups, channel structure
 * with descriptions, and visual branding.
 *
 * Usage: npm run setup-ts3
 */

import {
  TeamSpeak,
  QueryProtocol,
  Codec,
  CodecEncryptionMode,
  HostBannerMode,
} from "ts3-nodejs-library";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

// ─── Logging ──────────────────────────────────────────────────
const log = (msg: string) => console.log(`  ${msg}`);
const ok = (msg: string) => console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
const fail = (msg: string) => console.error(`  \x1b[31m✗\x1b[0m ${msg}`);
const header = (msg: string) => {
  console.log("");
  console.log(`\x1b[36m  ═══ ${msg} ═══\x1b[0m`);
};

// ─── Channel Descriptions (BB Code) ──────────────────────────
const DESC = {
  bienvenida: [
    "[center][b][size=14]Bienvenido a TEBIMEDIA[/size][/b][/center]",
    "[center]Rainbow Six Siege · Esports · Competitivo[/center]",
    "",
    "[hr]",
    "",
    "Servidor oficial de la comunidad [b]TEBIMEDIA[/b].",
    "Aqui organizamos torneos, retransmisiones y eventos competitivos.",
    "",
    "[b]Conecta:[/b]",
    "[list]",
    "[*] Servidor: [b]ts.tebimedia.com[/b]",
    "[*] Web: [b]tebimedia.com[/b]",
    "[/list]",
    "",
    "[center][size=10][color=#64748b]Respeta las normas. Disfruta del juego.[/color][/size][/center]",
  ].join("\n"),

  normas: [
    "[center][b][size=14]NORMAS DEL SERVIDOR[/size][/b][/center]",
    "",
    "[hr]",
    "",
    "[b][color=#3b82f6]1.[/color][/b] Respeta a todos los usuarios sin excepcion.",
    "[b][color=#3b82f6]2.[/color][/b] Prohibido el spam, flood o reproducir sonidos molestos.",
    "[b][color=#3b82f6]3.[/color][/b] No grabar conversaciones sin consentimiento.",
    "[b][color=#3b82f6]4.[/color][/b] Usa un nickname reconocible y apropiado.",
    "[b][color=#3b82f6]5.[/color][/b] No compartir IPs ni datos personales de otros.",
    "[b][color=#3b82f6]6.[/color][/b] Obedece las instrucciones del staff en todo momento.",
    "[b][color=#3b82f6]7.[/color][/b] No molestar en canales de partida/torneo.",
    "[b][color=#3b82f6]8.[/color][/b] Los canales de equipo son privados durante competicion.",
    "",
    "[hr]",
    "",
    "[center][color=#ef4444]El incumplimiento resultara en kick, ban temporal o permanente.[/color][/center]",
  ].join("\n"),

  redes: [
    "[center][b][size=14]REDES Y CONTACTO[/size][/b][/center]",
    "",
    "[hr]",
    "",
    "[b]Servidor TeamSpeak:[/b] ts.tebimedia.com",
    "[b]Web:[/b] tebimedia.com",
    "",
    "[center][size=10][color=#64748b]Siguenos para enterarte de los torneos y eventos.[/color][/size][/center]",
  ].join("\n"),

  streamVetel: [
    "[center][b][size=12]CANAL DE STREAM - VETEL[/size][/b][/center]",
    "[hr]",
    "[center]Canal exclusivo para retransmisiones en directo.[/center]",
    "[center]Requiere rol [b]Stream[/b] para entrar.[/center]",
    "",
    "[center][color=#ef4444]No molestar durante emisiones en vivo.[/color][/center]",
  ].join("\n"),

  streamTebi: [
    "[center][b][size=12]CANAL DE STREAM - TEBI[/size][/b][/center]",
    "[hr]",
    "[center]Canal exclusivo para retransmisiones en directo.[/center]",
    "[center]Requiere rol [b]Stream[/b] para entrar.[/center]",
    "",
    "[center][color=#ef4444]No molestar durante emisiones en vivo.[/color][/center]",
  ].join("\n"),

  espera: [
    "[center][b]SALA DE ESPERA[/b][/center]",
    "[hr]",
    "[center]Espera aqui antes de entrar a un stream o torneo.[/center]",
    "[center]Un moderador te movera cuando sea tu turno.[/center]",
  ].join("\n"),

  admin: [
    "[center][b]ZONA DE ADMINISTRACION[/b][/center]",
    "[hr]",
    "[center]Solo personal autorizado.[/center]",
    "[center]Requiere permisos de [b]Admin[/b].[/center]",
  ].join("\n"),

  equipo: (nombre: string) =>
    [
      `[center][b][size=12]${nombre.toUpperCase()}[/size][/b][/center]`,
      "[hr]",
      `[center]Canales privados del equipo [b]${nombre}[/b].[/center]`,
      "[center]Solo miembros del equipo pueden entrar.[/center]",
      "",
      "[b]Subcanales:[/b]",
      "[list]",
      "[*] [b]Partidos[/b] - Durante competicion oficial",
      "[*] [b]Entrenos[/b] - Sesiones de practica",
      "[*] [b]Charla[/b] - Comunicacion general del equipo",
      "[/list]",
    ].join("\n"),

  lobby: [
    "[center][b]LOBBY GENERAL[/b][/center]",
    "[hr]",
    "[center]Canal abierto para todos.[/center]",
    "[center]Pasa el rato, busca partida o conoce gente.[/center]",
  ].join("\n"),

  afk: [
    "[center][b]AFK[/b][/center]",
    "[hr]",
    "[center]Seras movido aqui automaticamente tras 15 min de inactividad.[/center]",
  ].join("\n"),
};

// ─── Main ─────────────────────────────────────────────────────
async function main() {
  console.log("");
  console.log("\x1b[1m  TEBIMEDIA · TS3 Premium Setup\x1b[0m");
  console.log("  ─────────────────────────────────────");

  log(`Connecting to ${process.env.TS3_HOST}:${process.env.TS3_QUERY_PORT}...`);

  const ts = await TeamSpeak.connect({
    host: process.env.TS3_HOST!,
    protocol: QueryProtocol.RAW,
    queryport: parseInt(process.env.TS3_QUERY_PORT || "10011"),
    serverport: parseInt(process.env.TS3_SERVER_PORT || "9987"),
    username: process.env.TS3_QUERY_USER!,
    password: process.env.TS3_QUERY_PASSWORD!,
    nickname: "TS3-Setup",
  });

  ok("Connected");

  // ═══════════════════════════════════════════════════════════════
  header("SERVER IDENTITY");
  // ═══════════════════════════════════════════════════════════════

  const WELCOME = [
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    "    Bienvenido a TEBIMEDIA",
    "    R6 Siege · Esports",
    "",
    "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
    "",
    "» Lee las normas en el canal de Normas.",
    "» Servidor: ts.tebimedia.com",
    "» Problemas? Contacta con un Admin.",
    "",
    "Disfruta de tu estancia.",
  ].join("\n");

  await ts.serverEdit({
    virtualserverName: "TEBIMEDIA · R6 Siege Esports",
    virtualserverWelcomemessage: WELCOME,
    // Banner: pon aqui la URL de tu imagen (900x120px recomendado)
    // Subela a tu web o usa un hosting de imagenes
    // virtualserverHostbannerGfxUrl: "https://tebimedia.com/banner-ts3.png",
    // virtualserverHostbannerUrl: "https://tebimedia.com",
    virtualserverHostbannerMode: HostBannerMode.KEEPASPECT,
    virtualserverHostbannerGfxInterval: 60,
    virtualserverHostbuttonTooltip: "TEBIMEDIA · Web",
    virtualserverHostbuttonUrl: "https://tebimedia.com",
    // virtualserverHostbuttonGfxUrl: "https://tebimedia.com/icon-ts3.png",
  });

  ok("Server name: TEBIMEDIA · R6 Siege Esports");
  ok("Welcome message configured");
  ok("Host button -> tebimedia.com");
  log("(Descomenta las URLs de banner cuando tengas las imagenes)");

  // ═══════════════════════════════════════════════════════════════
  header("SECURITY & AUDIO");
  // ═══════════════════════════════════════════════════════════════

  await ts.serverEdit({
    virtualserverAntifloodPointsTickReduce: 25,
    virtualserverAntifloodPointsNeededCommandBlock: 150,
    virtualserverAntifloodPointsNeededIpBlock: 300,
    virtualserverCodecEncryptionMode: CodecEncryptionMode.ENABLED,
    virtualserverNeededIdentitySecurityLevel: 15,
    virtualserverLogClient: 1,
    virtualserverLogQuery: 1,
    virtualserverLogChannel: 1,
    virtualserverLogServer: 1,
    virtualserverLogPermissions: 1,
    virtualserverLogFiletransfer: 1,
    virtualserverComplainAutobanCount: 5,
    virtualserverComplainAutobanTime: 1200,
    virtualserverComplainRemoveTime: 3600,
  });

  ok("Anti-flood: 25/150/300");
  ok("Codec encryption: forced");
  ok("Identity security level: 15");
  ok("Full logging enabled");
  ok("Complain autoban: 5 complaints -> 20min ban");

  // Update all existing channels to Opus Voice Q10
  const existingCh = await ts.channelList();
  let codecN = 0;
  for (const ch of existingCh) {
    if (ch.name.match(/\[.*spacer.*\]/i)) continue;
    try {
      await ts.channelEdit(ch.cid, {
        channelCodec: Codec.OPUS_VOICE,
        channelCodecQuality: 10,
      });
      codecN++;
    } catch { /* skip */ }
  }
  ok(`${codecN} existing channels -> Opus Voice Q10`);

  // ═══════════════════════════════════════════════════════════════
  header("GUEST GROUP LOCKDOWN");
  // ═══════════════════════════════════════════════════════════════

  const allGroups = await ts.serverGroupList();
  const guest = allGroups.find((g) => g.name.toLowerCase() === "guest");

  if (!guest) {
    fail("Guest group not found!");
  } else {
    const perms = [
      { permname: "b_client_remoteaddress_view", permvalue: 0, permnegated: true },
      { permname: "b_channel_create_temporary", permvalue: 0, permnegated: true },
      { permname: "b_channel_create_semi_permanent", permvalue: 0, permnegated: true },
      { permname: "b_channel_create_permanent", permvalue: 0, permnegated: true },
      { permname: "i_client_poke_power", permvalue: 0 },
      { permname: "i_channel_subscribe_power", permvalue: 15 },
      { permname: "i_channel_join_power", permvalue: 0 },
    ];
    for (const p of perms) {
      try { await ts.serverGroupAddPerm(guest.sgid, p); } catch { /* skip */ }
    }
    ok(`Guest (sgid:${guest.sgid}): no IPs, no channels, no pokes, join_power=0`);
  }

  // Admin poke protection
  const adminGrp = allGroups.find(
    (g) => g.name.toLowerCase() === "server admin" || g.name.toLowerCase() === "admin"
  );
  if (adminGrp) {
    try {
      await ts.serverGroupAddPerm(adminGrp.sgid, {
        permname: "i_client_needed_poke_power", permvalue: 75,
      });
      ok(`Admin (sgid:${adminGrp.sgid}): poke-protected`);
    } catch { /* skip */ }
  }

  // ═══════════════════════════════════════════════════════════════
  header("SERVER GROUPS (ROLES)");
  // ═══════════════════════════════════════════════════════════════

  interface GroupDef {
    name: string;
    perms: Array<{ permname: string; permvalue: number; permnegated?: boolean }>;
  }

  const groupDefs: GroupDef[] = [
    {
      name: "Moderador",
      perms: [
        { permname: "i_client_kick_from_server_power", permvalue: 50 },
        { permname: "i_client_kick_from_channel_power", permvalue: 50 },
        { permname: "i_client_move_power", permvalue: 50 },
        { permname: "b_client_ban_create", permvalue: 1 },
        { permname: "i_client_ban_power", permvalue: 50 },
        { permname: "i_client_poke_power", permvalue: 50 },
        { permname: "i_channel_join_power", permvalue: 60 },
        { permname: "i_client_needed_poke_power", permvalue: 40 },
        { permname: "b_channel_join_ignore_password", permvalue: 0 },
      ],
    },
    {
      name: "VIP",
      perms: [
        { permname: "i_channel_join_power", permvalue: 25 },
        { permname: "i_client_poke_power", permvalue: 10 },
      ],
    },
    {
      name: "Stream",
      perms: [
        { permname: "i_channel_join_power", permvalue: 50 },
        { permname: "i_client_poke_power", permvalue: 20 },
      ],
    },
    {
      name: "Equipo 1",
      perms: [
        { permname: "i_channel_join_power", permvalue: 30 },
      ],
    },
    {
      name: "Equipo 2",
      perms: [
        { permname: "i_channel_join_power", permvalue: 35 },
      ],
    },
  ];

  const createdGroups: Array<{ name: string; sgid: string }> = [];

  for (const def of groupDefs) {
    const refreshed = await ts.serverGroupList();
    const existing = refreshed.find((g) => g.name === def.name);
    let sgid: string;

    if (existing) {
      sgid = String(existing.sgid);
      log(`"${def.name}" already exists (sgid:${sgid}), updating perms...`);
    } else {
      try {
        const created = await ts.serverGroupCreate(def.name, 1);
        sgid = String(created.sgid);
      } catch (err) {
        fail(`Failed to create "${def.name}": ${err}`);
        continue;
      }
    }

    for (const perm of def.perms) {
      try { await ts.serverGroupAddPerm(sgid, perm); } catch { /* skip */ }
    }

    ok(`${def.name} (sgid:${sgid})`);
    createdGroups.push({ name: def.name, sgid });
  }

  // ═══════════════════════════════════════════════════════════════
  header("CHANNEL STRUCTURE");
  // ═══════════════════════════════════════════════════════════════

  // Delete all old non-default channels
  log("Clearing old channels...");
  const toDelete = await ts.channelList();
  for (const ch of toDelete) {
    if (ch.flagDefault) continue;
    try { await ts.channelDelete(ch.cid, true); } catch { /* skip */ }
  }
  ok("Old channels cleared");

  // Helpers
  async function createCh(
    name: string,
    opts: Record<string, unknown> = {}
  ): Promise<string> {
    try {
      const ch = await ts.channelCreate(name, {
        channelFlagPermanent: true,
        channelCodec: Codec.OPUS_VOICE,
        channelCodecQuality: 10,
        ...opts,
      });
      return String(ch.cid);
    } catch (err) {
      fail(`"${name}": ${err}`);
      return "0";
    }
  }

  async function setJoinPower(cid: string, power: number) {
    if (cid === "0") return;
    try {
      await ts.channelSetPerm(cid, {
        permname: "i_channel_needed_join_power",
        permvalue: power,
      });
    } catch { /* skip */ }
  }

  async function setSubscribePower(cid: string, power: number) {
    if (cid === "0") return;
    try {
      await ts.channelSetPerm(cid, {
        permname: "i_channel_needed_subscribe_power",
        permvalue: power,
      });
    } catch { /* skip */ }
  }

  function spacer(id: number, text: string, afterCid: string) {
    return createCh(`[cspacer${id}]${text}`, {
      channelOrder: afterCid,
      channelMaxclients: 0,
      channelFlagMaxclientsUnlimited: false,
    });
  }

  function lineSpacer(id: number, afterCid: string) {
    return createCh(`[spacer${id}]━`, {
      channelOrder: afterCid,
      channelMaxclients: 0,
      channelFlagMaxclientsUnlimited: false,
    });
  }

  // Info channel (visible but nobody can join, read description only)
  async function infoChannel(
    name: string,
    description: string,
    afterCid: string
  ): Promise<string> {
    const cid = await createCh(name, {
      channelOrder: afterCid,
      channelMaxclients: 0,
      channelFlagMaxclientsUnlimited: false,
      channelDescription: description,
    });
    return cid;
  }

  let last = "0";

  // ── BRAND HEADER ──
  last = await spacer(0, "TEBIMEDIA", last);
  ok("Brand spacer");

  last = await infoChannel("Normas", DESC.normas, last);
  ok("Normas (info channel)");

  last = await infoChannel("Redes y Contacto", DESC.redes, last);
  ok("Redes (info channel)");

  last = await lineSpacer(1, last);

  // ── STREAM ──
  last = await spacer(2, "STREAM", last);

  const streamVetel = await createCh("Canal Stream Vetel", {
    channelOrder: last,
    channelDescription: DESC.streamVetel,
  });
  await setJoinPower(streamVetel, 50);
  await setSubscribePower(streamVetel, 30);
  last = streamVetel;

  const streamTebi = await createCh("Canal Stream Tebi", {
    channelOrder: last,
    channelDescription: DESC.streamTebi,
  });
  await setJoinPower(streamTebi, 50);
  await setSubscribePower(streamTebi, 30);
  last = streamTebi;

  const espera = await createCh("Sala de Espera", {
    channelOrder: last,
    channelDescription: DESC.espera,
  });
  last = espera;

  ok("STREAM: Vetel (jp:50), Tebi (jp:50), Espera (public)");

  last = await lineSpacer(3, last);

  // ── BIENVENIDA ──
  last = await spacer(4, "BIENVENIDA", last);

  const bienvenida = await createCh("Bienvenida", {
    channelOrder: last,
    channelDescription: DESC.bienvenida,
  });
  last = bienvenida;

  if (bienvenida !== "0") {
    try {
      await ts.channelEdit(bienvenida, { channelFlagDefault: true });
      ok("Bienvenida -> default channel");
    } catch (err) {
      fail(`Default channel: ${err}`);
    }
  }

  last = await lineSpacer(5, last);

  // ── ADMINISTRACION ──
  last = await spacer(6, "ADMIN", last);

  for (let i = 1; i <= 3; i++) {
    const adminCh = await createCh(`Admin ${i}`, {
      channelOrder: last,
      channelDescription: DESC.admin,
    });
    await setJoinPower(adminCh, 75);
    await setSubscribePower(adminCh, 50);
    last = adminCh;
  }
  ok("ADMIN: Admin 1/2/3 (jp:75)");

  last = await lineSpacer(7, last);

  // ── EQUIPOS ──
  last = await spacer(8, "EQUIPOS", last);

  // Equipo 1
  const eq1 = await createCh("Equipo 1", {
    channelOrder: last,
    channelDescription: DESC.equipo("Equipo 1"),
  });
  await setJoinPower(eq1, 30);
  last = eq1;

  for (const sub of ["Partidos", "Entrenos", "Charla"]) {
    const subCh = await createCh(sub, {
      cpid: eq1,
      channelDescription: DESC.equipo("Equipo 1"),
    });
    await setJoinPower(subCh, 30);
  }

  // Equipo 2
  const eq2 = await createCh("Equipo 2", {
    channelOrder: last,
    channelDescription: DESC.equipo("Equipo 2"),
  });
  await setJoinPower(eq2, 35);
  last = eq2;

  for (const sub of ["Partidos", "Entrenos", "Charla"]) {
    const subCh = await createCh(sub, {
      cpid: eq2,
      channelDescription: DESC.equipo("Equipo 2"),
    });
    await setJoinPower(subCh, 35);
  }

  ok("EQUIPOS: Eq1 (jp:30), Eq2 (jp:35) con subcanales");

  last = await lineSpacer(9, last);

  // ── ZONA CHILL ──
  last = await spacer(10, "ZONA CHILL", last);

  const lobby = await createCh("Lobby", {
    channelOrder: last,
    channelDescription: DESC.lobby,
  });
  last = lobby;

  const gaming = await createCh("Gaming", {
    channelOrder: last,
    channelDescription: DESC.lobby,
  });
  last = gaming;

  await createCh("AFK", {
    channelOrder: last,
    channelDescription: DESC.afk,
  });

  ok("ZONA CHILL: Lobby, Gaming, AFK");

  // ═══════════════════════════════════════════════════════════════
  header("SUMMARY");
  // ═══════════════════════════════════════════════════════════════

  console.log("");
  console.log("  \x1b[32m┌──────────────────────────────────────────────┐\x1b[0m");
  console.log("  \x1b[32m│         SETUP COMPLETED SUCCESSFULLY         │\x1b[0m");
  console.log("  \x1b[32m└──────────────────────────────────────────────┘\x1b[0m");

  console.log("");
  log("\x1b[1mServer Groups:\x1b[0m");
  console.log("");
  console.log("  ┌───────────────┬───────┬─────────────────────────┐");
  console.log("  │ Grupo         │ sgid  │ Permiso clave           │");
  console.log("  ├───────────────┼───────┼─────────────────────────┤");
  const details: Record<string, string> = {
    Moderador: "kick/ban/move 50",
    VIP: "join_power 25",
    Stream: "join_power 50",
    "Equipo 1": "join_power 30",
    "Equipo 2": "join_power 35",
  };
  for (const g of createdGroups) {
    const n = g.name.padEnd(13);
    const id = g.sgid.padStart(5);
    const d = (details[g.name] || "").padEnd(23);
    console.log(`  │ ${n} │ ${id} │ ${d} │`);
  }
  console.log("  └───────────────┴───────┴─────────────────────────┘");

  console.log("");
  log("\x1b[1mChannel Structure:\x1b[0m");
  console.log("");
  log("  [TEBIMEDIA]       Brand header + Normas + Redes");
  log("  [STREAM]          Vetel (jp:50) | Tebi (jp:50) | Espera");
  log("  [BIENVENIDA]      Bienvenida (default channel)");
  log("  [ADMIN]           Admin 1/2/3 (jp:75)");
  log("  [EQUIPOS]         Equipo 1 (jp:30) | Equipo 2 (jp:35)");
  log("  [ZONA CHILL]      Lobby | Gaming | AFK");

  console.log("");
  log("\x1b[1mNext steps:\x1b[0m");
  console.log("");
  log("  1. Asigna los roles con: /servergroupaddclient sgid=XX cldbid=YY");
  log("  2. Sube un banner (900x120px) y descomenta las URLs en el script");
  log("  3. Sube iconos de grupo desde el cliente TS3 (clic derecho en grupo)");
  log("  4. Instala Sinusbot para bot de musica (ver README)");
  log("  5. Instala JTS3ServerMod para auto-AFK y welcome bot");
  console.log("");

  await ts.quit();
}

main().catch((err) => {
  fail(`Fatal: ${err}`);
  process.exit(1);
});
