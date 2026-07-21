export function originForAddressSelection(
  currentOrigin: [number, number] | null,
  address: [number, number],
): [number, number] | null {
  return currentOrigin ? null : address;
}
