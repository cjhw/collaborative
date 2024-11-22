import { BaseOperation } from "./types";
import { TextOperation } from "./operation";

export class OperationTransform {
  static transform(
    op1: TextOperation,
    op2: TextOperation
  ): [TextOperation, TextOperation] {
    // 创建新的操作
    const newOp1 = new TextOperation(op1.getClientId());
    const newOp2 = new TextOperation(op2.getClientId());

    const o1 = op1.getOperations()[0]; // 获取第一个操作
    const o2 = op2.getOperations()[0]; // 获取第一个操作

    // 如果都是插入操作
    if (o1.type === "insert" && o2.type === "insert") {
      if (o1.position === o2.position) {
        // 在同一位置插入，使用 clientId 确定顺序
        if (op1.getClientId() < op2.getClientId()) {
          newOp1.insert(o1.position, o1.content!);
          newOp2.insert(o1.position + o1.content!.length, o2.content!);
        } else {
          newOp1.insert(o2.position + o2.content!.length, o1.content!);
          newOp2.insert(o2.position, o2.content!);
        }
      } else {
        // 不同位置插入，保持原位置
        newOp1.insert(o1.position, o1.content!);
        newOp2.insert(o2.position, o2.content!);
      }
    }

    return [newOp1, newOp2];
  }
}
