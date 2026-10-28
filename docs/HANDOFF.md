# Project Jarvis Core 交接说明

## 开工核对

先运行 python scripts/check_remote.py，查看 GitHub commits、Releases、main/update.json、HEAD/origin/main。手机最新版以 update.json 为准，不能拿本文、旧聊天或源码版本代替远端核对。有本地修改或分叉先审查，不 reset/force push。仓库 lijun117992/jarvis-core-updates。

## 当前状态

preview21候选：用户实测preview20 v0.2仍报9。改用新增透明前台Activity（非后台服务），复用原兼容入口JNI录音；APK v0.4与v0.2同签名同包名，versionCode25覆盖保留模型。新增源码offline-adapter/src；构建脚本精确清除原R8六个回调final位，正文/权限检查不改、本地库不改，新增类单独DEX。303项主机检查通过，APK签名/对齐/DEX限定改动通过，无设备日志与实机验收。步骤见OFFLINE_DICTATION.md，发布状态查线上指针。不能再把可见性修复或错误9已解决作为确定事实。

preview20已发布并匿名校验ZIP/启动器/离线适配APK/许可附件，main/update.json已切换。源码8a69830。新增MiMo/手机离线两项，选择离线时隐藏MiMo配置，测试跟随模式，页脚改preview20。用户已确认原版兼容页面中文可用，但直接服务错误9；本次独立适配APK加AutoJs6调用方可见性，原引擎代码未改。APK签名/16KB对齐/DEX-native一致性通过，298项回归通过，手机未测试。操作、回退与边界见OFFLINE_DICTATION.md；发布状态以线上指针为准。禁止将候选可见性因素称为已确认的唯一根因。

历史：preview19 曾发布且 ZIP/启动器匿名校验，目前 main/update.json 已由 preview20 替代，源码提交 5eb396b；离线听写接入测试：用户选择手机独立运行的 Offline Voice Input。核对 v0.2.3 提供无界面 RecognitionService、9.7 MB无模型APK、SenseVoice Small GGUF中文模型；修正 Jarvis 服务过滤权限拼写。安装/中文识别/桌面收音未实测，不需要或使用电脑常驻。步骤见 OFFLINE_DICTATION.md。292项主机检查通过。此次不改变听写默认项，用户需选择系统直接识别；不拷贝Key、不变动原生通知桥、不操作手机。发布状态查看线上指针。

历史：4.0.0-preview18曾作为GitHub测试更新发布，ZIP/启动器/可选原生APK均匿名校验；当前指针已由preview19替代。发布源码为合并提交58ebe12b9d0cdfd1be98f979acd2e85f8366a9c6，更新指针提交3c5309f。实际最新状态仍须读取main/update.json与Release，不以本文代替线上检查。用户已要求不再操作手机，后续不做ADB点击、录音、传包或替用户验收。

本轮290项桌面回归通过，原生APK未改；历史和TTS后端有实质变化，仍待用户实机反馈。MiMo官方schema为input_audio，用户同一渠道偶发HTTP422类型拒绝；不同内部线路仅为推测，不可确认为根因。只对明确schema拒绝进行一次file格式兼容尝试，未得到真实成功证据前不可宣称已修好。

## 本轮手机反馈与待验收

用户手机截图已显示原生桥通知使用权已授权、系统监听已连接、0条记录；这只能证明该时刻系统连接状态，未证明补收/锁屏成功。用户确认朗读缺开头和中断发生在系统音色。

preview16简化更多设置，工具与每日记忆默认开；权限入口负责原生配对，历史在主界面。点按读屏上传文字坐标、长按上传截图，都直接分析。截图专用入口仅调用一次视觉模型；模型/网络耗时仍不受客户端控制。声音增加短静音预热，已开始播放后不按估计超时停止，尚须试听。没有USB也能用微信传包手动安装与截图验收，不把无设备连接当作开发完成证据。

## preview17 最新实现与验收边界

本轮在同一PR草稿分支实现内嵌渠道管理/显隐Key、浮层模型菜单和三类模型独立跨渠道路由。选择绑定稳定channelId/model，请求时捕获该渠道URL/Key；视觉cfg.vision、听写roleConfig(asr)、对话brainConfig分开。API列表获取仍针对正在编辑的渠道，不得拿跨渠道对话配置去取错列表。新增空模型渠道先获取再选择，不虚构默认可调用模型。

speechText与spoken_summary只影响朗读，正文/文件内容不按此清洗。通知priority/direct_message/mentioned/needs_reply/alert_speech来自模型，未知按低优先处理；待汇报标记与原队列同快照，真实卡片创建后消费。importantRemindersV417和userRemindersV417为本机数据，脚本运行期提醒；没有微信内部实际已读/回复证据，不可声称“确实未回复”。系统闹钟只派发时钟页面，未经确认不称建立成功。

web.search实际请求Bing RSS，无搜索Key；只把真实条目返回模型，未全文抓取。PC公开查询HTTP200并解析10项，未使用私密/付费API，安卓网络/XML仍待实机。当前共272项桌面回归，原生APK未改。手机通道仍为preview14，候选ZIP手动安装，无USB也可微信传包反馈。重点实测渠道/眼睛/模型浮层、跨渠道真实ASR/图片、群聊分级、提醒延后/取消及声音首尾。

## preview18 最新修复说明

