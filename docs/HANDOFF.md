# Project Jarvis Core 交接说明

## 开工核对

先运行 python scripts/check_remote.py，查看 GitHub commits、Releases、main/update.json、HEAD/origin/main。手机最新版以 update.json 为准，不能拿本文、旧聊天或源码版本代替远端核对。有本地修改或分叉先审查，不 reset/force push。仓库 lijun117992/jarvis-core-updates。

## 当前状态

当前源码与手机通道已发布 4.0.0-preview14。源码提交 6cb5eeb209c8422f744540171609f0d5100ed72d；公开 ZIP、启动器附件和 raw 更新指针已匿名校验。ZIP 2123155 字节，SHA-256 dd9e0fe0087d60e08506d6fb82eefcdd0684236b4c4ab95757b0821fcd34ad71。未来状态仍须核对 update.json 与 Release。222 项桌面检查通过，未连接安卓手机或真实付费 API。用户 OPPO Find X7 / Android 16 系统识别接口缺失，旧 relay ASR400 尚无真实成功证据。本轮修复无关重装权限，不可直接称所有语音故障已解决。

新增空白分栏渠道表单与固定标签；单击只听写，不弹卡片，长按历史/最近回复找回。跨行 answer JSON 曾被旧解析降为原文，模型自造工具 XML 与行动过程也曾直出；本版阻断此回退。朗读失败旧路径从头打字，Fish 播放中错误会系统重播，本版去除重复并保证显示进度不倒退。


## 源码与维护

- src/app.js：AutoJs6 JSX UI、Android 录音/TTS/截图/无障碍、工具循环、日记与记忆适配。
- src/CompanionCore.js：可移植纯逻辑、文件执行策略、音色/动画/文字、WAV/VAD、每日上下文和记忆合并。
- src/Assets/blue-fox/atlas.png：八状态八帧蓝狐，未改素材或身份。
- launcher/Jarvis_Launcher-v2.js：固定入口、联网更新与回退；程序包仍仅三个源码/素材文件加 manifest，无需升级启动器。
- scripts/test.cjs、scripts/package.py、scripts/release.py：离线验证、打包、受控发布；tests/ 新增文件/Agent/ASR/每日记忆/无障碍模拟。
- version.json 是源码版本，update.json 仅发布附件指针，dist 是忽略产物。

本地/GitHub 可改同一 src/。遵循 docs/MAINTENANCE.md，工作前核对远端，修改→检查→升版本与 CHANGELOG→提交/推送→获授权范围内发布。不得运行仓库外旧 v3/v4 生成器覆盖源码。现有公开程序/蓝狐/启动器发布已有用户明确授权，不包含私人文件。

## 能力与边界

动态提示词依据真实工具能力，当前视觉模型不再被提示词绑死。工具循环最多八步，执行前后检查取消令牌，文件覆盖要求本轮读取哈希。截图在工作线程调用、同次共享复用授权、退出/手动停止释放、缩图后上传；本地图片亦受大小与路径约束。无障碍以可见节点操作，不提供任意坐标、shell/eval，不自动点击最终发送/支付。

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


## preview13 接手重点

API 渠道 apiChannelsV413 存本地，activeChannelV413 决定当前；原 dsUrl/dsKey/dsModel 仍同步，不能改成清空旧配置。候选键 modelsV413:<channel-id>，禁止按同 URL 混用不同 Key。JSON/文本批量导入为自动粘贴，不切当前，管理删除需确认。当前尚未提供独立 ASR 渠道交叉绑定，ASR 与对话沿用当前渠道地址/Key，模型独立。

lastConversationV413 单独保存完成回复，临时听写/错误不覆盖；activeConversationDayV413 非空表示主动续聊历史日，默认仍跟随手机日历。历史选择用回调，最近 100 条可浏览、完整日记可搜。单击意图跨 290ms 双击等待保持，外点识别排除小人并延迟核对触摸。

requestBrain 的 chatMessageText 兼容文本数组、单个 tool_calls；空白和只思考抛明确错误。normalizeAgentResult 拒绝空对象/占位，无效协议最多一次修正；修正失败要报告已发生的真实工具结果。没有新增直接自动发送工具。

ASR400 真正服务端原因此前被丢掉，本版 httpFailure 只取错误消息/代码，脱敏 Key/长媒体，不把完整响应/录音落日志。requestRelayAsr 仍用 Chat Completions；Base64 模式不带 asr_options，Data URL 模式保留 language zh。停顿 900ms 收尾不等于流式识别，上传/模型推理仍有延迟，不能保证低延迟或成功。

projectionActive 只保留当前宿主会话，正常截图完成不释放；没有定时抓帧。系统撤销导致捕获失败时释放并要求重授权。新增停止共享入口在更多设置，退出释放；未缓存 Android 投屏授权令牌。


## preview14 行为与回归入口

单击不再调用 restoreConversation；听写/转写/任务的 showAnswer 进度卡移除，错误/最终回复仍可显示。录音时偷听，relay 转写时思考。旧气泡外取消说明不再适用无气泡录音，双击小人取消并输入。历史菜单首项最近回复，恢复正在播放的全文时锁定可见进度，避免随后回调把全文缩回一半。

CompanionCore.parseModelJson 有界修复 JSON 字符串内控制字符和多次编码，不 eval；normalizeAgentResult 拒绝 XML 自造工具结果/无效结构，不回退原始协议正文。修正请求只放无效标识，不把伪造目录数据重新作为上下文。动作只保留 tool/args；普通正文再经 plainReply/replyBody 清理，文件工具 content 路径不调用这些展示函数。

nativeFailure → finishSpeechAsText 保留全文不重打。Fish fallbackPhrase 每 attempt 仅一次，audioStartedEver 后不换引擎重读。showSpeechProgress 单调，重复 nativeStart 和过期 typeSilently 回调不影响新回复；Fish 未知时长采用保守估算，不能 15 秒固定截断。真实系统/Fish 中断原因仍需电话侧证据，不以模拟通过冒充实机声音验收。

新增 tests/quiet-protocol-audio.cjs，覆盖换行/嵌套协议、伪造工具过程、任务最终输出、分栏标签、播放回调及文字重播。所有用例使用假密钥和合成内容。
