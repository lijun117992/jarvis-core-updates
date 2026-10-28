"""Build a separately installed offline ASR trial from pinned upstream binaries.

No device access. Keeps original DEX/native bytes; changes only application identity,
label and caller visibility. The adapted APK is NOT signed by the upstream author.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

ROOT = Path(__file__).resolve().parents[1]
PACKAGE = 'com.jarvis.offlineinput'
UPSTREAM = 'https://github.com/notune/android_transcribe_app/releases/download/v0.2.3/android_transcribe_app_v0.2.3_fdroid.apk'
UPSTREAM_SHA = 'd407d76c286451013c6c2a879d1c9464854ef516061c05a8246083417650d608'
TOOL_URL = 'https://github.com/iBotPeaches/Apktool/releases/download/v3.0.3/apktool_3.0.3.jar'
TOOL_SHA = 'dbf930b076c6b9be08d57c449cacefc3bdd6b71ebd59b3066fc0e1f5b14f9423'
ANDROID = '{http://schemas.android.com/apk/res/android}'

def patch_manifest(text):
    ET.register_namespace('android', ANDROID[1:-1])
    root = ET.fromstring(text)
    assert root.get('package') == 'dev.notune.transcribe'
    root.set('package', PACKAGE)
    queries = root.find('queries')
    assert queries is not None
    ET.SubElement(queries, 'package', {ANDROID + 'name': 'org.autojs.autojs6'})
    app = root.find('application')
    app.set(ANDROID + 'label', 'Jarvis 离线听写（测试）')
    for node in root.iter():
        # Keep Java/JNI class paths unchanged; only app-owned identities change.
        if node.tag in ('permission', 'uses-permission'):
            value = node.get(ANDROID + 'name', '')
            if value == 'dev.notune.transcribe.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION':
                node.set(ANDROID + 'name', PACKAGE + '.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION')
        if node.tag == 'provider':
            value = node.get(ANDROID + 'authorities', '')
            node.set(ANDROID + 'authorities', value.replace('dev.notune.transcribe.', PACKAGE + '.'))
        if node.tag == 'activity' and node.get(ANDROID + 'name') == 'dev.notune.transcribe.MainActivity':
            node.set(ANDROID + 'label', 'Jarvis 离线听写（测试）')
    return ET.tostring(root, encoding='unicode', xml_declaration=True)

def run(*args):
    p = subprocess.run(list(map(str, args)), capture_output=True)
    if p.returncode:
        raise RuntimeError((p.stdout + p.stderr).decode('utf-8', errors='replace'))
    return p.stdout.decode('utf-8', errors='replace')

def fetch(url, path, sha):
    if not path.exists():
        with urllib.request.urlopen(url, timeout=60) as response:
            path.write_bytes(response.read())
    if hashlib.sha256(path.read_bytes()).hexdigest() != sha:
        raise RuntimeError('Pinned upstream/tool checksum mismatch: ' + path.name)

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--jdk', type=Path, required=True)
    p.add_argument('--sdk', type=Path, default=Path(os.environ.get('ANDROID_HOME', '')))
    p.add_argument('--keystore', type=Path, required=True)
    p.add_argument('--allow-create-preview-key', action='store_true')
    a = p.parse_args()
    work = ROOT / '.work/offline-adapter-v0.2'
    work.mkdir(parents=True, exist_ok=True)
    java, keytool = a.jdk / 'bin/java.exe', a.jdk / 'bin/keytool.exe'
    tools = a.sdk / 'build-tools/35.0.0'
    source, tool = work / 'upstream.apk', work / 'apktool.jar'
    fetch(UPSTREAM, source, UPSTREAM_SHA)
    fetch(TOOL_URL, tool, TOOL_SHA)
    decoded = work / 'decoded'
    if decoded.exists():
        raise RuntimeError('Build directory exists; use a reviewed fresh workspace, do not overwrite it.')
    run(java, '-jar', tool, 'd', '-s', source, '-o', decoded)
    manifest = decoded / 'AndroidManifest.xml'
    manifest.write_text(patch_manifest(manifest.read_text(encoding='utf-8')), encoding='utf-8')
    notices = decoded / 'assets/jarvis-adapter-notices'
    notices.mkdir(parents=True, exist_ok=True)
    for filename in ['OFFLINE_INPUT_LICENSE.txt', 'OFFLINE_INPUT_NOTICES.md']:
        (notices / filename).write_bytes((ROOT / 'docs' / filename).read_bytes())
    unsigned, aligned = work / 'unsigned.apk', work / 'aligned.apk'
    run(java, '-jar', tool, 'b', decoded, '-o', unsigned)
    run(tools / 'zipalign.exe', '-P', '16', '4', unsigned, aligned)
    if not a.keystore.exists():
        if not a.allow_create_preview_key:
            raise RuntimeError('Signing key missing; explicitly allow creating a private preview key.')
        a.keystore.parent.mkdir(parents=True, exist_ok=True)
        run(keytool, '-genkeypair', '-keystore', a.keystore, '-storetype', 'JKS',
            '-storepass', 'android', '-keypass', 'android', '-alias', 'offline-preview',
            '-keyalg', 'RSA', '-keysize', '3072', '-validity', '10000',
            '-dname', 'CN=Jarvis Offline Trial', '-noprompt')
    out = ROOT / 'dist/Jarvis-Offline-Input-v0.2-preview.apk'
    out.parent.mkdir(exist_ok=True)
    if out.exists():
        raise RuntimeError('Output already exists; never overwrite a release APK.')
    run(java, '-jar', tools / 'lib/apksigner.jar', 'sign', '--ks', a.keystore,
        '--ks-key-alias', 'offline-preview', '--ks-pass', 'pass:android',
        '--key-pass', 'pass:android', '--out', out, aligned)
    run(java, '-jar', tools / 'lib/apksigner.jar', 'verify', '--verbose', out)
    run(tools / 'zipalign.exe', '-c', '-P', '16', '4', out)
    with zipfile.ZipFile(source) as before, zipfile.ZipFile(out) as after:
        preserved = [n for n in before.namelist() if n.endswith('.dex') or n.startswith('lib/')]
        assert preserved
        for n in preserved:
            assert before.read(n) == after.read(n), n
    print(json.dumps({'apk': str(out), 'sha256': hashlib.sha256(out.read_bytes()).hexdigest(),
        'bytes': out.stat().st_size, 'package': PACKAGE,
        'preserved_dex_and_native': len(preserved), 'phone_tested': False}))

if __name__ == '__main__':
    main()
