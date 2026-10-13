import { Enums } from "../Enums.js";
import Packet from "../Packet.js";
import { MineProtocol } from "../Protocol.js";

export default class CSLoginPacketV5 implements Packet {
  packetId: Enums.PacketId = Enums.PacketId.CSLoginPacketV5;
  type: "packet" = "packet";
  boundTo = Enums.PacketBounds.S;
  sentAfterHandshake = false;

  username: string = "";
  // Auth data (password hash, etc.) - optional
  authData: Buffer = Buffer.alloc(0);
  // Whether to enable cookie-based auth
  enableCookie: boolean = false;
  cookieData: Buffer = Buffer.alloc(0);
  // Client capabilities
  standardCapabilities: number = 0;
  capabilityVersions: number[] = [];
  extendedCapabilities: Map<string, number> = new Map();

  public serialize() {
    // Not used for server->client
    return Buffer.alloc(0);
  }

  public deserialize(packet: Buffer) {
    if (packet[0] != this.packetId)
      throw TypeError("Invalid packet ID detected!");
    
    packet = packet.subarray(1);
    
    // Read username (length-prefixed string)
    const username = MineProtocol.readString(packet);
    this.username = username.value;
    packet = username.newBuffer;
    
    // Read requested server address (optional, for proxy chains)
    const requestedServer = MineProtocol.readString(packet);
    packet = requestedServer.newBuffer;
    
    // Read auth password hash
    const authLen = packet[0];
    if (authLen > 0) {
      this.authData = packet.subarray(1, 1 + authLen);
      packet = packet.subarray(1 + authLen);
    } else {
      packet = packet.subarray(1);
    }
    
    // Read cookie settings
    this.enableCookie = packet[0] === 1;
    packet = packet.subarray(1);
    
    const cookieLen = packet[0];
    if (cookieLen > 0) {
      this.cookieData = packet.subarray(1, 1 + cookieLen);
      packet = packet.subarray(1 + cookieLen);
    } else {
      packet = packet.subarray(1);
    }
    
    // Read standard capabilities
    const caps = MineProtocol.readVarInt(packet);
    this.standardCapabilities = caps.value;
    packet = caps.newBuffer;
    
    // Read capability versions
    const capCount = this.countBits(this.standardCapabilities);
    this.capabilityVersions = [];
    for (let i = 0; i < capCount; i++) {
      const capVer = MineProtocol.readVarInt(packet);
      this.capabilityVersions.push(capVer.value);
      packet = capVer.newBuffer;
    }
    
    // Read extended capabilities
    const extCount = packet[0];
    packet = packet.subarray(1);
    this.extendedCapabilities = new Map();
    for (let i = 0; i < extCount; i++) {
      // UUID (16 bytes)
      const uuidBuf = packet.subarray(0, 16);
      const uuid = uuidBuf.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
      packet = packet.subarray(16);
      
      const ver = packet[0];
      packet = packet.subarray(1);
      
      this.extendedCapabilities.set(uuid, ver);
    }
    
    return this;
  }
  
  private countBits(n: number): number {
    let count = 0;
    while (n) {
      count += n & 1;
      n >>= 1;
    }
    return count;
  }
}