interface ProtocolHandlerScope {
  __parktrackProtocolHandlers?: readonly string[];
}

/**
 * Browsers do not expose a general API for probing native URL handlers.
 * A trusted native shell may explicitly publish the handlers it registered;
 * otherwise the capability remains unavailable and the unsafe option is hidden.
 */
export function isProtocolHandlerAvailable(
  protocol: string,
  scope: ProtocolHandlerScope = globalThis as ProtocolHandlerScope,
): boolean {
  return scope.__parktrackProtocolHandlers?.includes(protocol) === true;
}

export function isYandexNavigatorAvailable(
  scope: ProtocolHandlerScope = globalThis as ProtocolHandlerScope,
): boolean {
  return isProtocolHandlerAvailable('yandexnavi', scope);
}
