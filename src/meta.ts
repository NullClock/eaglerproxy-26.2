const f = Object.freeze;

// bridge meta
export const BRIDGE_VERSION: Readonly<number> = f(1);

// adapter meta
export const PROXY_BRANDING: Readonly<string> = f("EaglerProxy");
export const PROXY_VERSION: Readonly<string> = f("1.1.0");

// Eaglercraft 26.2 uses Eaglercraft WebSocket Extension Protocol V5
export const NETWORK_VERSION: Readonly<number> = f(5);
// Eaglercraft 26.2 connects to vanilla Minecraft 26.2 servers using protocol 776
export const VANILLA_PROTOCOL_VERSION: Readonly<number> = f(776);
