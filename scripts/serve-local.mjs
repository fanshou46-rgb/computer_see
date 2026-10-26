import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
const workspace = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const root = path.join(workspace, 'dist');
const pkg = JSON.parse(
  fs.readFileSync(path.join(workspace, 'package.json'), 'utf8'),
);
if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error('找不到成品页面。请先在项目目录执行 npm ci 和 npm run build。');
  process.exit(1);
}
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
};
const server = http.createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.writeHead(405);
    res.end();
    return;
  }
  try {
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/__lab_meta') {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ app: 'computer-lab', version: pkg.version }));
      return;
    }
    const decoded = decodeURIComponent(url.pathname),
      file = path.resolve(
        root,
        '.' + (decoded === '/' ? '/index.html' : decoded),
      );
    if (
      !file.startsWith(root + path.sep) ||
      !fs.existsSync(file) ||
      !fs.statSync(file).isFile()
    ) {
      res.writeHead(404);
      res.end('Not found');
      return;
    }
    res.setHeader(
      'Content-Type',
      types[path.extname(file)] ?? 'application/octet-stream',
    );
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    if (req.method === 'HEAD') {
      res.end();
      return;
    }
    fs.createReadStream(file).pipe(res);
  } catch {
    res.writeHead(400);
    res.end('Bad request');
  }
});
const port = Number(process.env.PORT ?? 4173);
server.on('error', async (error) => {
  if (error.code === 'EADDRINUSE') {
    try {
      const info = await fetch(`http://127.0.0.1:${port}/__lab_meta`).then(
        (r) => r.json(),
      );
      if (info.app === 'computer-lab') {
        console.log(
          `电脑构造实验室已在运行： http://127.0.0.1:${port}/ （${info.version}）`,
        );
        openBrowser();
        return;
      }
    } catch {}
    console.error(`端口 ${port} 被其他程序占用。可设置 PORT 后重新启动。`);
  } else console.error(error.message);
  process.exitCode = 1;
});
function openBrowser() {
  if (process.argv.includes('--no-open')) return;
  const url = `http://127.0.0.1:${port}/`;
  if (process.platform === 'win32')
    execFile('rundll32.exe', ['url.dll,FileProtocolHandler', url]);
  else console.log('请在浏览器打开上面的本地地址。');
}
server.listen(port, '127.0.0.1', () => {
  console.log(
    `\n电脑构造实验室 v${pkg.version}\nhttp://127.0.0.1:${port}/\n\n保持此窗口打开。按 Ctrl+C 关闭服务。\n学习进度保存在当前浏览器中。\n`,
  );
  openBrowser();
});
