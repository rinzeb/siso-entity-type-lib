export function toBigInt(value: number): bigint {
  if (!Number.isSafeInteger(value)) {
    throw new Error("Number exceeds safe integer range");
  }
  return BigInt(value);
}

export function toNumber(value: bigint): number {
  const num = Number(value);
  if (!Number.isSafeInteger(num)) {
    throw new Error("BigInt exceeds safe integer range");
  }
  return num;
}
