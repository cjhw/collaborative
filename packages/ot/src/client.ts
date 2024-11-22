import { TextOperation } from "./operation";
import { Document } from "./document";

export class Client {
  private document: Document;
  private clientId: string;
  private onSend?: (operation: TextOperation) => void;

  constructor(clientId: string, initialContent: string = "") {
    this.document = new Document(initialContent);
    this.clientId = clientId;
  }

  setOnSend(callback: (operation: TextOperation) => void): void {
    this.onSend = callback;
  }

  applyLocal(operation: TextOperation): void {
    // 应用本地操作
    this.document.apply(operation);

    // 发送到服务器
    if (this.onSend) {
      this.onSend(operation);
    }
  }

  receiveRemote(operation: TextOperation): void {
    // 直接应用远程操作
    this.document.apply(operation);
  }

  getContent(): string {
    return this.document.getContent();
  }

  getClientId(): string {
    return this.clientId;
  }
}
