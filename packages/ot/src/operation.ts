import { BaseOperation, OperationType, OperationMeta } from "./types";

export class TextOperation {
  private ops: BaseOperation[];
  private meta: OperationMeta;

  constructor(clientId: string) {
    // 修改构造函数，要求必须传入 clientId
    this.ops = [];
    this.meta = {
      clientId,
      timestamp: Date.now(),
    };
  }

  // 克隆操作
  clone(): TextOperation {
    const newOp = new TextOperation(this.meta.clientId);
    newOp.ops = [...this.ops];
    newOp.meta = { ...this.meta };
    return newOp;
  }

  // 从JSON创建TextOperation
  static fromJSON(json: any): TextOperation {
    const op = new TextOperation(json.meta.clientId);
    op.ops = json.ops;
    op.meta = json.meta;
    return op;
  }

  // 其他方法保持不变...
  insert(position: number, content: string): this {
    this.ops.push({
      type: "insert",
      position,
      content,
    });
    return this;
  }

  delete(position: number, length: number): this {
    this.ops.push({
      type: "delete",
      position,
      length,
    });
    return this;
  }

  retain(position: number, length: number): this {
    this.ops.push({
      type: "retain",
      position,
      length,
    });
    return this;
  }

  getOperations(): BaseOperation[] {
    return [...this.ops];
  }

  getMeta(): OperationMeta {
    return { ...this.meta };
  }

  setVersion(version: number): void {
    this.meta.version = version;
  }

  getClientId(): string {
    return this.meta.clientId;
  }

  // 应用操作到文本
  apply(content: string): string {
    let result = content;
    let offset = 0;

    for (const op of this.ops) {
      switch (op.type) {
        case "insert":
          result =
            result.slice(0, op.position + offset) +
            op.content +
            result.slice(op.position + offset);
          offset += op.content!.length;
          break;

        case "delete":
          result =
            result.slice(0, op.position + offset) +
            result.slice(op.position + offset + op.length!);
          offset -= op.length!;
          break;

        case "retain":
          // 保持不变,只移动位置
          break;
      }
    }

    return result;
  }

  // 判断操作是否为空
  isEmpty(): boolean {
    return this.ops.length === 0;
  }

  // 获取操作影响的长度
  length(): number {
    return this.ops.reduce((sum, op) => {
      switch (op.type) {
        case "insert":
          return sum + op.content!.length;
        case "delete":
        case "retain":
          return sum + op.length!;
        default:
          return sum;
      }
    }, 0);
  }

  // 转换为JSON
  toJSON() {
    return {
      ops: this.ops,
      meta: this.meta,
    };
  }
}
