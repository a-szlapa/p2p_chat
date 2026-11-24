import { spawn, type ChildProcess } from "node:child_process";
import { mkdirSync, writeFileSync, readFileSync, chmodSync } from "node:fs";
import path from "node:path";

export interface TorOptions {
  /** Folder name under ./.tor (keeps receiver/sender state separate) */
  name: string;
  /** Local SOCKS port the Tor client listens on */
  socksPort: number;
  /** If set, publish a hidden service: onion:virtualPort -> 127.0.0.1:targetPort */
  hiddenService?: { virtualPort: number; targetPort: number };
}

export interface TorInstance {
  onionAddress?: string;
  stop(): void;
}

export function startTor(opts: TorOptions): Promise<TorInstance> {
  const base = path.resolve(".tor", opts.name);
  const dataDir = path.join(base, "data");
  const hsDir = path.join(base, "hs");
  mkdirSync(dataDir, { recursive: true });
  chmodSync(dataDir, 0o700);

  const lines = [
    `DataDirectory ${dataDir}`,
    `SocksPort 127.0.0.1:${opts.socksPort}`,
    `Log notice stdout`,
  ];
  if (opts.hiddenService) {
    lines.push(
      `HiddenServiceDir ${hsDir}`,
      `HiddenServicePort ${opts.hiddenService.virtualPort} 127.0.0.1:${opts.hiddenService.targetPort}`
    );
  }
  const torrc = path.join(base, "torrc");
  writeFileSync(torrc, lines.join("\n") + "\n");

  return new Promise((resolve, reject) => {
    const proc: ChildProcess = spawn(process.env.TOR_BIN ?? "tor", ["-f", torrc]);
    let done = false;

    const stop = () => proc.kill("SIGTERM");
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      stop();
      reject(new Error("Tor did not bootstrap within 120s"));
    }, 120_000);

    proc.on("error", (err) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      reject(
        new Error(
          `Could not start tor (${err.message}). Is it installed and on PATH? Set TOR_BIN to override.`
        )
      );
    });

    proc.stdout!.on("data", (buf: Buffer) => {
      for (const line of buf.toString().split("\n")) {
        if (!line.trim()) continue;
        if (line.includes("Bootstrapped")) console.log("[tor]", line.replace(/^.*\] /, ""));
        if (line.includes("Bootstrapped 100%") && !done) {
          done = true;
          clearTimeout(timer);
          let onionAddress: string | undefined;
          if (opts.hiddenService) {
            onionAddress = readFileSync(path.join(hsDir, "hostname"), "utf8").trim();
          }
          resolve({ onionAddress, stop });
        }
      }
    });

    proc.stderr!.on("data", (b: Buffer) => console.error("[tor:err]", b.toString().trim()));
    proc.on("exit", (code) => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        reject(new Error(`tor exited early with code ${code}`));
      }
    });
    process.on("exit", stop);
  });
}
