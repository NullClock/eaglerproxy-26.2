import { Enums } from "../Enums.js";
import Packet from "../Packet.js";

export default class CSReadyPacketV5 implements Packet {
  packetId: Enums.PacketId = Enums.PacketId.CSReadyPacketV5;
  type: "packet" = "packet";
  boundTo = Enums.PacketBounds.S;
  sentAfterHandshake = false;

  public serialize() {
    return Buffer.from([this.packetId]);
  }

  public deserialize(packet: Buffer) {
    if (packet[0] != this.packetId)
      throw TypeError("Invalid packet ID detected!");
    return this;
  }
}