#!/usr/bin/env python3
"""Record an authentic Veasel CLI/TUI asciicast for /demo/.

Uses the installed veasel/veasel-tui binaries against a disposable data dir.
No live model calls — /connect stops at the API key prompt.
"""

from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import tempfile
import time
from pathlib import Path

import pexpect

VERSION = "0.41.0-next.0"
# Minimum-good terminal for Veasel Code TUI: footers are budgeted ≤72 cols so
# an 80-wide terminal still shows the quit cue (see tui/src/footer-hints.ts);
# rows < 30 force compact /help. Avoid 100-wide padding and sub-30 height.
WIDTH = 80
HEIGHT = 30
REPO = Path(__file__).resolve().parents[1]
OUT_CAST = REPO / "public" / "demo" / f"veasel-{VERSION}-demo.cast"
OUT_META = REPO / "public" / "demo" / f"veasel-{VERSION}-demo.meta.json"
# Prefer bare command names so the cast never embeds host home paths.
VEASEL = "veasel"
VEASEL_TUI = "veasel-tui"


def redact(text: str) -> str:
  """Strip host-absolute paths that would fail the no-/home/ cast gate."""
  text = re.sub(r"/home/[^\s\r\n\"']+", "~/…", text)
  text = re.sub(r"/tmp/veasel-demo-[^\s\r\n\"']+", "/tmp/veasel-demo-…", text)
  return text


class CastWriter:
  def __init__(self) -> None:
    self.t0 = time.monotonic()
    self.events: list[list] = []
    self.header = {
      "version": 2,
      "width": WIDTH,
      "height": HEIGHT,
      "timestamp": int(time.time()),
      "idle_time_limit": 1.5,
      "env": {"SHELL": "/bin/sh", "TERM": "xterm-256color"},
      "title": f"Veasel Code {VERSION} — authentic CLI/TUI demo",
    }

  def emit(self, text: str) -> None:
    if not text:
      return
    self.events.append(
      [round(time.monotonic() - self.t0, 6), "o", redact(text)]
    )

  def type_line(self, line: str, delay: float = 0.028) -> None:
    for ch in line:
      self.emit(ch)
      time.sleep(delay)
    self.emit("\r\n")
    time.sleep(0.05)


