import { SocksClient } from "socks";
import { startTor } from "./tor.js";

const [onion, ...rest] = process.argv.slice(2);
if (!onion || !onion.endsWith(".onion")) {
  console.error('Usage: npm run sender -- <address>.onion ["message"]');
  process.exit(1);
}
const message = rest.join(" ") || "ping";
const SOCKS_PORT = 9250;

console.log("Starting Tor client...");
const tor = await startTor({ name: "sender", socksPort: SOCKS_PORT });

async function trySend(): Promise<string> {
  const { socket } = await SocksClient.createConnection({
    proxy: { host: "127.0.0.1", port: SOCKS_PORT, type: 5 },
    command: "connect",
    destination: { host: onion, port: 80 },
    timeout: 60_000,
  });

  return new Promise((resolve, reject) => {
    let buf = "";
    const t = setTimeout(() => {
      socket.destroy();
      reject(new Error("no reply"));
    }, 30_000);
    socket.on("data", (d) => {
      buf += d.toString();
      if (buf.includes("\n")) {
        clearTimeout(t);
        socket.end();
        resolve(buf.trim());
      }
    });
    socket.on("error", (e) => {
      clearTimeout(t);
      reject(e);
    });
    socket.write(JSON.stringify({ type: "signal", message, sentAt: Date.now() }) + "\n");
  });
}

let ok = false;
for (let attempt = 1; attempt <= 5 && !ok; attempt++) {
  try {
    console.log(`Connecting to ${onion} (attempt ${attempt}/5)...`);
    const reply = await trySend();
    console.log("Reply from receiver:", reply);
    ok = true;
  } catch (e) {
    console.log("  failed:", (e as Error).message);
    await new Promise((r) => setTimeout(r, 5000));
  }
}

tor.stop();
process.exit(ok ? 0 : 1);
