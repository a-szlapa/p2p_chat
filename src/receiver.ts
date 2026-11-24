import net from "node:net";
import { startTor } from "./tor.js";

const LOCAL_PORT = 7777; // local-only; Tor forwards onion:80 here

const server = net.createServer((socket) => {
  let buf = "";
  socket.on("data", (chunk) => {
    buf += chunk.toString();
    let idx;
    while ((idx = buf.indexOf("\n")) !== -1) {
      const line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      try {
        const msg = JSON.parse(line);
        console.log(`\n>>> SIGNAL RECEIVED at ${new Date().toISOString()}:`, msg);
        socket.write(JSON.stringify({ type: "ack", at: Date.now() }) + "\n");
      } catch {
        console.log("Got non-JSON data, ignoring");
      }
    }
  });
  socket.on("error", () => {});
});

await new Promise<void>((r) => server.listen(LOCAL_PORT, "127.0.0.1", r));

console.log("Starting Tor (first run can take a minute)...");
const tor = await startTor({
  name: "receiver",
  socksPort: 9250,
  hiddenService: { virtualPort: 80, targetPort: LOCAL_PORT },
});

console.log(`\nReceiver ready. Waiting for a signal at:\n  ${tor.onionAddress}\n`);
console.log(`On the other machine run:\n  npm run sender -- ${tor.onionAddress} "hello"\n`);

const shutdown = () => {
  tor.stop();
  server.close();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
