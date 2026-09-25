#!/usr/bin/env python3
"""Create a Windows (default) or combined offline ZIP. Python 3; no extra packages."""
import argparse
import hashlib
import json
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / 'handover/FILE_MANIFEST.json'
SKIP_PARTS = {'.git', '.openai', '.sites-runtime', '.offline-cache', '.artifacts', '__pycache__', '.bin'}
SKIP_SUFFIXES = {'.zip', '.tgz', '.gz', '.xz', '.log', '.pyc'}

def files(target):
    for path in sorted(ROOT.rglob('*')):
        relative = path.relative_to(ROOT)
        if target == 'windows' and relative.parts[:2] == ('runtime', 'linux-x64'):
            continue
        if any(part in SKIP_PARTS for part in relative.parts):
            continue
        if path.name.startswith('.env') or path.suffix in SKIP_SUFFIXES:
            continue
        if path == MANIFEST or not path.is_file():
            continue
        if path.is_symlink():
            raise RuntimeError(f'Unexpected symlink: {relative}')
        yield path

def checksum(path):
    digest = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            digest.update(block)
    return digest.hexdigest()

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--target', choices=['windows', 'all'], default='windows')
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    filename = 'Combat_Robot_Arena_Windows_Offline_Codex.zip' if args.target == 'windows' else 'Combat_Robot_Arena_Offline_Codex.zip'
    output = (args.output or ROOT.parent / filename).resolve()
    if output == ROOT or ROOT in output.parents:
        raise SystemExit('Write the ZIP outside the project folder.')
    required = ['dist/index.html', 'node_modules/vite/package.json', 'runtime/windows-x64/node.exe',
                'node_modules/@esbuild/win32-x64/esbuild.exe',
                'node_modules/@rollup/rollup-win32-x64-msvc/rollup.win32-x64-msvc.node']
    if args.target == 'all':
        required.append('runtime/linux-x64/bin/node')
    for item in required:
        if not (ROOT / item).is_file():
            raise SystemExit(f'Missing offline package component: {item}')
    entries = list(files(args.target))
    manifest = {'format': 1, 'algorithm': 'sha256', 'target': args.target, 'scope': 'All ZIP files except this manifest; generated npm command shims excluded.',
                'files': [{'path': p.relative_to(ROOT).as_posix(), 'bytes': p.stat().st_size, 'sha256': checksum(p)} for p in entries]}
    MANIFEST.write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
    output.parent.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_DEFLATED, compresslevel=6, allowZip64=True) as archive:
        for path in entries + [MANIFEST]:
            archive.write(path, 'combat-robot-arena/' + path.relative_to(ROOT).as_posix())
    with zipfile.ZipFile(output) as archive:
        bad = archive.testzip()
        if bad:
            raise RuntimeError(f'ZIP CRC check failed: {bad}')
    info = {'zip': str(output), 'target': args.target, 'files': len(entries) + 1, 'bytes': output.stat().st_size,
            'uncompressedBytes': sum(p.stat().st_size for p in entries) + MANIFEST.stat().st_size, 'sha256': checksum(output)}
    output.with_suffix('.sha256').write_text(f'{info["sha256"]}  {output.name}\n', encoding='utf-8')
    print(json.dumps(info, indent=2))

if __name__ == '__main__':
    main()
