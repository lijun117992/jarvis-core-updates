"""Build the native notification preview using an existing Android SDK/JDK, without Gradle or network."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import time
import zipfile

ROOT = Path(__file__).resolve().parents[1]

def run(args):
    result = subprocess.run([str(a) for a in args], capture_output=True)
    def decode(value):
        try:
            return value.decode('utf-8')
        except UnicodeDecodeError:
            return value.decode('gb18030', errors='replace')
    output = decode(result.stdout) + decode(result.stderr)
    if result.returncode:
        raise SystemExit(output)
    return output.strip()

def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('--sdk', type=Path, default=Path(os.environ.get('ANDROID_SDK_ROOT') or os.environ.get('ANDROID_HOME') or Path.home() / 'AppData/Local/Android/Sdk'))
    p.add_argument('--jdk', type=Path, default=Path(os.environ.get('JAVA_HOME', '')))
    p.add_argument('--keystore', type=Path, required=True)
    p.add_argument('--allow-create-preview-key', action='store_true')
    p.add_argument('--output', type=Path, default=ROOT / 'dist/Jarvis-Notification-Bridge-v0.1.0-preview.apk')
    a = p.parse_args()
    tools = a.sdk / 'build-tools/35.0.0'
    android = a.sdk / 'platforms/android-35/android.jar'
    binaries = {name: a.jdk / 'bin' / (name + '.exe') for name in ['java', 'javac', 'keytool']}
    required = list(binaries.values()) + [android, tools / 'aapt2.exe', tools / 'zipalign.exe', tools / 'lib/d8.jar', tools / 'lib/apksigner.jar']
    if not all(x.is_file() for x in required):
        raise SystemExit('Requires JDK 17+ and installed Android platform 35 / build-tools 35.0.0; nothing was downloaded.')
    if not a.keystore.is_file():
        if not a.allow_create_preview_key:
            raise SystemExit('Preview signing key is missing; supply an existing key or explicitly allow local preview key generation.')
        a.keystore.parent.mkdir(parents=True, exist_ok=True)
        run([binaries['keytool'], '-genkeypair', '-keystore', a.keystore, '-storetype', 'JKS', '-storepass', 'android', '-keypass', 'android', '-alias', 'jarvis-notification-bridge', '-keyalg', 'RSA', '-keysize', '3072', '-validity', '10000', '-dname', 'CN=Jarvis Local Preview', '-noprompt'])
    work = ROOT / '.work' / ('native-build-' + str(time.time_ns()))
    classes, dex = work / 'classes', work / 'dex'
    classes.mkdir(parents=True); dex.mkdir()
    sources = sorted((ROOT / 'android-notifications/src').rglob('*.java'))
    run([binaries['javac'], '-J-Duser.language=en', '-J-Duser.country=US', '-encoding', 'UTF-8', '--release', '8', '-classpath', android, '-d', classes, *sources])
    classes_jar = work / 'classes.jar'
    with zipfile.ZipFile(classes_jar, 'w', zipfile.ZIP_DEFLATED) as z:
        for file in sorted(classes.rglob('*.class')):
            z.write(file, file.relative_to(classes).as_posix())
    run([binaries['java'], '-cp', tools / 'lib/d8.jar', 'com.android.tools.r8.D8', '--min-api', '28', '--lib', android, '--output', dex, classes_jar])
    unsigned, aligned = work / 'unsigned.apk', work / 'aligned.apk'
    run([tools / 'aapt2.exe', 'link', '-I', android, '--manifest', ROOT / 'android-notifications/AndroidManifest.xml', '-o', unsigned, '--min-sdk-version', '28', '--target-sdk-version', '35'])
    with zipfile.ZipFile(unsigned, 'a', zipfile.ZIP_DEFLATED) as z:
        for file in sorted(dex.glob('*.dex')):
            z.write(file, file.name)
    run([tools / 'zipalign.exe', '-p', '4', unsigned, aligned])
    a.output.parent.mkdir(parents=True, exist_ok=True)
    run([binaries['java'], '-jar', tools / 'lib/apksigner.jar', 'sign', '--ks', a.keystore, '--ks-key-alias', 'jarvis-notification-bridge', '--ks-pass', 'pass:android', '--key-pass', 'pass:android', '--out', a.output, aligned])
    certificate = run([binaries['java'], '-jar', tools / 'lib/apksigner.jar', 'verify', '--verbose', '--print-certs', a.output])
    badging = run([tools / 'aapt2.exe', 'dump', 'badging', a.output])
    if 'android.permission.INTERNET' in badging:
        raise SystemExit('Unexpected network permission; do not distribute this APK.')
    info = {'apk': str(a.output.resolve()), 'bytes': a.output.stat().st_size, 'sha256': hashlib.sha256(a.output.read_bytes()).hexdigest(), 'signing': 'local preview key; keep the keystore private for future in-place updates', 'certificate': certificate, 'android_device_test': 'NOT RUN', 'badging': badging}
    a.output.with_suffix('.verification.json').write_text(json.dumps(info, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({k: v for k, v in info.items() if k not in ['certificate', 'badging']}, ensure_ascii=False))

if __name__ == '__main__':
    main()
