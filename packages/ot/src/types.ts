import { TextOperation } from "./operation";

// 操作类型
export type OperationType = "insert" | "delete" | "retain";

// 基础操作接口
export interface BaseOperation {
  type: OperationType;
  position: number;
  content?: string;
  length?: number;
}

// 扩展操作接口
export interface OperationMeta {
  clientId: string;
  timestamp: number;
  version?: number;
}

// 文档状态
export interface DocumentState {
  content: string;
  version: number;
}

// 客户端状态
export interface ClientState {
  clientId: string;
  serverVersion: number;
  pendingOperations: TextOperation[];
}

// 服务端状态
export interface ServerState {
  content: string;
  version: number;
  history: TextOperation[];
}
