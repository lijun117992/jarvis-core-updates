# 原生通知桥：安装、维护与验收

## 当前状态

原生 APK 0.1.0-preview 与 Core 4.0.0-preview15 均为候选，PR #1 尚未合并，手机更新通道保持 preview14。245 项 Node 回归、3 项原生主机检查、APK 编译/签名/权限核查通过。未连接安卓手机，不宣称系统授权、后台常驻或长语音已通过。

## 安装与连接

1. 将 APK 和候选 ZIP 保存到手机 Download/WeiXin。首次安装 Jarvis 通知桥，按安卓提示确认安装来源；新 APK 安装不取代 AutoJs6。
2. 打开 Jarvis 通知桥，点“设置通知使用权”，只给该应用开启通知使用权。返回检查“系统监听连接”。在 OPPO 中按实际系统入口允许此应用后台运行/自启动，关闭针对它的电池限制。
3. 原启动器点“安装下载目录的最新包”，选择/识别 preview15 候选，再启动。Key、候选音色和记忆沿用。候选启动会清理 Jarvis/App 自有旧版本/缓存，保留当前/上一版、其他运行和较新版本；不删 Download/WeiXin、Memory、AgentData。
4. Jarvis 更多设置 → “连接原生通知桥”。在原生页面核对调用应用包名后点“授权连接 Jarvis”。该授权只允许读取原生记录，不是自动授予系统通知使用权。
5. 回 Jarvis 检查原生状态。长按连接项可撤销 Jarvis 的持续读取并回到 AutoJs6 接收；原生应用内也可撤销读取授权或清除本机记录。

两个权限要区分：系统通知使用权授予原生桥负责采集；只读 URI 授予 AutoJs6 负责读取。通知桥没有 API Key，也没有 INTERNET 权限。之后通知分析由 Jarvis 调用用户配置中转站，仍可能产生原有模型费用。

## 数据与恢复

Android 实际通知 → 原生 NotificationListenerService → 私有 SQLite → 用户授权的只读 Provider → Jarvis 本机队列 → 模型分析。

仅保存微信、QQ、钉钉通知文字，字段裁剪为标题 200/正文 2000 字符，最多 5000 条、7 天，读取或写入时清理过期项。应用不读取内部完整聊天历史、不联网、不申请麦克风/全文件权限、禁止 Android 自动备份数据库。

系统重新连接时仅能补收仍在通知栏的记录，已经消失或从未推送的聊天无法恢复。用户强制停止、撤销权限、设备后台策略仍可能导致漏收，不能保证进程永不退出。开机接收器仅请求系统重连，不绕过权限或保活限制。

Provider 不公开导出；PAIR 仅在用户点击后向实际调用方返回带持久/前缀只读授权的固定 URI。Jarvis 校验来源 URI，保存于原 storages。原生 DB 不导出到公共目录。通知直达要求仍有效的真实 PendingIntent；用户触发时才发送，并按 Android34+/36 的活动启动规则处理，不能把“请求跳转”当成已进入指定联系人。

Jarvis 每次最多补收 20 条，本机待处理队列 80、最近记录 100。队列满暂停原生游标，数据仍留原生数据库；最多 3 次分析尝试，重启继续，丢弃/过期明确标记。游标与队列同快照保存，数据库重建按实例重新同步。notifications.recent 仅查 Jarvis 已同步的实际记录和草稿，不是原生全库查询工具。

## 构建与验证

源码 android-notifications/src，清单 AndroidManifest.xml。使用已安装 JDK17+、Android platform35/build-tools35.0.0，无 Gradle/在线依赖或全局环境修改：

```text
python scripts/build_notification_bridge.py --keystore .work/native-signing.jks --allow-create-preview-key
python scripts/test_notification_bridge.py
node scripts/test.cjs
python scripts/package.py
```

已有密钥后省略 allow-create 参数。生成的是本地预览签名，私钥必须保留在忽略目录并自行备份，不能进 git；后续安装包要用同一签名才能覆盖升级。APK 单独安装，不能加进 Core 的三文件 ZIP 白名单。构建输出 dist/APK、verification.json 和 Core ZIP，产物不等于发布。

主机检查包含签名与权限、SQLite 唯一约束/游标/条数、队列重启/回压/失败、以及虚拟文件树的清理范围与链接防护。不能替代 Android Binder URI 授权、NLS 生命周期、OPPO 真机和声音试听。

## 手机验收（发布前）

- 正常运行：用自己的账号给自己发测试通知，确认原生记录增加、Jarvis 最近通知/草稿对应真实内容。
- 脚本退出：只停止 Jarvis 脚本，再发送通知，原生记录应增加；重开脚本确认补收且不重复。
- 锁屏/清理最近任务/重启分别测试；强行停止原生应用单独记录，允许“需手动重新打开”，不能冒充无条件常驻。
- 听写、长系统/Fish 朗读、Agent 任务期间接收通知，检查先排队、不抢音频、不倒退/重复文字；后台服务不承担语音播放，原中断根因仍需手机证据。
- 撤销读取授权后不能从桥继续读取；重新连接可补收；清库/卸载重装后游标恢复，旧聊天跳转失效时不得误开联系人。
- 在手机可回退备份确认 current/previous 保留，自动清理仅自有旧目录；下载 ZIP、个人记忆、Agent 数据不能变化。

验收照片/通知/日志含私人数据，不提交公共仓库。完成验收并获得发版授权后，才按 MAINTENANCE.md 发正式附件、最后更新 update.json；本轮未新增 CI/CD，也未发布 preview15。

参考：[Android 通知监听服务](https://developer.android.com/reference/android/service/notification/NotificationListenerService)、[ContentProvider](https://developer.android.com/guide/topics/providers/content-provider-creating)、[活动启动限制](https://developer.android.com/guide/components/activities/secure-bal)。