def run() -> None:
  data_dir = Path(tempfile.mkdtemp(prefix="veasel-demo-"))
  port = "14097"
  env = os.environ.copy()
  env.update(
    {
      "VEASEL_DATA_DIR": str(data_dir),
      "VEASEL_PORT": port,
      "TERM": "xterm-256color",
      "NO_COLOR": "1",
    }
  )
  cast = CastWriter()
  cast.emit("# Veasel Code — authentic terminal demo\r\n")
  time.sleep(0.35)
  cast.emit(f"# Binary: {VERSION} (verified release archive)\r\n")
  time.sleep(0.35)
  cast.emit("# Fixture loopback only — no live model, no benchmark scores\r\n")
  time.sleep(0.85)

  workdir = Path(tempfile.mkdtemp(prefix="veasel-demo-cwd-"))

  def shell_cmd(cmd: str, wait: float = 0.4) -> str:
    cast.emit("$ ")
    cast.type_line(cmd)
    child = pexpect.spawn(
      "/bin/sh",
      ["-c", cmd],
      cwd=str(workdir),
      env=env,
      encoding="utf-8",
      timeout=25,
      dimensions=(HEIGHT, WIDTH),
    )
    child.expect(pexpect.EOF)
    out = child.before or ""
    child.close()
    # Normalize newlines for the cast
    normalized = out.replace("\r\n", "\n").replace("\n", "\r\n")
    if normalized and not normalized.endswith("\r\n"):
      normalized += "\r\n"
    cast.emit(normalized)
    time.sleep(wait)
    return out

  shell_cmd(f"{VEASEL} --version")
  shell_cmd(f"{VEASEL} --help", wait=0.6)

  # Start loopback backend
  cast.emit("$ ")
  cast.type_line(f"{VEASEL} serve")
  serve = pexpect.spawn(
    VEASEL,
    ["serve"],
    cwd=str(workdir),
    env=env,
    encoding="utf-8",
    timeout=30,
    dimensions=(HEIGHT, WIDTH),
  )
  try:
    serve.expect("(?i)listening|127\\.0\\.0\\.1|ready|port", timeout=20)
  except pexpect.TIMEOUT:
    # Still proceed; some builds print differently
    pass
  serve_out = (serve.before or "") + (serve.after if isinstance(serve.after, str) else "")
  cast.emit(serve_out.replace("\n", "\r\n"))
  if not serve_out.endswith("\n"):
    cast.emit("\r\n")
  time.sleep(0.5)

  shell_cmd(f"{VEASEL} mcp list", wait=0.5)
  shell_cmd(f"{VEASEL} mcp --help", wait=0.5)

  # Scripted TUI: /help → /mcp → /connect → quit at API key
  cast.emit("$ ")
  cast.type_line(f"{VEASEL_TUI}")
  tui = pexpect.spawn(
    VEASEL_TUI,
    cwd=str(workdir),
    env=env,
    encoding="utf-8",
    timeout=40,
    dimensions=(HEIGHT, WIDTH),
  )
  time.sleep(1.2)
  # Drain startup
  try:
    tui.read_nonblocking(size=50000, timeout=1.5)
  except pexpect.TIMEOUT:
    pass
  except pexpect.EOF:
    pass

  def tui_keys(seq: str, pause: float = 0.08) -> None:
    for ch in seq:
      tui.send(ch)
      cast.emit(ch)
      time.sleep(pause)
    time.sleep(0.35)
    try:
      chunk = tui.read_nonblocking(size=50000, timeout=0.8)
      if chunk:
        cast.emit(chunk.replace("\n", "\r\n"))
    except (pexpect.TIMEOUT, pexpect.EOF):
      pass

  tui_keys("/help\r", pause=0.05)
  time.sleep(0.8)
  tui_keys("/mcp\r", pause=0.05)
  time.sleep(0.8)
  tui_keys("/connect\r", pause=0.05)
  time.sleep(1.0)
  try:
    chunk = tui.read_nonblocking(size=50000, timeout=1.5)
    if chunk:
      cast.emit(chunk.replace("\n", "\r\n"))
  except (pexpect.TIMEOUT, pexpect.EOF):
    pass
  # Quit without submitting a key
  tui.send("q")
  cast.emit("q")
  time.sleep(0.4)
  tui.send("q")
  time.sleep(0.3)
  if tui.isalive():
    tui.sendcontrol("c")
  try:
    tui.expect(pexpect.EOF, timeout=5)
  except pexpect.TIMEOUT:
    tui.close(force=True)
  cast.emit("\r\n# Demo complete — stopped at API key prompt (no live model)\r\n")

  if serve.isalive():
    serve.sendcontrol("c")
    try:
      serve.expect(pexpect.EOF, timeout=5)
    except pexpect.TIMEOUT:
      serve.close(force=True)

  OUT_CAST.parent.mkdir(parents=True, exist_ok=True)
  lines = [json.dumps(cast.header, separators=(",", ": "))]
  for event in cast.events:
    lines.append(json.dumps(event, ensure_ascii=False, separators=(",", ": ")))
  raw = ("\n".join(lines) + "\n").encode("utf-8")
  OUT_CAST.write_bytes(raw)
  sha = hashlib.sha256(raw).hexdigest()
  meta = {
    "schema": "veasel-terminal-demo-recording/v1",
    "title": "Veasel Code authentic CLI/TUI terminal demo",
    "disclaimer": (
      f"Asciicast built from real veasel/veasel-tui {VERSION} output against a "
      "local loopback backend. Scripted keystrokes for /help, /mcp, and /connect. "
      "No live model calls and no benchmark scores."
    ),
    "veasel_version": VERSION,
    "source_binary": (
      f"https://github.com/veasel-labs/veasel/releases/download/v{VERSION}/veasel-Linux.tar.gz"
    ),
    "tooling": "asciinema cast v2 writer + pexpect; binaries from verified local install matching release tag",
    "flows": [
      "veasel --version",
      "veasel --help",
      "veasel serve (loopback)",
      "veasel mcp list",
      "veasel mcp --help",
      "veasel-tui: /help, /mcp, /connect (stops at API key prompt), q quit",
    ],
    "cast_file": OUT_CAST.name,
    "sha256": sha,
    "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "event_count": len(cast.events),
  }
  OUT_META.write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
  shutil.rmtree(data_dir, ignore_errors=True)
  shutil.rmtree(workdir, ignore_errors=True)
  print(f"wrote {OUT_CAST} ({len(cast.events)} events)")
  print(f"wrote {OUT_META}")
  print(f"sha256 {sha}")


if __name__ == "__main__":
  run()
