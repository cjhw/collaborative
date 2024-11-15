import { YDoc } from "../src/yDoc";

async function conflictResolutionExample() {
  console.log("=== 协同编辑冲突解决示例 ===\n");

  // 1. 创建三个协同文档实例
  const doc1 = new YDoc("user1");
  const doc2 = new YDoc("user2");
  const doc3 = new YDoc("user3");

  // 2. 设置文档更新监听和网络模拟
  function setupNetwork(docs: YDoc[]) {
    docs.forEach((source) => {
      source.observe((update) => {
        console.log(`${source.getClientId()} 更新:`, {
          类型: update.type,
          数组: update.arrayName,
          位置: update.index,
          内容: update.item?.content,
          来源: update.origin,
        });

        // 模拟网络延迟传播到其他文档
        docs.forEach((target) => {
          if (target !== source) {
            setTimeout(() => {
              target.receiveUpdate(update);
            }, 100); // 随机延迟50-150ms
          }
        });
      });
    });
  }

  setupNetwork([doc1, doc2, doc3]);

  // 3. 场景一：同一位置的并发插入
  console.log("\n=== 场景一：同一位置的并发插入 ===");
  console.log("三个用户同时在位置0插入不同的内容");

  doc1.insert("text", 0, "你好");
  doc2.insert("text", 0, "Hello");
  doc3.insert("text", 0, "Bonjour");

  // 等待同步
  await new Promise((resolve) => setTimeout(resolve, 300));

  console.log("\n最终内容:");
  console.log("Doc1:", doc1.getArray("text").toArray());
  console.log("Doc2:", doc2.getArray("text").toArray());
  console.log("Doc3:", doc3.getArray("text").toArray());

  // 4. 场景二：并发编辑相邻位置
  console.log("\n=== 场景二：并发编辑相邻位置 ===");
  console.log("两个用户同时在相邻位置编辑");

  doc1.insert("list", 0, "第一项");
  doc1.insert("list", 1, "第二项");

  // 模拟网络延迟，doc2在还没收到doc1的更新时进行编辑
  setTimeout(() => {
    doc2.insert("list", 0, "插入项A");
    doc2.insert("list", 1, "插入项B");
  }, 50);

  await new Promise((resolve) => setTimeout(resolve, 300));

  console.log("\n最终内容:");
  console.log("Doc1:", doc1.getArray("list").toArray());
  console.log("Doc2:", doc2.getArray("list").toArray());

  // 5. 场景三：并发的删除和编辑
  console.log("\n=== 场景三：并发的删除和编辑 ===");
  console.log("一个用户删除内容，同时另一个用户编辑该内容");

  doc1.insert("notes", 0, "重要笔记");
  await new Promise((resolve) => setTimeout(resolve, 100));

  // 同时进行删除和编辑操作
  setTimeout(() => {
    doc1.delete("notes", 0); // user1 删除笔记
  }, 50);

  setTimeout(() => {
    doc2.insert("notes", 1, " - 补充内容"); // user2 尝试编辑
  }, 50);

  await new Promise((resolve) => setTimeout(resolve, 300));

  console.log("\n最终内容:");
  console.log("Doc1:", doc1.getArray("notes").toArray());
  console.log("Doc2:", doc2.getArray("notes").toArray());

  // 6. 场景四：批量操作冲突
  console.log("\n=== 场景四：批量操作冲突 ===");
  console.log("两个用户同时进行多个操作");

  // 用户1批量添加项目
  for (let i = 0; i < 3; i++) {
    doc1.insert("tasks", i, `任务${i + 1}`);
  }

  // 用户2同时进行不同的批量操作
  setTimeout(() => {
    for (let i = 0; i < 3; i++) {
      doc2.insert("tasks", 0, `优先任务${i + 1}`);
    }
  }, 50);

  await new Promise((resolve) => setTimeout(resolve, 300));

  console.log("\n最终内容:");
  console.log("Doc1:", doc1.getArray("tasks").toArray());
  console.log("Doc2:", doc2.getArray("tasks").toArray());

  // 7. 场景五：离线编辑后同步
  console.log("\n=== 场景五：离线编辑后同步 ===");

  // doc3进行"离线"编辑
  const offlineDoc = new YDoc("offline-user");
  offlineDoc.insert("offline", 0, "离线编辑1");
  offlineDoc.insert("offline", 1, "离线编辑2");

  // 其他用户同时进行在线编辑
  doc1.insert("offline", 0, "在线编辑A");
  doc2.insert("offline", 0, "在线编辑B");

  await new Promise((resolve) => setTimeout(resolve, 200));

  // 模拟离线文档重新上线
  console.log("\n离线文档同步中...");
  await doc1.sync(offlineDoc);
  await doc2.sync(offlineDoc);
  await doc3.sync(offlineDoc);

  console.log("\n同步后的最终内容:");
  console.log("Doc1:", doc1.getArray("offline").toArray());
  console.log("Doc2:", doc2.getArray("offline").toArray());
  console.log("Doc3:", doc3.getArray("offline").toArray());

  // 8. 获取最终的文档统计
  console.log("\n=== 文档最终统计 ===");
  const stats = doc1.getStats();
  console.log("统计信息:", {
    数组数量: stats.arrayCount,
    项目总数: stats.itemCount,
    观察者数量: stats.observerCount,
  });

  // 9. 清理资源
  console.log("\n=== 清理资源 ===");
  [doc1, doc2, doc3, offlineDoc].forEach((doc) => doc.destroy());
  console.log("所有文档资源已清理");
}

// 运行示例
conflictResolutionExample().catch(console.error);
