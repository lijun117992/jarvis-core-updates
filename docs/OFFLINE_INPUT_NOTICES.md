# Jarvis Offline Input preview adapter

This is a modified, separately signed preview of Offline Voice Input v0.2.3 by
notune, https://github.com/notune/android_transcribe_app/tree/v0.2.3 .
It is not an official upstream release and is not endorsed by the upstream author.
The original MIT copyright and license are provided in OFFLINE_INPUT_LICENSE.txt.

Modification source: scripts/build_offline_adapter.py in
https://github.com/lijun117992/jarvis-core-updates .
The build pins the upstream APK and Apktool by SHA-256, preserves the original DEX
and native libraries byte for byte, adds an explicit Android package-visibility
query for org.autojs.autojs6, and changes app identity, label, private provider
authority and app-owned signature permission for side-by-side installation.
No microphone permission check or Android privacy indicator is removed.
No model, user data, account credential, network permission or new executable
payload is added. Original third-party materials in the upstream APK are retained.

The upstream uses transcribe.cpp (https://github.com/handy-computer/transcribe.cpp),
Rust and Android libraries; their source/dependency manifests and notices remain
available through the pinned upstream source and original distribution.
Speech models are downloaded separately under their own licenses; none are
redistributed in this adapter. The SenseVoice GGUF download is the upstream
app's listed model, not a model produced or licensed by Jarvis.

Apktool (https://github.com/iBotPeaches/Apktool, Apache-2.0) is a build tool only,
not included in the APK. Signing keys and build tools are never committed.

This preview is untested on the user's OPPO Android 16 device. Signature,
alignment, app identity and preserved native/DEX contents are host-verified only.
