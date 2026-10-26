# GitHub Pages 部署

在线地址：https://fanshou46-rgb.github.io/computer_see/

源码仓库：https://github.com/fanshou46-rgb/computer_see

本网站是纯静态网页，无需账号系统或后端。学习进度保存于当前浏览器的网站本地存储；在线地址与本地地址各自保存进度。

## 日常更新

将检查通过的代码推送到 `main`，`.github/workflows/pages.yml` 会安装锁定依赖、检查代码与规则、构建网站并发布。可在仓库 Actions 中查看 `Deploy Chinese Computer Lab` 的结果。仓库 Settings → Pages 的 Source 采用 GitHub Actions。

在线构建执行 `npm run build:pages`，资源前缀为 `/computer_see/`，输出到 `dist-pages/`。使用官方 Pages 上传和发布动作，只上传构建产物。无需把 `node_modules` 或本地 ZIP 上传到网站。

如果仓库改名，需同步修改 `build:pages` 的资源前缀、工作流体积检查参数、网站地图地址及本文地址，并重新验收。

## 本地使用与验收

开发要求 Node.js 22.13 或更新版本。

```text
npm ci
npm run check
npm run lint
npm test
npm run build
npm run size
npm run build:pages
node scripts/check-bundle-size.mjs dist-pages /computer_see/
node scripts/pages-smoke.mjs
```

`pages-smoke.mjs` 默认使用本机 Chrome，在严格的 `/computer_see/` 静态目录下验收生产构建；可通过 `BROWSER_EXECUTABLE` 指定浏览器。`LAB_SMOKE_BASE=/`、`LAB_SMOKE_DIST=dist` 可验收本地构建。`PAGES_BASE_URL` 可指定已发布的网站地址。

本地使用 `npm run build` 生成 `dist/`，双击“启动电脑实验室.cmd”。本地构建和在线构建分开放置。

## 来源

基于 [Yoosseph/pc-anatomy](https://github.com/Yoosseph/pc-anatomy) 制作，保留 MIT 许可证、作者信息、模型来源与原始技术引用。原项目远程保存为 `upstream`，当前发布仓库为 `origin`。
