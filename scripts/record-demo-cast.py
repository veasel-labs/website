#!/usr/bin/env python3
"""Record an authentic Veasel CLI/TUI asciicast for /demo/.

Uses the installed veasel/veasel-tui binaries against a disposable data dir.
No live model calls — /connect stops at the API key prompt.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shutil
import socket
import subprocess
import tempfile
import time
from pathlib import Path

import pexpect

# Minimum-good terminal for Veasel Code TUI: footers are budgeted ≤72 cols so
# an 80-wide terminal still shows the quit cue (see tui/src/footer-hints.ts);
# rows < 30 force compact /help. Avoid 100-wide padding and sub-30 height.
WIDTH = 80
HEIGHT = 30
REPO = Path(__file__).resolve().parents[1]
# Prefer bare command names so the cast never embeds host home paths.
VEASEL = "veasel"
VEASEL_TUI = "veasel-tui"


def redact(text: str) -> str:
  """Strip host-absolute paths that would fail the no-/home/ cast gate."""
  text = re.sub(r"/home/[^\s\r\n\"']+", "~/…", text)
  text = re.sub(r"/tmp/veasel-demo-[^\s\r\n\"']+", "/tmp/veasel-demo-…", text)
  return text


class CastWriter:
  def __init__(self, version: str) -> None:
    self.t0 = time.monotonic()
    self.events: list[list] = []
    self.header = {
      "version": 2,
      "width": WIDTH,
      "height": HEIGHT,
      "timestamp": int(time.time()),
      "idle_time_limit": 1.5,
      "env": {"SHELL": "/bin/sh", "TERM": "xterm-256color"},
      "title": f"Veasel Code {version} — authentic CLI/TUI demo",
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


def parse_args() -> argparse.Namespace:
  release = json.loads(
    (REPO / "src" / "data" / "verified-release.json").read_text(
      encoding="utf-8"
    )
  )
  version = release["tag"].removeprefix("v")
  parser = argparse.ArgumentParser(description=__doc__)
  parser.add_argument("--version", default=version)
  parser.add_argument("--bin-dir", type=Path, required=True)
  parser.add_argument("--source-commit", default=release["source_commit"])
  parser.add_argument("--archive-sha256", required=True)
  return parser.parse_args()


def free_loopback_port() -> str:
  with socket.socket() as listener:
    listener.bind(("127.0.0.1", 0))
    return str(listener.getsockname()[1])


def run() -> None:
  args = parse_args()
  if not re.fullmatch(r"\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?", args.version):
    raise SystemExit("--version must be a semantic release version")
  if not re.fullmatch(r"[0-9a-f]{40}", args.source_commit):
    raise SystemExit("--source-commit must be a full lowercase Git commit")
  if not re.fullmatch(r"[0-9a-f]{64}", args.archive_sha256):
    raise SystemExit("--archive-sha256 must be a SHA-256 digest")

  data_dir = Path(tempfile.mkdtemp(prefix="veasel-demo-"))
  port = free_loopback_port()
  config_dir = data_dir / "config"
  home_dir = data_dir / "home"
  config_dir.mkdir()
  home_dir.mkdir()
  binary_dir = args.bin_dir.resolve()
  inherited_path = os.environ.get("PATH", os.defpath)
  env = {
    "PATH": f"{binary_dir}{os.pathsep}{inherited_path}",
    "HOME": str(home_dir),
    "XDG_CONFIG_HOME": str(config_dir),
    "LANG": os.environ.get("LANG", "C.UTF-8"),
    "TERM": "xterm-256color",
    "NO_COLOR": "1",
  }
  veasel_path = shutil.which(VEASEL, path=env["PATH"])
  tui_path = shutil.which(VEASEL_TUI, path=env["PATH"])
  if not veasel_path or Path(veasel_path).parent != binary_dir:
    raise SystemExit(f"--bin-dir must contain the veasel binary: {binary_dir}")
  if not tui_path or Path(tui_path).parent != binary_dir:
    raise SystemExit(f"--bin-dir must contain the veasel-tui binary: {binary_dir}")
  version_result = subprocess.run(
    [veasel_path, "--version"],
    check=True,
    capture_output=True,
    text=True,
    timeout=15,
  )
  if version_result.stdout.strip() != f"Veasel Code {args.version}":
    raise SystemExit(
      f"binary version mismatch: expected {args.version}, got {version_result.stdout.strip()}"
    )
  env.update(
    {
      "VEASEL_DATA_DIR": str(data_dir),
      "VEASEL_PORT": port,
    }
  )
  version = args.version
  out_cast = REPO / "public" / "demo" / f"veasel-{version}-demo.cast"
  out_meta = REPO / "public" / "demo" / "recording.meta.json"
  cast = CastWriter(version)
  cast.emit("# Veasel Code — authentic terminal demo\r\n")
  time.sleep(0.35)
  cast.emit(f"# Binary: {version} (verified release archive)\r\n")
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

  # Scripted TUI: /help → /mcp → OpenCode Go connect → quit at API key
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
  time.sleep(0.4)
  tui_keys("OpenCode Go\r", pause=0.04)
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

  out_cast.parent.mkdir(parents=True, exist_ok=True)
  lines = [json.dumps(cast.header, separators=(",", ": "))]
  for event in cast.events:
    lines.append(json.dumps(event, ensure_ascii=False, separators=(",", ": ")))
  raw = ("\n".join(lines) + "\n").encode("utf-8")
  out_cast.write_bytes(raw)
  sha = hashlib.sha256(raw).hexdigest()
  meta = {
    "schema": "veasel-terminal-demo-recording/v1",
    "title": "Veasel Code authentic CLI/TUI terminal demo",
    "disclaimer": (
      f"Asciicast built from real veasel/veasel-tui {version} output against a "
      "local loopback backend. Scripted keystrokes for /help, /mcp, and /connect. "
      "No live model calls and no benchmark scores."
    ),
    "veasel_version": version,
    "source_commit": args.source_commit,
    "source_archive_sha256": args.archive_sha256,
    "source_binary": (
      f"https://github.com/veasel-labs/veasel/releases/download/v{version}/veasel-Linux.tar.gz"
    ),
    "tooling": "asciicast v2 writer + pexpect; binaries from the SHA-256-verified release archive",
    "credential_policy": "isolated temporary HOME and XDG_CONFIG_HOME; provider API-key environment variables are not inherited",
    "flows": [
      "veasel --version",
      "veasel --help",
      "veasel serve (loopback)",
      "veasel mcp list",
      "veasel mcp --help",
      "veasel-tui: /help, /mcp, /connect OpenCode Go (stops at API key prompt), q quit",
    ],
    "cast_file": out_cast.name,
    "sha256": sha,
    "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    "event_count": len(cast.events),
  }
  out_meta.write_text(json.dumps(meta, indent=2) + "\n", encoding="utf-8")
  shutil.rmtree(data_dir, ignore_errors=True)
  shutil.rmtree(workdir, ignore_errors=True)
  print(f"wrote {out_cast} ({len(cast.events)} events)")
  print(f"wrote {out_meta}")
  print(f"sha256 {sha}")


if __name__ == "__main__":
  run()
