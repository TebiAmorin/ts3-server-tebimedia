import { TeamSpeak, QueryProtocol } from "ts3-nodejs-library";

let instance: TeamSpeak | null = null;
let connecting: Promise<TeamSpeak> | null = null;
let lastUsed = 0;

const IS_SERVERLESS = !!process.env.VERCEL;
const IDLE_TIMEOUT = 30_000;

function getBaseConfig() {
  const host = process.env.TS3_HOST;
  const username = process.env.TS3_QUERY_USER;
  const password = process.env.TS3_QUERY_PASSWORD;
  if (!host || !username || !password) {
    throw new Error("Missing TS3 env vars (TS3_HOST, TS3_QUERY_USER, TS3_QUERY_PASSWORD)");
  }
  return {
    host,
    protocol: QueryProtocol.RAW,
    queryport: parseInt(process.env.TS3_QUERY_PORT || "10011"),
    username,
    password,
    nickname: "TS3Panel",
    keepAlive: !IS_SERVERLESS,
    keepAliveTimeout: 250,
  };
}

async function createConnection(): Promise<TeamSpeak> {
  const config = getBaseConfig();
  const ts = await TeamSpeak.connect(config);
  const sid = process.env.TS3_SERVER_ID || "1";
  await ts.useBySid(sid);
  return ts;
}

export async function getTS3(): Promise<TeamSpeak> {
  if (instance) {
    lastUsed = Date.now();
    return instance;
  }

  if (connecting) {
    return connecting;
  }

  connecting = createConnection()
    .then((ts) => {
      instance = ts;
      connecting = null;
      lastUsed = Date.now();

      ts.on("close", () => {
        instance = null;
      });

      ts.on("error", () => {
        instance = null;
      });

      if (!IS_SERVERLESS) {
        setInterval(() => {
          if (instance && Date.now() - lastUsed > IDLE_TIMEOUT) {
            instance.quit().catch(() => {});
            instance = null;
          }
        }, 10_000);
      }

      return ts;
    })
    .catch((err) => {
      connecting = null;
      throw err;
    });

  return connecting;
}

export async function withTS3<T>(fn: (ts: TeamSpeak) => Promise<T>): Promise<T> {
  if (IS_SERVERLESS) {
    const ts = await createConnection();
    try {
      return await fn(ts);
    } finally {
      await ts.quit().catch(() => {});
    }
  }
  const ts = await getTS3();
  return fn(ts);
}

export async function disconnectTS3(): Promise<void> {
  if (instance) {
    await instance.quit();
    instance = null;
  }
}
