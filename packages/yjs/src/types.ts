import { Item } from "./item";
import { VersionVector } from "./versionVector";

export interface Update {
  type: "insert" | "delete" | "batch";
  arrayName: string;
  index?: number;
  item?: Item;
  items?: Item[];
  origin: string;
  clock: number;
}

export interface BatchUpdate {
  arrays: Map<string, Item[]>;
  vector: VersionVector;
}

export interface DocState {
  arrays: { [key: string]: any[] };
  version: { [key: string]: number }; // 修改这里
}

export interface DocStats {
  arrayCount: number;
  itemCount: number;
  observerCount: number;
  version: VersionVector;
}
