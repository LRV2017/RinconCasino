export class PeerRoom {
  constructor({ onData = () => {}, onStatus = () => {} } = {}) {
    this.onData = onData;
    this.onStatus = onStatus;
    this.peer = null;
    this.connection = null;
    this.role = null;
    this.code = null;
    this.closed = false;
    this.Peer = null;
  }

  async loadPeerJS() {
    if (this.Peer) return this.Peer;
    this.onStatus("Loading peer-to-peer networking…");
    const module = await import("https://esm.sh/peerjs@1.5.5");
    this.Peer = module.default || module.Peer || module;
    return this.Peer;
  }

  waitForOpen(peer) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("The signalling connection timed out. Please try again.")), 15000);
      peer.once("open", id => { clearTimeout(timer); resolve(id); });
      peer.once("error", error => { clearTimeout(timer); reject(error); });
    });
  }

  async host(code) {
    await this.loadPeerJS();
    this.close();
    this.closed = false;
    this.role = "host";
    this.code = String(code).toUpperCase();
    const id = "rogueboard-" + this.code.toLowerCase();
    this.peer = new this.Peer(id, { debug: 0 });
    this.peer.on("connection", connection => {
      if (this.connection || this.closed) { connection.close(); return; }
      this.attach(connection);
    });
    this.peer.on("disconnected", () => this.onStatus("Signalling disconnected. Attempting to reconnect…"));
    this.peer.on("error", error => this.onStatus("Network error: " + (error?.type || error?.message || "unknown")));
    await this.waitForOpen(this.peer);
    this.onStatus("Room created. Waiting for your opponent…");
    return this.code;
  }

  async join(code) {
    await this.loadPeerJS();
    this.close();
    this.closed = false;
    this.role = "guest";
    this.code = String(code).toUpperCase();
    this.peer = new this.Peer(undefined, { debug: 0 });
    this.peer.on("error", error => this.onStatus("Network error: " + (error?.type || error?.message || "unknown")));
    this.peer.on("disconnected", () => this.onStatus("Signalling disconnected. Attempting to reconnect…"));
    await this.waitForOpen(this.peer);
    const connection = this.peer.connect("rogueboard-" + this.code.toLowerCase(), { reliable: true, serialization: "json" });
    this.connection = connection;
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("No host answered. Check the room code and try again.")), 18000);
      connection.once("open", () => { clearTimeout(timer); resolve(); });
      connection.once("error", error => { clearTimeout(timer); reject(error); });
    });
    this.bindConnection(connection);
    this.onStatus("Connected to room " + this.code + ".");
    return this.code;
  }

  attach(connection) {
    this.connection = connection;
    this.bindConnection(connection);
    this.onStatus("Opponent connected.");
  }

  bindConnection(connection) {
    connection.on("data", data => this.onData(data));
    connection.on("close", () => {
      this.connection = null;
      this.onStatus("Opponent disconnected.");
      this.onData({ type: "disconnect" });
    });
    connection.on("error", error => this.onStatus("Connection error: " + (error?.message || "unknown")));
    if (connection.open) this.onStatus("Peer-to-peer connection ready.");
    else connection.once("open", () => this.onStatus("Peer-to-peer connection ready."));
  }

  send(payload) {
    if (!this.connection || !this.connection.open) return false;
    try { this.connection.send(payload); return true; }
    catch (error) { this.onStatus("Could not send game update."); return false; }
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    try { this.connection?.close(); } catch {}
    try { this.peer?.destroy(); } catch {}
    this.connection = null;
    this.peer = null;
  }
}
