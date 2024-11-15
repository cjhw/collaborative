export class Timestamp {
  constructor(
    public readonly clientId: string,
    public readonly clock: number
  ) {}

  compareTo(other: Timestamp): number {
    // 首先按照时钟值比较
    if (this.clock !== other.clock) {
      return this.clock - other.clock;
    }
    // 时钟值相同时，按照 clientId 字典序比较
    return this.clientId.localeCompare(other.clientId);
  }

  equals(other: Timestamp): boolean {
    return this.clock === other.clock && this.clientId === other.clientId;
  }

  toString(): string {
    return `${this.clientId}:${this.clock}`;
  }
}
