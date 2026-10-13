import { NETWORK_VERSION, VANILLA_PROTOCOL_VERSION } from "../../meta.js";
import { Enums } from "../Enums.js";
import Packet from "../Packet.js";
import { MineProtocol } from "../Protocol.js";

export default class CSIdentifyPacketV5 implements Packet {
  packetId: Enums.PacketId = Enums.PacketId.CSIdentifyPacketV5;
  type: "packet" = "packet";
  boundTo = Enums.PacketBounds.S;
  sentAfterHandshake = false;

  // Client sends list of supported Eaglercraft protocol versions and Minecraft protocol versions
  supportedEaglerProtocols: number[] = [5, 4, 3, 2];
  supportedMcProtocols: number[] = [776, 775, 774, 773, 772, 771, 770, 769, 768, 767, 766, 765, 764, 763, 762, 761, 760];
  brand: string = "";
  version: string = "";

  public serialize() {
    // Not used for server->client
    return Buffer.alloc(0);
  }

  public deserialize(packet: Buffer) {
    if (packet[0] != this.packetId)
      throw TypeError("Invalid packet ID detected!");
    
    packet = packet.subarray(1);
    
    // Read supported Eaglercraft protocol versions (count + list of shorts)
    let fard = MineProtocol.readShort(packet);
    let fv = Math.min(16, fard.value); // Max 16 protocols
    const eaglerProtocols: number[] = [];
    for (let i = 0; i < fv; i++) {
      fard = MineProtocol.readShort(fard.newBuffer);
      eaglerProtocols.push(fard.value);
    }
    this.supportedEaglerProtocols = eaglerProtocols;
    
    // Read supported Minecraft protocol versions (count + list of shorts)
    fard = MineProtocol.readShort(fard.newBuffer);
    fv = Math.min(32, fard.value); // Max 32 protocols
    const mcProtocols: number[] = [];
    for (let i = 0; i < fv; i++) {
      fard = MineProtocol.readShort(fard.newBuffer);
      mcProtocols.push(fard.value);
    }
    this.supportedMcProtocols = mcProtocols;
    
    // Read brand and version strings
    const brand = MineProtocol.readString(fard.newBuffer),
      version = MineProtocol.readString(brand.newBuffer);
    this.brand = brand.value;
    this.version = version.value;
    
    return this;
  }
  
  // Helper to select the best protocol version
  selectBestProtocol(): { eaglerProtocol: number; mcProtocol: number } {
    // Server prefers V5 (5), then V4 (4), etc.
    const preferredEagler = [5, 4, 3, 2];
    let selectedEagler = 5;
    for (const pref of preferredEagler) {
      if (this.supportedEaglerProtocols.includes(pref)) {
        selectedEagler = pref;
        break;
      }
    }
    
    // Select highest compatible Minecraft protocol
    let selectedMc = 776; // Default to 26.2
    for (const mc of this.supportedMcProtocols) {
      if (mc >= 776) {
        selectedMc = mc;
        break;
      }
    }
    
    return { eaglerProtocol: selectedEagler, mcProtocol: selectedMc };
  }
}