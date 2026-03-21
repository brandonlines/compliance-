import { createReadStream, existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";

const port = Number(process.env.PORT || 3000);
const basePath = "/compliance-";
const root = path.join(process.cwd(), "out");

const contentTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "application/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".svg", "image/svg+xml"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".ico", "image/x-icon"],
  [".txt", "text/plain; charset=utf-8"]
]);

function sendFile(res, filePath) {
  const ext = path.extname(filePath);
  res.writeHead(200, {
    "Content-Type": contentTypes.get(ext) ?? "application/octet-stream"
  });
  createReadStream(filePath).pipe(res);
}

function resolveFile(urlPath) {
  if (urlPath === "/" || urlPath === "") {
    return path.join(root, "index.html");
  }

  const relativePath = urlPath.replace(/^\/+/, "");
  const directPath = path.join(root, relativePath);

  if (existsSync(directPath) && statSync(directPath).isFile()) {
    return directPath;
  }

  const indexPath = path.join(root, relativePath, "index.html");

  if (existsSync(indexPath)) {
    return indexPath;
  }

  return null;
}

const server = http.createServer(async (req, res) => {
  const requestPath = new URL(req.url ?? "/", `http://${req.headers.host}`).pathname;

  if (requestPath === "/") {
    res.writeHead(302, { Location: `${basePath}/` });
    res.end();
    return;
  }

  if (!requestPath.startsWith(basePath)) {
    res.writeHead(404);
    res.end("Not found");
    return;
  }

  const strippedPath = requestPath.slice(basePath.length) || "/";
  const filePath = resolveFile(strippedPath);

  if (filePath) {
    sendFile(res, filePath);
    return;
  }

  const notFoundPath = path.join(root, "404.html");

  if (existsSync(notFoundPath)) {
    res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
    res.end(await readFile(notFoundPath, "utf8"));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(port, () => {
  console.log(`Previewing GitHub Pages build at http://localhost:${port}${basePath}/`);
});
