#!/usr/bin/env node
// Installer: copies/symlinks skills/<name>/ into global skill dirs of supported harnesses.
// Zero dependencies. See DESIGN.md section 12.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const MARKER = '.git-skills.json';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SRC = path.join(ROOT, 'skills');
const PKG = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));

const home = os.homedir();
const env = process.env;
const HARNESS = {
  claude: {
    detect: path.join(env.CLAUDE_CONFIG_DIR || path.join(home, '.claude')),
    dir: path.join(env.CLAUDE_CONFIG_DIR || path.join(home, '.claude'), 'skills'),
  },
  cursor: {
    detect: path.join(home, '.cursor'),
    dir: path.join(home, '.cursor', 'skills'),
    seesOthers: ['claude', 'codex'], // Cursor also reads these dirs
  },
  codex: {
    detect: path.join(home, '.agents'),
    dir: path.join(home, '.agents', 'skills'),
    altDetect: env.CODEX_HOME || path.join(home, '.codex'),
  },
  opencode: {
    detect: path.join(env.XDG_CONFIG_HOME || path.join(home, '.config'), 'opencode'),
    dir: path.join(env.XDG_CONFIG_HOME || path.join(home, '.config'), 'opencode', 'skills'),
  },
};

const exists = (p) => { try { fs.lstatSync(p); return true; } catch { return false; } };
const isDir = (p) => { try { return fs.statSync(p).isDirectory(); } catch { return false; } };

function parseArgs(argv) {
  const o = { cmd: null, harness: null, skills: null, mode: 'copy', dry: false, force: false, help: false };
  const a = [...argv];
  while (a.length) {
    const x = a.shift();
    if (x === '--harness') o.harness = a.shift()?.split(',').filter(Boolean);
    else if (x === '--skills') o.skills = a.shift()?.split(',').filter(Boolean);
    else if (x === '--mode') o.mode = a.shift();
    else if (x === '--dry-run') o.dry = true;
    else if (x === '--force') o.force = true;
    else if (x === '-h' || x === '--help') o.help = true;
    else if (!o.cmd && !x.startsWith('-')) o.cmd = x;
    else die(`Unknown argument: ${x}`);
  }
  if (!['copy', 'symlink'].includes(o.mode)) die('--mode must be copy|symlink');
  return o;
}

function die(msg) { console.error(`error: ${msg}`); process.exit(1); }

const HELP = `git-skills ${PKG.version}
Usage: git-skills <install|update|uninstall|list> [options]
  --harness a,b   claude,cursor,codex,opencode (default: detected)
  --skills a,b    skill names (default: all)
  --mode M        copy (default) | symlink (git clone; update via git pull)
  --dry-run       print plan, change nothing
  --force         overwrite skill dirs not owned by git-skills (backed up to *.bak)
`;

function availableSkills() {
  if (!isDir(SRC)) return [];
  return fs.readdirSync(SRC).filter((n) => exists(path.join(SRC, n, 'SKILL.md')));
}

function pickHarnesses(o) {
  const all = Object.keys(HARNESS);
  if (o.harness) {
    const bad = o.harness.filter((h) => !all.includes(h));
    if (bad.length) die(`unknown harness: ${bad.join(',')}`);
    return o.harness;
  }
  const found = all.filter((h) => {
    const c = HARNESS[h];
    return isDir(c.detect) || (c.altDetect && isDir(c.altDetect));
  });
  return found;
}

function readMarker(dir) {
  try { return JSON.parse(fs.readFileSync(path.join(dir, MARKER), 'utf8')); } catch { return null; }
}

function rmTarget(p) { fs.rmSync(p, { recursive: true, force: true }); }

function owned(target) {
  if (!exists(target)) return false;
  // symlink installs: marker lives in the source dir; check link points into our package
  try {
    if (fs.lstatSync(target).isSymbolicLink()) return fs.realpathSync(target).startsWith(SRC + path.sep);
  } catch { return false; }
  return readMarker(target)?.package === PKG.name;
}

