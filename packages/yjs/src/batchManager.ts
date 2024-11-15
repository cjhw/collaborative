import { Item } from "./item";
import { YDoc } from "./yDoc";

export class BatchManager {
  private updates: Map<string, Set<Item>>;
  private batchTimeout: number;
  private timeoutId: NodeJS.Timeout | null;

  constructor(private doc: YDoc, batchTimeout = 50) {
    this.updates = new Map();
    this.batchTimeout = batchTimeout;
    this.timeoutId = null;
  }

  addUpdate(arrayName: string, item: Item): void {
    if (!this.updates.has(arrayName)) {
      this.updates.set(arrayName, new Set());
    }
    this.updates.get(arrayName)!.add(item);

    this.scheduleBatch();
  }

  private scheduleBatch(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      this.processBatch();
    }, this.batchTimeout);
  }

  private processBatch(): void {
    const arrays = new Map<string, Item[]>();

    this.updates.forEach((items, arrayName) => {
      arrays.set(arrayName, Array.from(items));
    });

    if (arrays.size > 0) {
      this.doc.applyBatchUpdate({
        arrays,
        vector: this.doc.getStateVector(),
      });
    }

    this.updates.clear();
    this.timeoutId = null;
  }

  clear(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    this.updates.clear();
    this.timeoutId = null;
  }
}
