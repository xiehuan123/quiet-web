# 构建说明

已验证环境为 Node.js 24.19.0 与 npm。依赖锁定在 `source/package-lock.json`。

```sh
cd source
npm ci
npm test -- --run
npm run compile
npm run build
```

正式构建位于 `source/.output/chrome-mv3/`。本项目交付时从该 production build 干净复制到根目录 `extension/`；`extension/` 不是开发服务器目录。可用以下命令核对或重新生成：

```sh
cd ..
mv extension .runtime/extension-backup
cp -R source/.output/chrome-mv3 extension
```

重新复制后必须在真实 Chrome 中从 `extension/` 加载并重跑验收，因为静态检查不能替代扩展安装、原生 action、DNR 和持久化行为。
