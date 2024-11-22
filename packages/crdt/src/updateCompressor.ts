import { Item } from "./item";

export class UpdateCompressor {
  static compress(updates: Item[]): Item[] {
    const compressed: Item[] = [];
    const operations = new Map<string, Item>();

    updates.forEach((update) => {
      const key = `${update.left?.id}:${update.right?.id}`;

      if (operations.has(key)) {
        const existing = operations.get(key)!;
        if (update.timestamp.clock > existing.timestamp.clock) {
          operations.set(key, update);
        }
      } else {
        operations.set(key, update);
      }
    });

    return Array.from(operations.values());
  }
}
