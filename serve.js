const http = require("http");
const fs = require("fs");
const path = require("path");

const port = 8000;
const root = __dirname;

const contentTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const relativePath = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const fullPath = path.resolve(root, relativePath);

  if (!fullPath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(fullPath, (error, buffer) => {
    if (error) {
      res.writeHead(error.code === "ENOENT" ? 404 : 500, {
        "Content-Type": "text/plain; charset=utf-8",
      });
      res.end(error.code === "ENOENT" ? "Not Found" : "Internal Server Error");
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentTypes[path.extname(fullPath).toLowerCase()] || "application/octet-stream",
    });
    res.end(buffer);
  });
});

server.listen(port, () => {
  console.log(`Serving ${root} at http://localhost:${port}/`);
});
