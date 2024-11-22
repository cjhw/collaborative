import { YDoc } from "./yDoc";

export class GarbageCollector {
  private readonly maxAge: number;
  private readonly checkInterval: number;
  private intervalId: NodeJS.Timeout | null;

  constructor(
    private doc: YDoc,
    maxAge = 1000 * 60 * 60, // 1小时
    checkInterval = 1000 * 60 * 5 // 5分钟
  ) {
    this.maxAge = maxAge;
    this.checkInterval = checkInterval;
    this.intervalId = null;
  }

  start(): void {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.collect();
    }, this.checkInterval);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  collect(): void {
    const now = Date.now();
    const minTimestamp = now - this.maxAge;

    this.doc.getAllArrays().forEach((array) => {
      const items = array.getItems().filter((item) => {
        return (
          !item.deleted || !item.deletedAt || item.deletedAt > minTimestamp
        );
      });
      array.clear();
      items.forEach((item, index) => array.insert(index, item));
    });
  }
}
