import { TextOperation } from "./operation";
import { DocumentState } from "./types";

export class Document {
  private content: string;
  private version: number;
  private history: TextOperation[];

  constructor(initialContent: string = "") {
    this.content = initialContent;
    this.version = 0;
    this.history = [];
  }

  // 应用操作
  apply(operation: TextOperation): void {
    this.content = operation.apply(this.content);
    this.history.push(operation);
    this.version++;
  }

  // 获取当前内容
  getContent(): string {
    return this.content;
  }

  // 获取当前版本
  getVersion(): number {
    return this.version;
  }

  // 获取指定版本的操作
  getOperation(version: number): TextOperation | null {
    if (version < 0 || version >= this.history.length) {
      return null;
    }
    return this.history[version];
  }

  // 获取文档状态
  getState(): DocumentState {
    return {
      content: this.content,
      version: this.version,
    };
  }

  // 设置文档状态
  setState(state: DocumentState): void {
    this.content = state.content;
    this.version = state.version;
  }

  // 获取操作历史
  getHistory(): TextOperation[] {
    return [...this.history];
  }

  // 清空文档
  clear(): void {
    this.content = "";
    this.version = 0;
    this.history = [];
  }

  // 创建快照
  createSnapshot(): DocumentState {
    return {
      content: this.content,
      version: this.version,
    };
  }

  // 从快照恢复
  restoreSnapshot(snapshot: DocumentState): void {
    this.content = snapshot.content;
    this.version = snapshot.version;
    this.history = this.history.slice(0, snapshot.version);
  }
}
