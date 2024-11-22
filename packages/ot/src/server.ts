import { TextOperation } from "./operation";
import { Document } from "./document";
import { ServerState } from "./types";

export class Server {
  private document: Document;
  private clients: Map<string, number>;
  private operations: TextOperation[];
  private onBroadcast?: (operation: TextOperation) => void;

  constructor(initialContent: string = "") {
    this.document = new Document(initialContent);
    this.clients = new Map();
    this.operations = [];
  }

  setOnBroadcast(callback: (operation: TextOperation) => void): void {
    this.onBroadcast = callback;
  }

  receiveOperation(clientId: string, operation: TextOperation): void {
    // 应用操作到服务器文档
    this.document.apply(operation);
    this.operations.push(operation);

    // 广播给所有客户端
    if (this.onBroadcast) {
      this.onBroadcast(operation);
    }
  }

  registerClient(clientId: string): void {
    this.clients.set(clientId, 0);
  }

  getContent(): string {
    return this.document.getContent();
  }

  clear(): void {
    this.document = new Document("");
    this.clients.clear();
    this.operations = [];
  }
}
