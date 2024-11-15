import { YArray } from "./yArray";
import { Item } from "./item";
import { VersionVector } from "./versionVector";
import { BatchManager } from "./batchManager";
import { GarbageCollector } from "./garbageCollector";
import { UpdateCompressor } from "./updateCompressor";
import { Update, BatchUpdate, DocState, DocStats } from "./types";
import { Timestamp } from "./timestamp";

export class YDoc {
  private arrays: Map<string, YArray>;
  private clientId: string;
  private versionVector: VersionVector;
  private observers: Set<(update: Update) => void>;
  private batchManager: BatchManager;
  private garbageCollector: GarbageCollector;

  constructor(clientId: string) {
    this.arrays = new Map();
    this.clientId = clientId;
    this.versionVector = new VersionVector();
    this.observers = new Set();
    this.batchManager = new BatchManager(this);
    this.garbageCollector = new GarbageCollector(this);

    this.garbageCollector.start();
  }

  insert(arrayName: string, index: number, content: any): Item {
    const array = this.getArray(arrayName);
    const currentClock = this.versionVector.getClock(this.clientId);
    const newClock = currentClock + 1;

    const item = new Item(this.clientId, newClock, content);

    array.insert(index, item);
    this.versionVector.update(this.clientId, newClock);

    const update: Update = {
      type: "insert",
      arrayName,
      index,
      item,
      origin: this.clientId,
      clock: newClock,
    };

    this.batchManager.addUpdate(arrayName, item);
    this.notifyObservers(update);

    return item;
  }

  delete(arrayName: string, index: number): Item | null {
    const array = this.getArray(arrayName);
    const item = array.delete(index);

    if (item) {
      const currentClock = this.versionVector.getClock(this.clientId);
      const newClock = currentClock + 1;
      this.versionVector.update(this.clientId, newClock);

      const update: Update = {
        type: "delete",
        arrayName,
        index,
        item,
        origin: this.clientId,
        clock: newClock,
      };

      this.batchManager.addUpdate(arrayName, item);
      this.notifyObservers(update);
    }

    return item;
  }

  receiveUpdate(update: Update): void {
    const timestamp = new Timestamp(update.origin, update.clock);

    if (this.versionVector.hasBeenApplied(timestamp)) {
      console.log("Update already applied, skipping");
      return;
    }

    const array = this.getArray(update.arrayName);

    if (update.type === "insert" && update.item) {
      array.integrate(update.item);
    } else if (update.type === "delete" && update.item) {
      array.markDeleted(update.item);
    } else if (update.type === "batch" && update.items) {
      update.items.forEach((item) => array.integrate(item));
    }

    this.versionVector.update(update.origin, update.clock);
    this.notifyObservers(update);
  }

  applyBatchUpdate(update: BatchUpdate): void {
    // 首先对items按照确定的顺序排序
    const sortedItems = Array.from(update.arrays.values())
      .flat()
      .sort((a, b) => {
        // 1. 比较时间戳
        const timestampCompare = a.timestamp.compareTo(b.timestamp);
        if (timestampCompare !== 0) return timestampCompare;

        // 2. 比较clientId
        const clientIdCompare = a.timestamp.clientId.localeCompare(
          b.timestamp.clientId
        );
        if (clientIdCompare !== 0) return clientIdCompare;

        // 3. 比较数组名称
        const arrayNameA = this.findArrayNameForItem(update.arrays, a);
        const arrayNameB = this.findArrayNameForItem(update.arrays, b);
        const arrayNameCompare = arrayNameA.localeCompare(arrayNameB);
        if (arrayNameCompare !== 0) return arrayNameCompare;

        // 4. 比较内容
        return String(a.content).localeCompare(String(b.content));
      });

    // 按顺序应用每个操作
    sortedItems.forEach((item) => {
      const arrayName = this.findArrayNameForItem(update.arrays, item);
      const array = this.getArray(arrayName);
      array.integrate(item);
    });

    // 更新版本向量
    if (update.vector) {
      this.versionVector = update.vector;
    }
  }

  private findArrayNameForItem(
    arrays: Map<string, Item[]>,
    item: Item
  ): string {
    for (const [arrayName, items] of arrays.entries()) {
      if (items.some((i) => i.id === item.id)) {
        return arrayName;
      }
    }
    return "";
  }
  async sync(otherDoc: YDoc): Promise<void> {
    const otherVector = otherDoc.getStateVector();

    if (this.versionVector.compare(otherVector) === "equal") {
      return;
    }

    const updates = this.getDiff(otherVector);
    const compressedUpdates = UpdateCompressor.compress(updates);

    const batchUpdate: BatchUpdate = {
      arrays: new Map(),
      vector: otherVector,
    };

    compressedUpdates.forEach((item) => {
      const arrayName = item.id.split(":")[0];
      if (!batchUpdate.arrays.has(arrayName)) {
        batchUpdate.arrays.set(arrayName, []);
      }
      batchUpdate.arrays.get(arrayName)!.push(item);
    });

    this.applyBatchUpdate(batchUpdate);
  }

  getDiff(otherVector: VersionVector): Item[] {
    const diff: Item[] = [];
    this.arrays.forEach((array) => {
      array.getItems().forEach((item) => {
        if (!otherVector.hasBeenApplied(item.timestamp)) {
          diff.push(item);
        }
      });
    });
    return diff;
  }

  getArray(name: string): YArray {
    if (!this.arrays.has(name)) {
      this.arrays.set(name, new YArray(this.clientId));
    }
    return this.arrays.get(name)!;
  }

  getAllArrays(): YArray[] {
    return Array.from(this.arrays.values());
  }

  getStateVector(): VersionVector {
    return this.versionVector.clone();
  }

  observe(callback: (update: Update) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  private notifyObservers(update: Update): void {
    this.observers.forEach((callback) => callback(update));
  }

  getState(): DocState {
    const arrays: { [key: string]: any[] } = {};
    this.arrays.forEach((array, name) => {
      arrays[name] = array.toArray();
    });
    return {
      arrays,
      version: this.versionVector.toJSON(), // 修改这里
    };
  }

  setState(state: DocState): void {
    this.clear();
    Object.entries(state.arrays).forEach(([arrayName, content]) => {
      content.forEach((item, index) => {
        this.insert(arrayName, index, item);
      });
    });
    // 修改这里
    this.versionVector = VersionVector.fromJSON(state.version);
  }

  clear(): void {
    this.arrays.clear();
    this.versionVector = new VersionVector();
    this.batchManager.clear();
    this.notifyObservers({
      type: "batch",
      arrayName: "*",
      origin: this.clientId,
      clock: this.versionVector.getClock(this.clientId),
    });
  }

  destroy(): void {
    this.garbageCollector.stop();
    this.batchManager.clear();
    this.observers.clear();
    this.clear();
  }

  clone(): YDoc {
    const newDoc = new YDoc(`${this.clientId}:clone`);
    newDoc.setState(this.getState());
    return newDoc;
  }

  getStats(): DocStats {
    let itemCount = 0;
    this.arrays.forEach((array) => {
      itemCount += array.getItems().length;
    });

    return {
      arrayCount: this.arrays.size,
      itemCount,
      observerCount: this.observers.size,
      version: this.versionVector.clone(),
    };
  }

  toJSON(): string {
    return JSON.stringify(this.getState());
  }

  static fromJSON(json: string, clientId: string): YDoc {
    const data = JSON.parse(json) as DocState;
    const doc = new YDoc(clientId);
    doc.setState(data);
    return doc;
  }

  // 添加 getter 方法
  getClientId(): string {
    return this.clientId;
  }
}
