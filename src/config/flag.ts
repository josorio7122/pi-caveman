import {
  closeSync,
  constants,
  fchmodSync,
  lstatSync,
  mkdirSync,
  openSync,
  readSync,
  realpathSync,
  renameSync,
  statSync,
  unlinkSync,
  writeSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve, sep } from "node:path";
import { isValidMode } from "./modes.js";

const MAX_FLAG_BYTES = 64;

const debug = (msg: string): void => {
  if (process.env.CAVEMAN_DEBUG === "1") process.stderr.write(`[caveman] ${msg}\n`);
};

function verifyDir(flagDir: string): boolean {
  let realFlagDir = flagDir;
  try {
    const lstat = lstatSync(flagDir);
    if (lstat.isSymbolicLink()) {
      realFlagDir = realpathSync(flagDir);
      const realStat = statSync(realFlagDir);
      if (!realStat.isDirectory()) {
        debug(`safeWriteFlag: symlink target ${realFlagDir} is not a directory`);
        return false;
      }
      if (typeof process.getuid === "function") {
        if (realStat.uid !== process.getuid()) {
          debug(`safeWriteFlag: symlink target ${realFlagDir} owned by uid ${realStat.uid}`);
          return false;
        }
      } else {
        const home = homedir();
        const normalizedReal = resolve(realFlagDir).toLowerCase();
        const normalizedHome = resolve(home).toLowerCase();
        if (normalizedReal !== normalizedHome && !normalizedReal.startsWith(normalizedHome + sep.toLowerCase())) {
          debug(`safeWriteFlag: symlink target ${normalizedReal} outside home ${normalizedHome}`);
          return false;
        }
      }
    }
  } catch (e) {
    debug(`safeWriteFlag: dir lstat failed: ${(e as Error).message}`);
    return false;
  }
  return true;
}

export function safeWriteFlag(flagPath: string, content: string): void {
  try {
    const flagDir = dirname(flagPath);
    mkdirSync(flagDir, { recursive: true });
    if (!verifyDir(flagDir)) return;

    try {
      const lstat = lstatSync(flagPath);
      if (lstat.isSymbolicLink()) {
        debug(`safeWriteFlag: flag path ${flagPath} is a symlink — refusing`);
        return;
      }
    } catch {
      // missing — fine, will create
    }

    const tmpPath = `${flagPath}.tmp.${process.pid}.${Date.now()}`;
    const flags = constants.O_CREAT | constants.O_WRONLY | constants.O_EXCL | (constants.O_NOFOLLOW ?? 0);
    let fd: number;
    try {
      fd = openSync(tmpPath, flags, 0o600);
    } catch (e) {
      debug(`safeWriteFlag: open tmp failed: ${(e as Error).message}`);
      return;
    }
    try {
      fchmodSync(fd, 0o600);
      writeSync(fd, content);
    } finally {
      closeSync(fd);
    }
    try {
      renameSync(tmpPath, flagPath);
    } catch (e) {
      debug(`safeWriteFlag: rename failed: ${(e as Error).message}`);
      try {
        unlinkSync(tmpPath);
      } catch {}
    }
  } catch (e) {
    debug(`safeWriteFlag: outer failed: ${(e as Error).message}`);
  }
}

export function readFlag(flagPath: string): string | null {
  try {
    // Refuse to follow a symlink at the flag path itself.
    const lstat = lstatSync(flagPath);
    if (lstat.isSymbolicLink()) {
      debug(`readFlag: ${flagPath} is a symlink — refusing`);
      return null;
    }
    if (!lstat.isFile()) return null;

    // Bounded read — no arbitrary-size pulls.
    const flags = constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0);
    const fd = openSync(flagPath, flags);
    try {
      const buf = Buffer.alloc(MAX_FLAG_BYTES + 1);
      const bytes = readSync(fd, buf, 0, MAX_FLAG_BYTES + 1, 0);
      if (bytes > MAX_FLAG_BYTES) {
        debug(`readFlag: content > ${MAX_FLAG_BYTES} bytes — refusing`);
        return null;
      }
      const content = buf.subarray(0, bytes).toString("utf8").trim();
      if (!isValidMode(content)) {
        debug(`readFlag: '${content}' not a valid mode — refusing`);
        return null;
      }
      return content;
    } finally {
      closeSync(fd);
    }
  } catch {
    return null;
  }
}
