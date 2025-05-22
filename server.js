const { createServer } = require("http");
const next = require("next");

const app = next({ dev: true });
const handle = app.getRequestHandler();

const PORT = 3000;

app.prepare().then(() => {
  createServer((req, res) => {
    handle(req, res);
  }).listen(PORT, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${PORT}`);
  });
});
