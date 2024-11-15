import { Item } from "./item";
import { Timestamp } from "./timestamp";

class SkipListNode {
  item: Item;
  next: SkipListNode[];

  constructor(item: Item, level: number) {
    this.item = item;
    this.next = new Array(level).fill(null);
  }
}

export class SkipList {
  private head: SkipListNode;
  private level: number;
  private maxLevel: number;

  constructor(maxLevel: number = 16) {
    this.maxLevel = maxLevel;
    this.level = 1;
    // 创建头节点
    const dummyItem = new Item("", 0, null);
    this.head = new SkipListNode(dummyItem, maxLevel);
  }

  private randomLevel(): number {
    let level = 1;
    while (Math.random() < 0.5 && level < this.maxLevel) {
      level++;
    }
    return level;
  }

  insert(item: Item): void {
    const update = new Array(this.maxLevel).fill(null);
    let current = this.head;

    // 找到插入位置
    for (let i = this.level - 1; i >= 0; i--) {
      while (
        current.next[i] &&
        current.next[i].item.timestamp.compareTo(item.timestamp) < 0
      ) {
        current = current.next[i];
      }
      update[i] = current;
    }

    // 创建新节点
    const newLevel = this.randomLevel();
    const newNode = new SkipListNode(item, newLevel);

    // 更新指针
    for (let i = 0; i < newLevel; i++) {
      newNode.next[i] = update[i].next[i];
      update[i].next[i] = newNode;
    }

    if (newLevel > this.level) {
      this.level = newLevel;
    }
  }

  find(timestamp: Timestamp): Item | null {
    let current = this.head;

    for (let i = this.level - 1; i >= 0; i--) {
      while (
        current.next[i] &&
        current.next[i].item.timestamp.compareTo(timestamp) < 0
      ) {
        current = current.next[i];
      }
    }

    current = current.next[0];

    if (current && current.item.timestamp.compareTo(timestamp) === 0) {
      return current.item;
    }
    return null;
  }

  toArray(): Item[] {
    const result: Item[] = [];
    let current = this.head.next[0];
    while (current) {
      result.push(current.item);
      current = current.next[0];
    }
    return result;
  }
}
