export function isGatewayErrorContent(text: string): boolean {
  return /bad gateway|upstream connect error|502|504|gateway time-?out|no available server|service unavailable/i.test(text);
}
