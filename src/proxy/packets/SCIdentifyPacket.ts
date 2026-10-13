import {
  NETWORK_VERSION,
  PROXY_BRANDING,
  PROXY_VERSION,
  VANILLA_PROTOCOL_VERSION,
} from "../../meta.js";
import { Enums } from "../Enums.js";
import Packet from "../Packet.js";
import { MineProtocol } from "../Protocol.js";

export default class SCIdentifyPacket implements Packet {
  packetId: Enums.PacketId = Enums.PacketId.SCIdentifyPacket;
  type: "packet" = "packet";
  boundTo = Enums.PacketBounds.C;
  sentAfterHandshake = false;

  protocolVer = NETWORK_VERSION;
  gameVersion = VANILLA_PROTOCOL_VERSION;
  branding = PROXY_BRANDING;
  version = PROXY_VERSION;

  public serialize() {
    // Eaglercraft 26.2 (Protocol V5) IdentifyServer packet format:
    // [packetId: 0x02] [protocolVer: Short] [gameVersion: Short] [brand: String] [version: String] [0x00, 0x00, 0x00]
    return Buffer.concat(
      [
        [0x02],
        MineProtocol.writeShort(this.protocolVer),
        MineProtocol.writeShort(this.gameVersion),
        MineProtocol.writeString(this.branding),
        MineProtocol.writeString(this.version),
        [0x00, 0x00, 0x00],
      ].map((arr) => (arr instanceof Uint8Array ? arr : Buffer.from(arr)))
    );
  }

  public deserialize(packet: Buffer) {
    if (packet[0] != this.packetId)
      throw TypeError("Invalid packet ID detected!");
    packet = packet.subarray(1);
    const protoVer = MineProtocol.readShort(packet),
      gameVer = MineProtocol.readShort(protoVer.newBuffer),
      branding = MineProtocol.readString(gameVer.newBuffer),
      version = MineProtocol.readString(branding.newBuffer);
    this.protocolVer = protoVer.value;
    this.gameVersion = gameVer.value;
    this.branding = branding.value;
    this.version = version.value;
    return this;
  }
}
