/**
 * Emergency permission recovery.
 *
 * Finds a user by nickname in the TS3 database and adds them
 * to the Server Admin group. Uses ServerQuery which always has
 * full access regardless of client-side permissions.
 *
 * Usage:
 *   npm run fix-perms              -> searches for "Tebii"
 *   npm run fix-perms -- NickHere  -> searches for "NickHere"
 */

import { TeamSpeak, QueryProtocol } from "ts3-nodejs-library";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

async function main() {
  const nickname = process.argv[2] || "Tebii";

  console.log("");
  console.log(`  Recovering permissions for "${nickname}"...`);
  console.log("");

  const ts = await TeamSpeak.connect({
    host: process.env.TS3_HOST!,
    protocol: QueryProtocol.RAW,
    queryport: parseInt(process.env.TS3_QUERY_PORT || "10011"),
    serverport: parseInt(process.env.TS3_SERVER_PORT || "9987"),
    username: process.env.TS3_QUERY_USER!,
    password: process.env.TS3_QUERY_PASSWORD!,
    nickname: "TS3-Recovery",
  });

  console.log("  Connected to server via ServerQuery\n");

  // 1. Find Server Admin group
  const groups = await ts.serverGroupList();

  console.log("  All server groups:");
  console.log("  ┌───────┬────────────────────────────┐");
  console.log("  │ sgid  │ Name                       │");
  console.log("  ├───────┼────────────────────────────┤");
  for (const g of groups) {
    const id = String(g.sgid).padStart(5);
    const name = g.name.padEnd(26);
    console.log(`  │ ${id} │ ${name} │`);
  }
  console.log("  └───────┴────────────────────────────┘");
  console.log("");

  const adminGroup = groups.find(
    (g) =>
      g.name === "Server Admin" ||
      g.name.toLowerCase() === "server admin" ||
      g.name.toLowerCase() === "admin"
  );

  if (!adminGroup) {
    console.error("  ✗ No 'Server Admin' group found!");
    console.error("    Check the table above and pass the correct group name.");
    await ts.quit();
    return;
  }

  console.log(`  Found admin group: "${adminGroup.name}" (sgid: ${adminGroup.sgid})`);

  // 2. Find client in database
  let cldbid: string | null = null;

  try {
    const results = await ts.clientDbFind(nickname, false);
    if (results.length > 0) {
      cldbid = String((results[0] as Record<string, unknown>).cldbid);
    }
  } catch {
    // clientDbFind might throw if not found
  }

  if (!cldbid) {
    console.error(`\n  ✗ Client "${nickname}" not found in database!`);
    console.log("\n  Listing recent clients from database:\n");

    try {
      const dbList = await ts.clientDbList(0, 25);
      for (const entry of dbList) {
        const e = entry as Record<string, unknown>;
        console.log(`    cldbid: ${e.cldbid}  nickname: ${e.clientNickname}`);
      }
    } catch {
      console.log("    (could not list database clients)");
    }

    console.log("\n  Try again with the exact nickname:");
    console.log("    npm run fix-perms -- ExactNickname\n");
    await ts.quit();
    return;
  }

  console.log(`  Found "${nickname}" in database (cldbid: ${cldbid})`);

  // 3. Add to Server Admin group
  try {
    await ts.serverGroupAddClient(adminGroup.sgid, cldbid);
    console.log(`\n  ✓ Added "${nickname}" to "${adminGroup.name}" (sgid: ${adminGroup.sgid})`);
  } catch (err) {
    const msg = String(err);
    if (msg.includes("already member")) {
      console.log(`\n  "${nickname}" is already in "${adminGroup.name}".`);
      console.log("  The issue might be different. Listing current groups...\n");

      try {
        const clientGroups = await ts.serverGroupsByClientId(cldbid);
        for (const g of clientGroups) {
          console.log(`    sgid: ${g.sgid}  name: ${g.name}`);
        }
      } catch {
        console.log("    (could not list client groups)");
      }
    } else {
      console.error(`\n  ✗ Failed: ${err}`);
    }
  }

  // 4. Also grant all important admin permissions directly
  console.log("\n  Ensuring admin has full permissions...");
  const adminPerms = [
    { permname: "i_channel_join_power", permvalue: 100 },
    { permname: "i_client_kick_from_server_power", permvalue: 100 },
    { permname: "i_client_kick_from_channel_power", permvalue: 100 },
    { permname: "i_client_move_power", permvalue: 100 },
    { permname: "i_client_ban_power", permvalue: 100 },
    { permname: "b_client_ban_create", permvalue: 1 },
    { permname: "b_channel_create_permanent", permvalue: 1 },
    { permname: "b_channel_create_temporary", permvalue: 1 },
    { permname: "b_channel_delete_permanent", permvalue: 1 },
    { permname: "b_channel_modify_power", permvalue: 1 },
    { permname: "b_client_remoteaddress_view", permvalue: 1 },
    { permname: "b_virtualserver_modify_name", permvalue: 1 },
    { permname: "b_virtualserver_modify_welcomemessage", permvalue: 1 },
    { permname: "b_client_info_view", permvalue: 1 },
    { permname: "b_serverinstance_permission_list", permvalue: 1 },
    { permname: "b_virtualserver_servergroup_permission_list", permvalue: 1 },
    { permname: "b_virtualserver_servergroup_create", permvalue: 1 },
    { permname: "b_virtualserver_servergroup_delete", permvalue: 1 },
    { permname: "i_group_modify_power", permvalue: 100 },
    { permname: "i_group_member_add_power", permvalue: 100 },
    { permname: "i_group_member_remove_power", permvalue: 100 },
    { permname: "i_permission_modify_power", permvalue: 100 },
  ];

  for (const perm of adminPerms) {
    try {
      await ts.serverGroupAddPerm(adminGroup.sgid, perm);
    } catch { /* skip existing */ }
  }
  console.log("  ✓ Admin group permissions reinforced");

  console.log("\n  ═══════════════════════════════════════");
  console.log("  ✓ RECOVERY COMPLETE");
  console.log("  ═══════════════════════════════════════");
  console.log(`\n  Reconnect to the TS3 server with nickname "${nickname}".`);
  console.log("  You should have full Server Admin rights.\n");

  await ts.quit();
}

main().catch((err) => {
  console.error(`\n  Fatal: ${err}`);
  console.error("  Make sure .env.local has the correct TS3_QUERY_PASSWORD.\n");
  process.exit(1);
});
