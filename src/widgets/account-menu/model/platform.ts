export type MobilePlatform = 'android' | 'ios' | 'other';

export interface PlatformInfo {
  userAgentDataPlatform?: string;
  userAgent: string;
  maxTouchPoints: number;
}

export function detectMobilePlatform(info: PlatformInfo): MobilePlatform {
  const platform = info.userAgentDataPlatform?.toLowerCase() ?? '';
  const userAgent = info.userAgent.toLowerCase();
  if (platform.includes('android') || userAgent.includes('android')) return 'android';
  if (
    platform.includes('ios') ||
    /iphone|ipad|ipod/.test(userAgent) ||
    ((platform.includes('mac') || userAgent.includes('macintosh')) && info.maxTouchPoints > 1)
  ) {
    return 'ios';
  }
  return 'other';
}

export function currentMobilePlatform(): MobilePlatform {
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } };
  return detectMobilePlatform({
    ...(nav.userAgentData?.platform ? { userAgentDataPlatform: nav.userAgentData.platform } : {}),
    userAgent: nav.userAgent,
    maxTouchPoints: nav.maxTouchPoints ?? 0,
  });
}
