export function isGatewayErrorContent(text: string): boolean {
  return /bad gateway|upstream connect error|502/i.test(text);
}
