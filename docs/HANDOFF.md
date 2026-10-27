# Project Jarvis Core 交接说明

## 开工核对

先运行 python scripts/check_remote.py，查看 GitHub commits、Releases、main/update.json、HEAD/origin/main。手机最新版以 update.json 为准，不能拿本文、旧聊天或源码版本代替远端核对。有本地修改或分叉先审查，不 reset/force push。仓库 lijun117992/jarvis-core-updates。

## 当前状态

当前源码 4.0.0-preview12，发布状态核对根 update.json。173 项桌面检查通过；没有安卓实机、真实 API 或 UI 视觉验收。用户 OPPO Find X7 / Android 16，系统 RecognitionService 和 RECOGNIZE_SPEECH Activity 均缺失，旧错误 5 不是单凭加权限就能修。默认改原中转站 mimo-v2.5-asr：AudioRecord PCM → WAV → Chat Completions input_audio，未实测网关。桌面/前台真实收音是最高优先验收。

## 源码与维护

- src/app.js：AutoJs6 JSX UI、Android 录音/TTS/截图/无障碍、工具循环、日记与记忆适配。
- src/CompanionCore.js：可移植纯逻辑、文件执行策略、音色/动画/文字、WAV/VAD、每日上下文和记忆合并。
- src/Assets/blue-fox/atlas.png：八状态八帧蓝狐，未改素材或身份。
- launcher/Jarvis_Launcher-v2.js：固定入口、联网更新与回退；程序包仍仅三个源码/素材文件加 manifest，无需升级启动器。
- scripts/test.cjs、scripts/package.py、scripts/release.py：离线验证、打包、受控发布；tests/ 新增文件/Agent/ASR/每日记忆/无障碍模拟。
- version.json 是源码版本，update.json 仅发布附件指针，dist 是忽略产物。

本地/GitHub 可改同一 src/。遵循 docs/MAINTENANCE.md，工作前核对远端，修改→检查→升版本与 CHANGELOG→提交/推送→获授权范围内发布。不得运行仓库外旧 v3/v4 生成器覆盖源码。现有公开程序/蓝狐/启动器发布已有用户明确授权，不包含私人文件。

## 能力与边界

动态提示词依据真实工具能力，当前视觉模型不再被提示词绑死。工具循环最多八步，执行前后检查取消令牌，文件覆盖要求本轮读取哈希。截图在工作线程调用、单次授权释放、缩图后上传；本地图片亦受大小与路径约束。无障碍以可见节点操作，不提供任意坐标、shell/eval，不自动点击最终发送/支付。

共享存储默认 /sdcard/Jarvis/Workspace/，需安卓所有文件权限。保护 Android/data、obb、程序和历史；不承诺系统分区/应用私有数据可写。修改留备份、预期哈希防冲突、回收单文件可恢复；没有电脑执行服务，不能假称可修改电脑文件。

上下文按手机本地日保存，磁盘保留完整日记，近期内容有模型预算，超窗口可搜；跨日载入近期摘要。通知引用为数据。回复与草稿清除 Markdown 装饰，文件正文不清洗；草稿独立复制及通知/应用跳转。

## 记忆的实际文件

用户确认 /sdcard/Jarvis/Memory/User_Persona.md 和 人际关系表.md。两者均读取，并在保留手工区域的前提下自动维护。不要只更新旧 Relationship_Graph.json。附结构化 Collaboration_Memory.json、Relationship_Graph.json、Daily 日记/摘要；原话为依据、推测不升级、同类别明确偏好替换旧值。

跨日空闲整理，关闭应用后下次启动补做；分段检查点，全部文件写成后才标完成。修改有备份，手工并发修改时拒绝覆盖。整理会产生模型调用，设置可关闭。部分写失败可恢复进度，不宣称跨多文件原子事务。

## 保留功能与重要证据

淡蓝极简面板，系统/Fish 按选择展开；音色新增空白、批量粘贴自动识别 32 位 ID 和名称配对、管理改名/多选删除/撤销。系统音色跟随手机 TTS 引擎，不用 setLanguage 重置；getVoices 空不代表没有音色。测试与实际共用配置，普通回答整段合成锁定音色，默认自动朗读，媒体音量由用户控制。Fish 标签只用于语音文本，免费档/账号额度仍需试听验证。

外部触摸收起输入/气泡，取消听写并忽略迟到结果；半藏拖动、动画、耳朵镜像仍需手机验收。通知默认分析，不决定是否能召唤。AutoJs6 音量加停止脚本是宿主设置，脚本不能保证拦截；用户需关闭该设置。

## 下一步验收

先测前台真实录音、网关转写，再测桌面后台麦克风；零音频不上送，不再反复要求测试缺失系统页面。再测系统截屏授权/当前视觉模型、文件权限/恢复、无障碍跳转与输入、外点穿透/键盘、跨日整理与 Obsidian 手工区。保留测试与真机证据区分。用户提供 MiMo TTS/voiceclone/voicedesign 与 Doubao 候选，目前只接 ASR，不默认增加其他收费调用。

使用与权限见 AGENT_GUIDE.md，发布见 MAINTENANCE.md，历史见 CHANGELOG.md。公共仓库禁止 Key、真实日记/通知/截图/候选音色名单。没有新增 CI/CD、电脑服务或长期 Codex 记忆。
