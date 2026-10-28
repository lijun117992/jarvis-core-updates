# 手机离线听写试用

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
