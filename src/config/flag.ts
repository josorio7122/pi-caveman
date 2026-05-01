import {
  closeSync,
  constants,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  realpathSync,
  renameSync,
  statSync,
  unlinkSync,
  writeSync,
} from "node:fs";
import { homedir } from "node:os";
import { dirname, resolve, sep } from "node:path";

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

    // If the flag itself is a symlink, refuse — that's the clobber vector.
    try {
      const lstat = lstatSync(flagPath);
      if (lstat.isSymbolicLink()) {
        debug(`safeWriteFlag: flag path ${flagPath} is a symlink — refusing`);
        return;
      }
    } catch {
      // missing — fine, will create
    }

    const tmpPath = `${flagPath}.tmp.${process.pid}`;
    const flags = constants.O_CREAT | constants.O_WRONLY | constants.O_TRUNC | (constants.O_NOFOLLOW ?? 0);
    let fd: number;
    try {
      fd = openSync(tmpPath, flags, 0o600);
    } catch (e) {
      debug(`safeWriteFlag: open tmp failed: ${(e as Error).message}`);
      return;
    }
    try {
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
    return readFileSync(flagPath, "utf8").trim();
  } catch {
    return null;
  }
}
