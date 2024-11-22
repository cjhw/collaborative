import { Timestamp } from "./timestamp";

export class VersionVector {
  private versions: Map<string, number>;

  constructor(versions?: Map<string, number>) {
    this.versions = new Map(versions || []);
  }

  getClock(clientId: string): number {
    return this.versions.get(clientId) || 0;
  }

  update(clientId: string, clock: number): void {
    const currentClock = this.getClock(clientId);
    if (clock > currentClock) {
      this.versions.set(clientId, clock);
    }
  }

  hasBeenApplied(timestamp: Timestamp): boolean {
    const currentClock = this.getClock(timestamp.clientId);
    return timestamp.clock <= currentClock;
  }

  merge(other: VersionVector): void {
    other.versions.forEach((clock, clientId) => {
      this.update(clientId, clock);
    });
  }

  clone(): VersionVector {
    const newVector = new VersionVector();
    this.versions.forEach((clock, clientId) => {
      newVector.versions.set(clientId, clock);
    });
    return newVector;
  }

  compare(other: VersionVector): "equal" | "greater" | "less" | "concurrent" {
    let greater = false;
    let less = false;

    this.versions.forEach((clock, clientId) => {
      const otherClock = other.getClock(clientId);
      if (clock > otherClock) greater = true;
      if (clock < otherClock) less = true;
    });

    other.versions.forEach((clock, clientId) => {
      const thisClock = this.getClock(clientId);
      if (clock > thisClock) less = true;
      if (clock < thisClock) greater = true;
    });

    if (greater && !less) return "greater";
    if (less && !greater) return "less";
    if (!less && !greater) return "equal";
    return "concurrent";
  }

  // 添加序列化方法
  toJSON(): { [key: string]: number } {
    const obj: { [key: string]: number } = {};
    this.versions.forEach((value, key) => {
      obj[key] = value;
    });
    return obj;
  }

  // 添加静态方法用于创建实例
  static fromJSON(json: { [key: string]: number }): VersionVector {
    const versions = new Map(Object.entries(json));
    return new VersionVector(versions);
  }
}
