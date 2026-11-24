# tor-p2p-check

Minimal Tor hidden-service check: a **receiver** publishes an .onion address and waits;
a **sender** on another machine connects through Tor and sends a signal.

## Prereqs (both machines)
- Node 18+
- `tor` binary on PATH
  - macOS: `brew install tor`
  - Debian/Ubuntu: `sudo apt install tor` (the system service doesn't need to run; you can `sudo systemctl disable --now tor`)
  - Windows: install Tor Expert Bundle, set `TOR_BIN` to the full path of tor.exe

## Run
```
npm install

# machine A
npm run receiver          # prints the .onion address

# machine B
npm run sender -- <address>.onion "hello"
```
The receiver logs the signal and replies with an ack; the sender prints it.

Notes
- Uses SOCKS port 9250 so it won't clash with a system Tor on 9050.
- The onion address is persisted in `.tor/receiver/hs` (gitignored), so it stays the same between runs. Never commit it, it contains the private key.
- First connection after receiver start can take 10-60s; the sender retries 5 times.
