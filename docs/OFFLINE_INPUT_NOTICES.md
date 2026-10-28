# Jarvis Offline Input preview adapter

This is a modified, separately signed preview of Offline Voice Input v0.2.3 by
notune, https://github.com/notune/android_transcribe_app/tree/v0.2.3 .
It is not an official upstream release and is not endorsed by the upstream author.
The original MIT copyright and license are provided in OFFLINE_INPUT_LICENSE.txt.

Modification source: scripts/build_offline_adapter.py in
https://github.com/lijun117992/jarvis-core-updates .
The build pins the upstream APK and Apktool by SHA-256. Native libraries stay
byte-for-byte identical. The upstream R8 optimizer marked six Activity callbacks
final; the adapter clears only those final modifiers and repairs DEX checksums
(method bodies, model loading and microphone checks are unchanged). An additional
classes2.dex contains QuietRecognizeActivity from the public offline-adapter/src
folder. A compile-time superclass stub is never packaged.

The new Activity uses the upstream foreground recording/JNI path with a transparent,
non-touchable window, microphone permission protection, two-second silence handling,
per-session stop/cancel tokens and result delivery to the initiating Activity. It
is not a background recording service; switching apps can end capture. Original
Android privacy indicators and microphone checks remain. The old original test
Activity remains for setup/diagnosis. An explicit AutoJs6 package-visibility query
and separate app identity/provider authority/signature permission are retained.
No speech model, credential, user recording or Internet permission is added.
The v0.4 preview uses the same private signing identity and higher version code as
the v0.2 adapter so it can upgrade in place while retaining imported models.

The upstream uses transcribe.cpp (https://github.com/handy-computer/transcribe.cpp),
Rust and Android libraries; their source/dependency manifests and notices remain
available through the pinned upstream source and original distribution.
Speech models are downloaded separately under their own licenses; none are
redistributed in this adapter. The SenseVoice GGUF download is the upstream
app's listed model, not a model produced or licensed by Jarvis.

Apktool (https://github.com/iBotPeaches/Apktool, Apache-2.0) is a build tool only,
not included in the APK. Signing keys and build tools are never committed.

This preview is untested on the user's OPPO Android 16 device. Signature,
alignment, original native libraries and bounded DEX callback modifier changes are
host-verified only. Transparency, lifecycle and real microphone behavior need device testing.
