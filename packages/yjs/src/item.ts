import { Timestamp } from "./timestamp";

export class Item {
  id: string;
  timestamp: Timestamp;
  content: any;
  deleted: boolean;
  left: Item | null;
  right: Item | null;
  origin: Set<string>;
  deletedBy?: string;
  deletedAt?: number;

  constructor(
    clientId: string,
    clock: number,
    content: any,
    left: Item | null = null,
    right: Item | null = null
  ) {
    this.timestamp = new Timestamp(clientId, clock);
    this.id = `${clientId}:${clock}`;
    this.content = content;
    this.deleted = false;
    this.left = left;
    this.right = right;
    this.origin = new Set();

    if (left) {
      this.origin.add(left.id);
    }
  }

  // 标记项为已删除
  markDeleted(clientId?: string): void {
    this.deleted = true;
    this.deletedAt = Date.now();
    if (clientId) {
      this.deletedBy = clientId;
    }
  }

  // 检查是否与另一个项并发
  isConcurrent(other: Item): boolean {
    return !this.origin.has(other.id) && !other.origin.has(this.id);
  }

  // 克隆项
  clone(): Item {
    const cloned = new Item(
      this.timestamp.clientId,
      this.timestamp.clock,
      this.content,
      this.left,
      this.right
    );
    cloned.deleted = this.deleted;
    cloned.deletedAt = this.deletedAt;
    cloned.deletedBy = this.deletedBy;
    cloned.origin = new Set(this.origin);
    return cloned;
  }

  // 添加依赖项
  addDependency(itemId: string): void {
    this.origin.add(itemId);
  }

  // 检查是否依赖于指定项
  dependsOn(itemId: string): boolean {
    return this.origin.has(itemId);
  }

  // 获取所有依赖项
  getDependencies(): string[] {
    return Array.from(this.origin);
  }

  // 比较两个项的顺序
  compareTo(other: Item): number {
    // 首先比较时间戳
    const timestampCompare = this.timestamp.compareTo(other.timestamp);
    if (timestampCompare !== 0) {
      return timestampCompare;
    }

    // 如果时间戳相同，比较clientId
    return this.timestamp.clientId.localeCompare(other.timestamp.clientId);
  }

  // 转换为JSON
  toJSON() {
    return {
      id: this.id,
      content: this.content,
      timestamp: {
        clientId: this.timestamp.clientId,
        clock: this.timestamp.clock,
      },
      deleted: this.deleted,
      deletedAt: this.deletedAt,
      deletedBy: this.deletedBy,
      origin: Array.from(this.origin),
    };
  }

  // 从JSON创建Item
  static fromJSON(json: any): Item {
    const item = new Item(
      json.timestamp.clientId,
      json.timestamp.clock,
      json.content
    );
    item.deleted = json.deleted;
    item.deletedAt = json.deletedAt;
    item.deletedBy = json.deletedBy;
    item.origin = new Set(json.origin);
    return item;
  }

  // 检查两个项是否相等
  equals(other: Item): boolean {
    return (
      this.id === other.id &&
      this.content === other.content &&
      this.deleted === other.deleted &&
      this.timestamp.equals(other.timestamp)
    );
  }
}
