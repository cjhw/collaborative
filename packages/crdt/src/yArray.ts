import { Item } from "./item";

export class YArray {
  private items: Item[];
  clientId: string;

  constructor(clientId: string) {
    this.items = [];
    this.clientId = clientId;
  }

  // 插入新项
  insert(index: number, item: Item): void {
    if (index < 0) {
      index = 0;
    }
    if (index > this.items.length) {
      index = this.items.length;
    }

    // 设置左右关系
    const left = index > 0 ? this.items[index - 1] : null;
    const right = index < this.items.length ? this.items[index] : null;

    item.left = left;
    item.right = right;

    if (left) {
      left.right = item;
      item.origin.add(left.id);
    }
    if (right) {
      right.left = item;
    }

    this.items.splice(index, 0, item);
  }

  // 删除指定位置的项
  delete(index: number): Item | null {
    if (index < 0 || index >= this.items.length) {
      return null;
    }

    const item = this.items[index];
    item.markDeleted();

    // 更新左右关系
    if (item.left) {
      item.left.right = item.right;
    }
    if (item.right) {
      item.right.left = item.left;
    }

    return item;
  }

  // 标记项为已删除
  markDeleted(item: Item): void {
    const existingItem = this.items.find((i) => i.id === item.id);
    if (existingItem) {
      existingItem.markDeleted();

      // 更新左右关系
      if (existingItem.left) {
        existingItem.left.right = existingItem.right;
      }
      if (existingItem.right) {
        existingItem.right.left = existingItem.left;
      }
    }
  }

  // 整合新项
  integrate(item: Item): void {
    // 如果项目已存在，直接返回
    if (this.items.some((i) => i.id === item.id)) {
      return;
    }

    let index = 0;
    while (index < this.items.length) {
      const current = this.items[index];
      const comparison = this.compareItemsStrict(item, current);
      if (comparison < 0) {
        break;
      }
      index++;
    }

    this.insert(index, item);
  }

  private compareItemsStrict(a: Item, b: Item): number {
    // 1. 首先比较时钟值
    const clockDiff = a.timestamp.clock - b.timestamp.clock;
    if (clockDiff !== 0) {
      return clockDiff;
    }

    // 2. 时钟值相同时，比较clientId（字典序）
    const clientIdCompare = a.timestamp.clientId.localeCompare(
      b.timestamp.clientId
    );
    if (clientIdCompare !== 0) {
      return clientIdCompare;
    }

    // 3. 如果还相同，比较内容（字典序）
    const contentA = String(a.content || "");
    const contentB = String(b.content || "");
    return contentA.localeCompare(contentB);
  }

  // 查找正确的插入位置
  private findInsertPosition(item: Item): number {
    for (let i = 0; i < this.items.length; i++) {
      const current = this.items[i];

      if (current.isConcurrent(item)) {
        if (this.compareItems(item, current) < 0) {
          return i;
        }
      } else if (item.origin.has(current.id)) {
        return i + 1;
      } else if (current.origin.has(item.id)) {
        return i;
      }
    }
    return this.items.length;
  }

  // 比较两个项的顺序
  private compareItems(a: Item, b: Item): number {
    // 首先比较时钟值
    if (a.timestamp.clock !== b.timestamp.clock) {
      return a.timestamp.clock - b.timestamp.clock;
    }

    // 时钟值相同时，比较客户端ID
    if (a.timestamp.clientId !== b.timestamp.clientId) {
      return a.timestamp.clientId.localeCompare(b.timestamp.clientId);
    }

    // 最后比较内容
    return (a.content?.toString() || "").localeCompare(
      b.content?.toString() || ""
    );
  }

  // 获取指定位置的项
  get(index: number): Item | null {
    if (index < 0 || index >= this.items.length) {
      return null;
    }
    return this.items[index];
  }

  // 获取数组长度
  length(): number {
    return this.items.filter((item) => !item.deleted).length;
  }

  // 获取原始数组长度（包括已删除的项）
  rawLength(): number {
    return this.items.length;
  }

  // 转换为普通数组
  toArray(): any[] {
    return this.items
      .filter((item) => !item.deleted)
      .map((item) => item.content);
  }

  // 获取所有项（包括已删除的）
  getItems(): Item[] {
    return [...this.items];
  }

  // 获取活动项（不包括已删除的）
  getActiveItems(): Item[] {
    return this.items.filter((item) => !item.deleted);
  }

  // 查找项的索引
  indexOf(item: Item): number {
    return this.items.findIndex((i) => i.id === item.id);
  }

  // 检查是否包含某项
  contains(item: Item): boolean {
    return this.items.some((i) => i.id === item.id);
  }

  // 清空数组
  clear(): void {
    this.items.forEach((item) => {
      item.markDeleted();
    });
    this.items = [];
  }

  // 克隆数组
  clone(): YArray {
    const newArray = new YArray(this.clientId);
    this.items.forEach((item) => {
      const clonedItem = new Item(
        item.timestamp.clientId,
        item.timestamp.clock,
        item.content
      );
      clonedItem.deleted = item.deleted;
      clonedItem.deletedAt = item.deletedAt;
      newArray.items.push(clonedItem);
    });
    return newArray;
  }

  // 遍历数组
  forEach(callback: (item: Item, index: number) => void): void {
    this.items.forEach((item, index) => {
      if (!item.deleted) {
        callback(item, index);
      }
    });
  }

  // 映射数组
  map<T>(callback: (item: Item, index: number) => T): T[] {
    return this.items
      .filter((item) => !item.deleted)
      .map((item, index) => callback(item, index));
  }

  // 过滤数组
  filter(callback: (item: Item, index: number) => boolean): Item[] {
    return this.items
      .filter((item) => !item.deleted)
      .filter((item, index) => callback(item, index));
  }

  // 查找项
  find(callback: (item: Item, index: number) => boolean): Item | undefined {
    return this.items
      .filter((item) => !item.deleted)
      .find((item, index) => callback(item, index));
  }

  // 获取数组的JSON表示
  toJSON(): any[] {
    return this.toArray();
  }
}
