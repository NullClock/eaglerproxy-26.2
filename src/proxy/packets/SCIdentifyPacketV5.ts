import { NETWORK_VERSION, PROXY_BRANDING, PROXY_VERSION, VANILLA_PROTOCOL_VERSION } from "../../meta.js";
import { Enums } from "../Enums.js";
import Packet from "../Packet.js";
import { MineProtocol } from "../Protocol.js";

export default class SCIdentifyPacketV5 implements Packet {
  packetId: Enums.PacketId = Enums.PacketId.SCIdentifyPacketV5;
  type: "packet" = "packet";
  boundTo = Enums.PacketBounds.C;
  sentAfterHandshake = false;

  // Server selects the protocol versions
  selectedEaglerProtocol: number = NETWORK_VERSION;
  selectedMcProtocol: number = VANILLA_PROTOCOL_VERSION;
  branding: string = PROXY_BRANDING;
  version: string = PROXY_VERSION;
  // Extended capabilities (for future use)
  capabilities: number = 0;
  capabilityVersions: number[] = [];
  extendedCapabilities: Map<string, number> = new Map();

  public serialize() {
    // Eaglercraft 26.2 (Protocol V5) IdentifyServer packet format:
    // [packetId: 0x02] 
    // [selectedEaglerProtocol: Short] 
    // [selectedMcProtocol: Short] 
    // [brand: String] 
    // [version: String] 
    // [capabilities: VarInt] 
    // [capabilityCount: Byte] 
    // [capabilityVersions: VarInt[]] 
    // [extendedCapabilityCount: Byte] 
    // [extendedCapabilities: (UUID: Long, Long, version: Byte)[]] 
    // [0x00, 0x00, 0x00] (padding)
    
    const parts: Buffer[] = [
      Buffer.from([0x02]), // Sub-protocol ID
      MineProtocol.writeShort(this.selectedEaglerProtocol),
      MineProtocol.writeShort(this.selectedMcProtocol),
      MineProtocol.writeString(this.branding),
      MineProtocol.writeString(this.version),
      MineProtocol.writeVarInt(this.capabilities),
    ];
    
    // Capability versions
    parts.push(Buffer.from([this.capabilityVersions.length]));
    for (const ver of this.capabilityVersions) {
      parts.push(MineProtocol.writeVarInt(ver));
    }
    
    // Extended capabilities
    parts.push(Buffer.from([this.extendedCapabilities.size]));
    for (const [uuid, ver] of this.extendedCapabilities) {
      // Parse UUID string to two longs
      const uuidBuf = Buffer.from(uuid.replace(/-/g, ''), 'hex');
      parts.push(uuidBuf.subarray(0, 8)); // Most significant bits
      parts.push(uuidBuf.subarray(8, 16)); // Least significant bits
      parts.push(Buffer.from([ver]));
    }
    
    // Padding
    parts.push(Buffer.from([0x00, 0x00, 0x00]));
    
    return Buffer.concat(parts as unknown as Uint8Array[]);
  }

  public deserialize(packet: Buffer) {
    if (packet[0] != this.packetId)
      throw TypeError("Invalid packet ID detected!");
    packet = packet.subarray(1);
    
    const protoVer = MineProtocol.readShort(packet),
      gameVer = MineProtocol.readShort(protoVer.newBuffer),
      branding = MineProtocol.readString(gameVer.newBuffer),
      version = MineProtocol.readString(branding.newBuffer);
    
    this.selectedEaglerProtocol = protoVer.value;
    this.selectedMcProtocol = gameVer.value;
    this.branding = branding.value;
    this.version = version.value;
    
    return this;
  }
}