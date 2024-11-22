import { Client } from "../src/client";
import { Server } from "../src/server";
import { TextOperation } from "../src/operation";

function otExample() {
  const server = new Server("");
  const client1 = new Client("user1", "");
  const client2 = new Client("user2", "");

  // 设置和之前一样...
  server.registerClient("user1");
  server.registerClient("user2");
  client1.setOnSend((op) => {
    console.log("客户端1发送:", op.getOperations());
    server.receiveOperation("user1", op);
  });
  client2.setOnSend((op) => {
    console.log("客户端2发送:", op.getOperations());
    server.receiveOperation("user2", op);
  });
  server.setOnBroadcast((op) => {
    console.log("服务器广播:", op.getOperations());
    if (op.getClientId() !== "user1") client1.receiveRemote(op);
    if (op.getClientId() !== "user2") client2.receiveRemote(op);
  });

  // 测试场景1: 基本插入
  console.log("\n=== 场景1: 基本插入 ===");
  logState(client1, client2, server);

  // 先插入 Hello
  const op1 = new TextOperation("user1").insert(0, "Hello");
  console.log('\n客户端1插入 "Hello"');
  client1.applyLocal(op1);
  logState(client1, client2, server);

  // 在 Hello 后面插入 World
  const op2 = new TextOperation("user2").insert(5, " World");
  console.log('\n客户端2插入 " World"');
  client2.applyLocal(op2);
  logState(client1, client2, server);

  // 测试场景2: 在文本中间插入
  console.log("\n=== 场景2: 在文本中间插入 ===");
  const op3 = new TextOperation("user1").insert(5, " Beautiful");
  console.log('\n客户端1在 Hello 和 World 之间插入 " Beautiful"');
  client1.applyLocal(op3);
  logState(client1, client2, server);

  // 测试场景3: 在文本末尾插入
  console.log("\n=== 场景3: 在文本末尾插入 ===");
  const op4 = new TextOperation("user2").insert(
    client2.getContent().length,
    "!"
  );
  console.log('\n客户端2在末尾插入 "!"');
  client2.applyLocal(op4);
  logState(client1, client2, server);

  // 最终状态
  console.log("\n=== 最终状态 ===");
  console.log("客户端1:", client1.getContent());
  console.log("客户端2:", client2.getContent());
  console.log("服务器:", server.getContent());
}

function logState(client1: Client, client2: Client, server: Server) {
  console.log("客户端1:", client1.getContent());
  console.log("客户端2:", client2.getContent());
  console.log("服务器:", server.getContent());
}

// 运行示例
console.log("开始运行OT协同编辑示例...\n");
otExample();
