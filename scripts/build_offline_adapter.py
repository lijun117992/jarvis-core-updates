"""Build a separately installed offline ASR trial from pinned upstream binaries.

No device access. Keeps native bytes, opens six optimized Activity hooks, and adds a transparent Activity
to reuse the successful foreground recording path. Not an upstream-signed APK.
"""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import shutil
import struct
import zlib
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

def activity_extension_dex(data):
    """R8 made the upstream callbacks final. Clear only their final modifier.

    Method bytecode/permission checks are untouched; header hashes are repaired.
    Refuse unexpected descriptors, method sets or variable-length flag changes.
    """
    out = bytearray(data)
    u32 = lambda offset: struct.unpack_from('<I', data, offset)[0]
    strings, types, methods, classes = u32(60), u32(68), u32(92), u32(100)
    def text(index):
        pos = u32(strings + index * 4)
        while data[pos] & 128: pos += 1
        pos += 1
        return data[pos:data.index(0, pos)].decode('utf-8', errors='strict')
    def leb(pos):
        value = shift = 0
        while True:
            char = data[pos]; pos += 1; value |= (char & 127) << shift
            if not char & 128: return value, pos
            shift += 7
    wanted = {'onCreate', 'onDestroy', 'onAutoStop', 'onAudioLevel', 'onStatusUpdate', 'onTextTranscribed'}
    found = set()
    for index in range(u32(96)):
        row = classes + index * 32
        if text(u32(types + u32(row) * 4)) != 'Ldev/notune/transcribe/RecognizeActivity;': continue
        assert not u32(row + 4) & 16, 'Unexpected final upstream Activity class'
        pos = u32(row + 24); sizes = []
        for _ in range(4): amount, pos = leb(pos); sizes.append(amount)
        for _ in range(sizes[0] + sizes[1]): _, pos = leb(pos); _, pos = leb(pos)
        for amount in sizes[2:]:
            method = 0
            for _ in range(amount):
                diff, pos = leb(pos); method += diff
                flag_pos = pos; flags, pos = leb(pos); _, pos = leb(pos)
                name = text(u32(methods + method * 8 + 4))
                if name in wanted:
                    found.add(name)
                    if flags & 16:
                        assert data[flag_pos] & 16
                        out[flag_pos] &= ~16
    assert found == wanted, ('Upstream callback ABI changed', found)
    out[12:32] = hashlib.sha1(out[32:]).digest()
    struct.pack_into('<I', out, 8, zlib.adler32(out[12:]) & 0xffffffff)
    return bytes(out)

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
    ET.SubElement(app, 'activity', {
        ANDROID + 'name': 'dev.notune.transcribe.QuietRecognizeActivity',
        ANDROID + 'exported': 'true', ANDROID + 'excludeFromRecents': 'true',
        ANDROID + 'permission': 'android.permission.RECORD_AUDIO',
        ANDROID + 'theme': '@style/JarvisQuietSpeech',
        ANDROID + 'configChanges': 'keyboardHidden|orientation|screenSize',
    })
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
    work = ROOT / '.work/offline-adapter-v0.4-build'
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
    original_dex = decoded / 'classes.dex'
    original_dex.write_bytes(activity_extension_dex(original_dex.read_bytes()))
    manifest = decoded / 'AndroidManifest.xml'
    manifest.write_text(patch_manifest(manifest.read_text(encoding='utf-8')), encoding='utf-8')
    metadata = decoded / 'apktool.yml'
    metadata.write_text(metadata.read_text(encoding='utf-8').replace('versionCode: 23', 'versionCode: 25')
                        .replace('versionName: 0.2.3', 'versionName: 0.2.3-jarvis0.4'), encoding='utf-8')
    theme = ET.Element('resources')
    style = ET.SubElement(theme, 'style', {'name': 'JarvisQuietSpeech', 'parent': '@style/AppTheme'})
    for key, value in {
        'android:windowIsTranslucent': 'true', 'android:windowIsFloating': 'false',
        'android:windowBackground': '@android:color/transparent',
        'android:windowNoTitle': 'true', 'android:backgroundDimEnabled': 'false',
        'android:windowDisablePreview': 'true', 'android:windowAnimationStyle': '@null',
        'android:windowSoftInputMode': 'stateAlwaysHidden',
    }.items():
        ET.SubElement(style, 'item', {'name': key}).text = value
    (decoded / 'res/values/jarvis_quiet.xml').write_text(ET.tostring(theme, encoding='unicode'), encoding='utf-8')
    # Compile only our added Activity. This stub is a compile-time ABI reference
    # to the preserved upstream DEX class, never packaged as a second definition.
    stub = work / 'stub/dev/notune/transcribe/RecognizeActivity.java'
    stub.parent.mkdir(parents=True, exist_ok=True)
    stub.write_text('''package dev.notune.transcribe;
public class RecognizeActivity extends android.app.Activity {
 public void onAutoStop() {} public void onAudioLevel(float x) {}
 public void onTextTranscribed(String s) {} public void onStatusUpdate(String s) {}
}''', encoding='utf-8')
    classes, dex = work / 'classes', work / 'dex'
    classes.mkdir(); dex.mkdir()
    platform = a.sdk / 'platforms/android-35/android.jar'
    quiet = ROOT / 'offline-adapter/src/dev/notune/transcribe/QuietRecognizeActivity.java'
    run(a.jdk / 'bin/javac.exe', '-encoding', 'UTF-8', '-source', '8', '-target', '8',
        '-classpath', platform, '-d', classes, stub, quiet)
    additions = sorted((classes / 'dev/notune/transcribe').glob('QuietRecognizeActivity*.class'))
    assert additions
    run(java, '-cp', tools / 'lib/d8.jar', 'com.android.tools.r8.D8', '--min-api', '26',
        '--lib', platform, '--classpath', classes, '--output', dex, *additions)
    assert not (decoded / 'classes2.dex').exists(), 'Never replace an upstream DEX'
    shutil.copyfile(dex / 'classes.dex', decoded / 'classes2.dex')
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
    out = ROOT / 'dist/Jarvis-Offline-Input-v0.4-preview.apk'
    out.parent.mkdir(exist_ok=True)
    if out.exists():
        raise RuntimeError('Output already exists; never overwrite a release APK.')
    run(java, '-jar', tools / 'lib/apksigner.jar', 'sign', '--ks', a.keystore,
        '--ks-key-alias', 'offline-preview', '--ks-pass', 'pass:android',
        '--key-pass', 'pass:android', '--out', out, aligned)
    run(java, '-jar', tools / 'lib/apksigner.jar', 'verify', '--verbose', out)
    run(tools / 'zipalign.exe', '-c', '-P', '16', '4', out)
    with zipfile.ZipFile(source) as before, zipfile.ZipFile(out) as after:
        preserved = [n for n in before.namelist() if n.startswith('lib/')]
        assert preserved
        for n in preserved:
            assert before.read(n) == after.read(n), n
        assert after.read('classes.dex') == activity_extension_dex(before.read('classes.dex'))
        assert after.read('classes2.dex') == (dex / 'classes.dex').read_bytes()
    print(json.dumps({'apk': str(out), 'sha256': hashlib.sha256(out.read_bytes()).hexdigest(),
        'bytes': out.stat().st_size, 'package': PACKAGE,
        'preserved_dex_and_native': len(preserved), 'phone_tested': False}))

if __name__ == '__main__':
    main()