历史使用historyWindow及独立historyEpoch，创建前关闭编辑/回复卡；外部触摸不阻断其他应用。系统TTS以synthesizeToFile合成私有WAV，wavePaddingPlan校验音轨并生成真实750ms静音插入计划，流式拷贝后MediaPlayer播放；试听共用此路径，合成与播放回调严格分开。旧队列静音不足的实机反馈是改动依据，新的文件合成兼容性仍需试听。

toolResultSummary不再拼接普通成功答复；真实失败/部分完成仍自然说明，审计文件保留。最新任务在引用通知后；focusedHistory只缩短请求窗口，不删除当天日志。网站查询误答旧ASR问题时最多重聚焦一次，携带真实结果并防止重复执行；taskEpoch在最终UI回调拒绝旧结果。新指令可取消旧任务后续动作。

ASR不操作用户手机或读取Key做远程测试。保留官方格式，未知类型拒绝时仅同渠道尝试file格式一次；无声不上传、说完2秒提交。参考[MiMo官方ASR](https://mimo.mi.com/docs/en-US/api/audio/Speech-Recognition)和[Android TextToSpeech](https://developer.android.com/reference/android/speech/tts/TextToSpeech)。网关具体file音频语义未知，因此兼容尝试不是可用性承诺。

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

projectionActive 只保留当前宿主会话，正常截图完成不释放；没有定时抓帧。系统撤销导致捕获失败时释放并要求重授权。可从系统共享提示停止共享，退出释放；未缓存 Android 投屏授权令牌。


## preview14 行为与回归入口

单击不再调用 restoreConversation；听写/转写/任务的 showAnswer 进度卡移除，错误/最终回复仍可显示。录音时偷听，relay 转写时思考。旧气泡外取消说明不再适用无气泡录音，双击小人取消并输入。历史菜单首项最近回复，恢复正在播放的全文时锁定可见进度，避免随后回调把全文缩回一半。

CompanionCore.parseModelJson 有界修复 JSON 字符串内控制字符和多次编码，不 eval；normalizeAgentResult 拒绝 XML 自造工具结果/无效结构，不回退原始协议正文。修正请求只放无效标识，不把伪造目录数据重新作为上下文。动作只保留 tool/args；普通正文再经 plainReply/replyBody 清理，文件工具 content 路径不调用这些展示函数。

nativeFailure → finishSpeechAsText 保留全文不重打。Fish fallbackPhrase 每 attempt 仅一次，audioStartedEver 后不换引擎重读。showSpeechProgress 单调，重复 nativeStart 和过期 typeSilently 回调不影响新回复；Fish 未知时长采用保守估算，不能 15 秒固定截断。真实系统/Fish 中断原因仍需电话侧证据，不以模拟通过冒充实机声音验收。

新增 tests/quiet-protocol-audio.cjs，覆盖换行/嵌套协议、伪造工具过程、任务最终输出、分栏标签、播放回调及文字重播。所有用例使用假密钥和合成内容。


## preview15 原生桥交接

android-notifications/ 是 SDK35/min28 原生 Java 配套源码，不依赖 Gradle/第三方运行库；scripts/build_notification_bridge.py 使用现有 SDK/JDK 构建签名 APK。scripts/test_notification_bridge.py 验证真实 APK 签名/权限与主机 SQLite 规则。签名密钥在本机被忽略的私有工作区，未来覆盖升级必须保留，禁止提交。

原生 SQLite 独立于脚本保存 5000 条/7 天通知，读取或写入时过期清理；进程重连补收仍留在通知栏的最近记录，不承诺退出期间已经消失的通知。只读 Provider 不公开导出，PAIR Activity 仅用户点击后向实际调用方授予持久只读 URI；撤销授权不删除通知。BOOT/系统重新绑定不等于绕过 OPPO 后台/强停限制。

AutoJs6 通过 nativeBridgeUriV415 保存 OS 授权地址，noticeQueueV415 单快照含 pending/recent/retry/overflow/cursor/instance。旧的两份队列键可迁移，状态按 ID 同步；超上限保护在途项、失败有限重试。原生游标与入队持久化衔接、原生数据重建按实例重置，满队列不推进。原生模式不再同时接收宿主回调，避免重复；手动断开可回原 AutoJs6 路径。

通知提示通过最终 showAnswer 回调检查语音/输入/卡片，防检查后排队期间新语音启动。通知点击只尝试其真实 PendingIntent，失效后明确回退打开应用，不伪造联系人链接。没有原生语音播放器，本轮不能宣称语音中断根因已修。

新增 notifications-cleanup.cjs 模拟重启/磁盘失败/回压/URI、以及仅内存文件树的清理和链接攻击，无真实主机删除。NATIVE_NOTIFICATIONS.md 有手机验收清单与源码/构建/发布边界。

## 本轮发布记录与后续入口

PR #1已合并，后续在正式repository/main维护，不再向旧fix/notifications-storage-speech-preview15分支追加工作。旧.work/preview15-review工作副本仅留档，不删除或覆盖。每次先check_remote.py核对远端再改。

Release：https://github.com/lijun117992/jarvis-core-updates/releases/tag/v4.0.0-preview18 。290项桌面检查通过，现有原生APK0.1.0-preview未重编译，签名保持。已安装通知桥不用重装。没有进行本轮手机录音/播放/听写验收；file兼容上传和系统文件合成须由用户验证，发布测试版不等于故障已消除。

系统音色缓存只写AutoJs私有cache目录，本轮结束/取消清理；不修改Key、音色候选、个人记忆或手机现有程序。后续不通过ADB给用户传包、点击界面或改文件，除非用户重新明确要求。
