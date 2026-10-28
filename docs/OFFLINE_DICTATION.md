# 手机离线听写 preview21 试用

用户已反馈：preview20 v0.2适配包仍返回错误9。补充包可见性没有解决，不能继续反复授权或重装模型。真正的Android拒绝点尚无日志证实。

## 本次仅覆盖升级

1. 从[preview21附件](https://github.com/lijun117992/jarvis-core-updates/releases/tag/v4.0.0-preview21)下载安装 Jarvis-Offline-Input-v0.4-preview.apk，选择更新现有“Jarvis 离线听写（测试）”。同包名/同签名且versionCode从23升至25，模型应保留；不要卸载，不需重下或重导模型。
2. 原Jarvis启动器检查GitHub更新，安装preview21并重启。更多设置仍仅“MiMo接口听写 / 手机离线听写”，选择手机离线。
3. 单击小人说短句，停顿约2秒，观察自动提交；再单击结束，双击应取消并打开文字输入。不弹Listening面板，Android顶部麦克风隐私指示保留。
4. 如启动报错、无声或闪屏，反馈实际现象，不要反复授权。可先打开适配应用首页Try voice input检查它自己的原版入口；该应用内测试仍显示面板。整个过程不需要电脑运行。

## 实现与验收边界

- 本次不使用RecognitionService（preview20实际失败），改为应用自身前台Activity录音，使用已经可用的原版JNI通路。新增Java子类透明入口；不是后台服务，不保证切换到另一个应用后继续录音。
- 透明窗口从主题起始即不显示背景/启动预览，创建后不接收触摸、不聚焦、1像素且alpha0；是否被OPPO额外限制仍待实测。无障碍、摄像头、网络、存储特权均未增加。
- 原R8优化包的六个Activity回调被final化。构建脚本精确去除这些方法的final位以允许继承，修复DEX头哈希；原方法字节码和权限检查未改，本地库逐字节一致。新增类完整源码在offline-adapter/src，stub只用于编译，不进APK。许可与修改说明内置且随Release提供。
- 原生录音权限仍在适配应用内检查；新入口还要求调用者RECORD_AUDIO。不是移除权限检查来处理9。无法在无设备日志时承诺根因已消除。
- 2秒无说话取消，有声音后2秒停顿提交；上限45秒收音、120秒处理。停止/取消使用随机会话令牌，取消还关闭子Activity；识别结果只由启动Activity结果回给Jarvis，不发广播、不走剪贴板。
- 主机303项回归通过，APK签名与旧版相同、版本递增、16KB ZIP对齐、DEX受限位变化/头哈希及原生库一致性通过；透明窗口和OPPO真实录音仍待测试。
- 原配置/Key/记忆/音色不迁移。模型与已安装v0.2属于同一应用私有数据，覆盖更新保留；启动器更新只更新Jarvis脚本，APK需单独手动覆盖安装。回退Jarvis脚本可用启动器上一版；旧APK不能常规覆盖降级，勿为降级卸载丢失模型。

## 历史说明（不作为本次操作）

# 手机离线听写 preview20 试用

最新反馈：用户原版 Offline Voice Input 兼容页面可识别中文；直接服务返回错误9。下方 Listening 面板由上游 RecognizeActivity 绘制，不是 Android 隐私指示。

## 本次操作

1. Jarvis启动器检查GitHub更新，安装 preview20 并重启。
2. 从 [preview20附件](https://github.com/lijun117992/jarvis-core-updates/releases/tag/v4.0.0-preview20) 下载 Jarvis-Offline-Input-v0.2-preview.apk，在手机安装“Jarvis 离线听写（测试）”。这是另签名的修改版，不是上游官方应用；可与原版并存，不卸载原版、不修改原应用数据。
3. 打开新应用，允许麦克风；在 Speech models 导入手机已有的 SenseVoiceSmall-Q8_0.gguf，选中并等 Ready，语言选中文，翻译关闭。模型不用重新下载，但独立应用必须重新导入一份，占用额外存储。
4. 在新应用首页 Try voice input 先验证中文。此测试仍可显示它的面板，这是单独的应用内测试；Jarvis日常调用的是无界面服务。
5. Jarvis更多设置只保留“MiMo 接口听写”和“手机离线听写”，选后者。离线模式不显示MiMo模型，模型配置仍保存在原位置。单击小人测试；只应有小人动作，不启动底部兼容面板；最终文字自动交给对话模型。
6. 如果仍返回9，反馈是否仅在桌面发生，以及新服务组件名 com.jarvis.offlineinput/dev.notune.transcribe.VoiceRecognitionService。分别检查新应用和AutoJs6的麦克风授权。不再反复测试原版系统兼容入口，也不自动回退到付费接口。

## 实现和边界

- 单独适配包来自上游 v0.2.3 无模型APK，原DEX/native字节保持一致，仅改应用身份及增加AutoJs6包可见性；保留Android权限校验，无INTERNET、不复制Key。脚本 scripts/build_offline_adapter.py 固定上游APK及Apktool校验和，构建时附MIT许可与修改说明。签名密钥仅在忽略目录保存，后续更新需保持此签名。
- 上游Manifest明确指出识别服务检查调用方录音权限时可能受包可见性影响；当前是针对这一因素的候选适配，不是在没有日志时确认错误9唯一根因。Android后台麦克风限制仍可能存在。
- 新适配包签名/16KB对齐/权限/包名及DEX/native一致性已在主机检查，298项Jarvis回归通过；用户OPPO Android16尚未验证。无界面调用不启动RecognizeActivity；Android顶部麦克风隐私指示仍保留。
- 本地转写不占用电脑，不发录音到中转站；最终文字仍发送给你配置的对话模型。没有新增付费服务。
- 原版可保留回退。preview20离线选项只调用新适配包，不再公开原版兼容选项；需要回退时使用启动器回到preview19和原版应用。

## 历史：preview19 原版安装步骤


状态：核对上游 v0.2.3 的安装包、Manifest、识别服务和模型列表；Jarvis preview19 修正服务发现筛选。尚未在 OPPO Find X7 / Android 16 验收，不保证后台麦克风可用或识别质量达到微信输入法水平。不需要电脑常驻，不更换微信输入法，不使用中转站进行转写。

## 首次安装

1. 手机下载并安装 [Offline Voice Input v0.2.3 无模型 APK](https://github.com/notune/android_transcribe_app/releases/download/v0.2.3/android_transcribe_app_v0.2.3_fdroid.apk)（约 9.7 MB）。这是上游应用，非 Jarvis 通知桥；不需要卸载或替换通知桥。
2. 下载上游应用模型列表中的 [SenseVoice Small Q8 GGUF](https://huggingface.co/handy-computer/SenseVoiceSmall-gguf/resolve/main/SenseVoiceSmall-Q8_0.gguf)（上游标注约 241 MB）。必须是这个项目兼容的 GGUF，不能用 ONNX、Whisper BIN 或同名其他格式替代。默认捆绑的 Parakeet 模型不支持中文，所以选无模型小包。
3. 打开 Offline Voice Input，授予麦克风权限；在 Manage speech models 导入并选中该 GGUF，语言选择中文 / zh-CN，关闭 Translate（翻译）。等待模型加载完成。下载仅首次需要网络，转写在手机本地运行。
4. 先点应用首页 Try voice input，说一句“帮我记下明天下午三点开会”，确认中文准确、无声能结束。此测试可能显示该应用自己的语音面板；Jarvis 正式调用使用无界面 RecognitionService，不使用该面板。
5. 原 Jarvis 启动器检查 GitHub 更新，安装 preview19 或更新版本并重启。在更多设置的听写方式选择“系统直接识别”，不要选“自动”或“MiMo 接口听写”（自动在已配置 ASR 模型时仍优先中转站）。
6. 单击小人，说同一句话，停顿等待结果。应只显示偷听动作，识别后自动提交当前对话模型。听写本地处理不等于整段对话离线：提交后的文字仍发给你配置的大脑接口。

## 验收与失败定位

- 首先只测上游应用的中文识别，再测 Jarvis 前台，最后测桌面小人。不要在第一步失败时反复重试 Jarvis。
- 上游也失败：检查 GGUF 是否完整、已选中、模型加载完成及麦克风授权。不要改用默认 Parakeet 测中文。
- 上游成功、Jarvis 提示找不到服务：确认已更新并重启；可能是 AutoJs6 的 Android 包可见性限制，不能据此断言应用未安装或缺少录音权限。
- 如果有多个识别服务而系统未指定默认项，Jarvis不会擅自挑选。需要系统设置指定语音识别服务；没有该系统入口时再反馈以增加专用选择器，不通过安全设置写入或 ADB 强行更改。
- 前台成功、桌面失败：记录具体错误与服务组件名；仍需检查 OPPO 对后台麦克风的限制。此次修复不能绕过 Android 权限。
- 用户已要求不再远程操作手机；此试用由用户在手机操作。不自动切回付费云识别，不上传录音给其他服务。

依据：[上游 v0.2.3 源码与说明](https://github.com/notune/android_transcribe_app/tree/v0.2.3)。APK/模型使用上游直链，不擅自重新发布第三方模型。可删除该应用及其模型结束试用；Jarvis 原有 Key、记忆和渠道不迁移。
