import { Enums } from "../Enums.js";
import Packet from "../Packet.js";
import { MineProtocol } from "../Protocol.js";
import { Util } from "../Util.js";

export default class SCLoginAckPacketV5 implements Packet {
  packetId: Enums.PacketId = Enums.PacketId.SCLoginAckPacketV5;
  type: "packet" = "packet";
  boundTo = Enums.PacketBounds.C;
  sentAfterHandshake = false;

  username: string = "";
  uuid: string = "";
  // Standard capabilities granted
  standardCapabilities: number = 0;
  capabilityVersions: number[] = [];
  // Extended capabilities granted
  extendedCapabilities: Map<string, number> = new Map();

  public serialize() {
    // Eaglercraft 26.2 (Protocol V5) LoginAck packet format:
    // [packetId: 0x05]
    // [username: String]
    // [uuid: Long, Long (16 bytes)]
    // [standardCapabilities: VarInt]
    // [capabilityCount: Byte]
    // [capabilityVersions: VarInt[]]
    // [extendedCapabilityCount: Byte]
    // [extendedCapabilities: (UUID: Long, Long, version: Byte)[]]
    
    const uuidBuf = Util.uuidStringToBuffer(this.uuid);
    
    const parts: Buffer[] = [
      Buffer.from([this.packetId]),
      MineProtocol.writeString(this.username),
      uuidBuf,
      MineProtocol.writeVarInt(this.standardCapabilities),
      Buffer.from([this.capabilityVersions.length]),
    ];
    
    for (const ver of this.capabilityVersions) {
      parts.push(MineProtocol.writeVarInt(ver));
    }
    
    parts.push(Buffer.from([this.extendedCapabilities.size]));
    for (const [uuid, ver] of this.extendedCapabilities) {
      const uuidBuf2 = Util.uuidStringToBuffer(uuid);
      parts.push(uuidBuf2);
      parts.push(Buffer.from([ver]));
    }
    
    return Buffer.concat(parts as unknown as Uint8Array[]);
  }

  public deserialize(packet: Buffer) {
    if (packet[0] != this.packetId)
      throw TypeError("Invalid packet ID detected!");
    packet = packet.subarray(1);
    
    const username = MineProtocol.readString(packet);
    this.username = username.value;
    packet = username.newBuffer;
    
    const uuid = packet.subarray(0, 16);
    this.uuid = Util.uuidBufferToString(uuid);
    packet = packet.subarray(16);
    
    const caps = MineProtocol.readVarInt(packet);
    this.standardCapabilities = caps.value;
    packet = caps.newBuffer;
    
    const capCount = packet[0];
    packet = packet.subarray(1);
    this.capabilityVersions = [];
    for (let i = 0; i < capCount; i++) {
      const capVer = MineProtocol.readVarInt(packet);
      this.capabilityVersions.push(capVer.value);
      packet = capVer.newBuffer;
    }
    
    const extCount = packet[0];
    packet = packet.subarray(1);
    this.extendedCapabilities = new Map();
    for (let i = 0; i < extCount; i++) {
      const uuidBuf = packet.subarray(0, 16);
      const uuid = uuidBuf.toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
      packet = packet.subarray(16);
      
      const ver = packet[0];
      packet = packet.subarray(1);
      
      this.extendedCapabilities.set(uuid, ver);
    }
    
    return this;
  }
}