function installOne(h, name, o) {
  const src = path.join(SRC, name);
  const dest = path.join(HARNESS[h].dir, name);
  const tag = `${h}/${name}`;
  let backup = null;
  if (exists(dest)) {
    if (owned(dest)) {
      const m = readMarker(dest);
      if (m?.version === PKG.version && o.mode === 'copy' && !o.force && !fs.lstatSync(dest).isSymbolicLink()) {
        console.log(`= ${tag} up to date (${PKG.version})`); return;
      }
    } else if (!o.force) {
      console.log(`! ${tag} exists and is not managed by git-skills; skipped (use --force)`); return;
    } else backup = `${dest}.bak`;
  }
  console.log(`${o.dry ? '[dry] ' : ''}+ ${tag}: ${src} -> ${dest} (${o.mode})${backup ? ` [backup ${backup}]` : ''}`);
  if (o.dry) return;
  fs.mkdirSync(HARNESS[h].dir, { recursive: true });
  if (backup) { rmTarget(backup); fs.renameSync(dest, backup); }
  else if (exists(dest)) rmTarget(dest);
  if (o.mode === 'symlink') fs.symlinkSync(src, dest, 'dir');
  else {
    fs.cpSync(src, dest, { recursive: true });
    fs.writeFileSync(path.join(dest, MARKER), JSON.stringify({ package: PKG.name, version: PKG.version, installedAt: new Date().toISOString() }, null, 2) + '\n');
  }
}

function uninstallOne(h, name, o) {
  const dest = path.join(HARNESS[h].dir, name);
  if (!exists(dest)) return;
  if (!owned(dest)) { console.log(`! ${h}/${name} not managed by git-skills; left alone`); return; }
  console.log(`${o.dry ? '[dry] ' : ''}- ${h}/${name}: ${dest}`);
  if (!o.dry) rmTarget(dest);
}

function main() {
  const o = parseArgs(process.argv.slice(2));
  if (o.help || !o.cmd) { console.log(HELP); return; }
  const names = availableSkills();
  const harnesses = pickHarnesses(o);

  if (o.cmd === 'list') {
    for (const h of Object.keys(HARNESS)) {
      const dir = HARNESS[h].dir;
      const items = isDir(dir) ? fs.readdirSync(dir).filter((n) => owned(path.join(dir, n))) : [];
      const ver = (n) => readMarker(path.join(dir, n))?.version ?? 'symlink';
      console.log(`${h} (${dir}): ${items.length ? items.map((n) => `${n}@${ver(n)}`).join(', ') : '-'}`);
    }
    return;
  }
  if (!['install', 'update', 'uninstall'].includes(o.cmd)) die(`unknown command: ${o.cmd}`);

  if (!harnesses.length) die('no harness detected; pass --harness claude,cursor,codex,opencode');
  let sel = o.skills ?? names;
  if (o.cmd !== 'uninstall') {
    const bad = sel.filter((s) => !names.includes(s));
    if (bad.length) die(`unknown skill: ${bad.join(',')} (available: ${names.join(', ') || 'none'})`);
    if (!sel.length) die('no skills found in skills/');
  } else if (!o.skills) {
    sel = names; // uninstall: only packaged skills
  }

  // Cursor duplicate avoidance: skip cursor dir if another selected harness dir is visible to Cursor.
  let targets = harnesses;
  if (o.cmd !== 'uninstall' && !o.harness && harnesses.includes('cursor')) {
    const seen = HARNESS.cursor.seesOthers.filter((x) => harnesses.includes(x));
    if (seen.length) {
      console.log(`i cursor already reads ${seen.join(', ')} skills; skipping ~/.cursor/skills to avoid duplicates (force with --harness)`);
      targets = harnesses.filter((h) => h !== 'cursor');
    }
  } else if (o.harness && o.harness.includes('cursor') && o.harness.some((h) => HARNESS.cursor.seesOthers.includes(h))) {
    console.log('! warning: Cursor also reads the other selected dirs; duplicate skills possible');
  }

  for (const h of targets) for (const s of sel) {
    if (o.cmd === 'uninstall') uninstallOne(h, s, o); else installOne(h, s, o);
  }
}

main();
