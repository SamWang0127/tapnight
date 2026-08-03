import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the TapNight one-tap entry", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>TapNight｜一碰入夜<\/title>/i);
  assert.match(html, /一碰入夜，Sam。/);
  assert.match(html, /aria-label="一碰入夜"/);
  assert.match(html, /NFC · 20m/);
  assert.match(html, /上海实时喝酒热力地图/);
  assert.doesNotMatch(html, /codex-preview|Your site is taking shape/i);
});

test("keeps the one-tap flow explicit and mobile-ready", async () => {
  const [page, css, layout] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(page, /TAP TO NIGHT · NFC READY/);
  assert.match(page, /到店打卡/);
  assert.match(page, /记录路线/);
  assert.match(page, /打开酒单/);
  assert.match(page, /NFC \+ GPS 20m/);
  assert.match(page, /distanceInMeters/);
  assert.match(css, /\.tap-entry-button/);
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.match(layout, /TapNight｜一碰入夜/);
});
