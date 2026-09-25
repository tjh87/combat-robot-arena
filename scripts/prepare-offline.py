"""Prepare pinned Windows/Linux x64 runtimes and native build packages. Requires internet."""
from pathlib import Path
import base64,hashlib,io,json,tarfile,urllib.request,zipfile
ROOT=Path(__file__).resolve().parents[1]
VERSION='v24.21.0'
BASE='https://nodejs.org/dist/'+VERSION+'/'
def get(url):
    with urllib.request.urlopen(url,timeout=120) as r:return r.read()
def digest(data):return hashlib.sha256(data).hexdigest()
def unpack_tar(data,dest,mode):
    with tarfile.open(fileobj=io.BytesIO(data),mode=mode) as archive:
        for item in archive.getmembers():
            parts=Path(item.name).parts[1:]
            if not parts:continue
            assert '..' not in parts
            target=dest/Path(*parts)
            if item.isdir():target.mkdir(parents=True,exist_ok=True)
            elif item.isfile():
                payload=archive.extractfile(item).read()
                assert len(payload)==item.size,item.name+' truncated in archive'
                target.parent.mkdir(parents=True,exist_ok=True)
                if target.is_symlink():target.unlink()
                target.write_bytes(payload);target.chmod(item.mode & 0o777)
                assert target.stat().st_size==item.size,item.name+' truncated on disk'
            elif item.issym():
                target.parent.mkdir(parents=True,exist_ok=True)
                assert (target.parent/item.linkname).resolve().is_relative_to(dest.resolve())
                if target.exists() or target.is_symlink():target.unlink()
                target.symlink_to(item.linkname)
            else:raise ValueError('Unsupported archive entry: '+item.name)

checks=get(BASE+'SHASUMS256.txt').decode()
expected={line.split()[1]:line.split()[0] for line in checks.splitlines() if line.strip()}
records=[]
for platform,suffix in [('windows-x64','win-x64.zip'),('linux-x64','linux-x64.tar.xz')]:
    name='node-'+VERSION+'-'+suffix
    print('Downloading '+name,flush=True)
    data=get(BASE+name)
    assert digest(data)==expected[name],name+' checksum mismatch'
    dest=ROOT/'runtime'/platform;dest.mkdir(parents=True,exist_ok=True)
    if suffix.endswith('.zip'):
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            for item in z.infolist():
                rel=Path(*Path(item.filename).parts[1:])
                if not str(rel) or str(rel)=='.':continue
                assert '..' not in rel.parts
                target=dest/rel
                if item.is_dir():target.mkdir(parents=True,exist_ok=True)
                else:target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(z.read(item))
    else:
        unpack_tar(data,dest,'r:xz')
    if platform=='linux-x64':
        for cli,target in [('npm','../lib/node_modules/npm/bin/npm-cli.js'),('npx','../lib/node_modules/npm/bin/npx-cli.js'),('corepack','../lib/node_modules/corepack/dist/corepack.js')]:
            p=dest/'bin'/cli
            if p.is_symlink():p.unlink()
            p.write_text('#!/bin/sh\nexec "$(dirname "$0")/node" "$(dirname "$0")/'+target+'" "$@"\n');p.chmod(0o755)
    records.append({'file':name,'source':BASE+name,'sha256':digest(data),'bytes':len(data),'target':str(dest.relative_to(ROOT))})
lock=json.loads((ROOT/'package-lock.json').read_text())['packages']
for name in ['@esbuild/win32-x64','@rollup/rollup-win32-x64-msvc','@rollup/rollup-win32-x64-gnu']:
    info=lock['node_modules/'+name]
    print('Downloading '+name+' '+info['version'],flush=True)
    data=get(info['resolved']);algorithm,value=info['integrity'].split('-',1)
    assert base64.b64encode(hashlib.new(algorithm,data).digest()).decode()==value,name+' integrity mismatch'
    dest=ROOT/'node_modules'/name;dest.mkdir(parents=True,exist_ok=True)
    unpack_tar(data,dest,'r:gz')
    records.append({'package':name,'version':info['version'],'source':info['resolved'],'sha256':digest(data),'integrity':info['integrity'],'bytes':len(data)})
(ROOT/'runtime'/'manifest.json').write_text(json.dumps({'node':VERSION,'downloadChecks':'Official Node SHA-256 list; npm lockfile SRI','files':records},indent=2)+'\n')
(ROOT/'runtime'/'SHASUMS256.txt').write_text(checks)
print('Offline runtimes and native packages are ready.',flush=True)
