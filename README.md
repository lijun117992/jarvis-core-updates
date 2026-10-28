# Jarvis Core · 蓝狐小伙伴

## Overview

AutoJs6 安卓悬浮助手。这个公开仓库维护可编辑源码与手机更新通道，支持本地和 GitHub 网页修改同一套文件。

**每次开工先运行 `python scripts/check_remote.py` 查看 GitHub 最近提交、Releases 和 update.json，核对最新版再修改。** 不能以旧聊天或本地版本号代替远端核对。

- [项目交接](docs/HANDOFF.md)：现状、故障证据、边界与待验收。
- [维护与发布](docs/MAINTENANCE.md)：本地/GitHub 双向修改、检查、打包、发布。
- [音色批量管理](docs/VOICE_PRESETS.md)：粘贴导入、多选删除、命名与撤销。
- [工作规则](AGENTS.md)、[变更记录](CHANGELOG.md)。

手机首次导入 [启动器 2.0](https://github.com/lijun117992/jarvis-core-updates/releases/download/v4.0.0-preview6/Jarvis_Launcher-v2.js)，点击检查更新、下载安装、启动。Key、记忆、音色名单留在原 AutoJs6，不上传本仓库。

## Status

手机通道仍是 **preview14**，以 [update.json](update.json) 为准。本分支是 PR #1 的 **preview16 未发布候选**：原生通知桥独立保存实际通知，Jarvis 通过用户授予的只读权限补收；改善接收队列、语音互斥和更新清理范围，新增精简设置、浅蓝自绘菜单、直接读屏分析及系统朗读预热。安装/验收见 [原生通知桥](docs/NATIVE_NOTIFICATIONS.md)，不能把候选包当成手机通道已更新。

保留八状态蓝狐、淡蓝悬浮输入/回复、系统/Fish 整段自动朗读、多音色候选批量管理，以及在线更新与回退。现有 User_Persona.md、人际关系表.md 手工内容保留，配置与 Key 留在手机。

251 项 Node 回归和 3 项原生主机检查通过，APK 已离线编译、签名并验证权限。主机 SQLite、模拟 ContentResolver/回调和虚拟清理测试不是安卓实机验收。ADB 无已连接设备；OPPO 锁屏、任务清理、重启/强停、只读授权、通知跳转和长语音仍待验证。旧 ASR HTTP400 也没有新的真实成功证据。

开发环境：Python 3.10+、Git、GitHub CLI、Node 22.18+ 或 24.11+。

```text
npm ci
node scripts/test.cjs
python scripts/package.py
```

正式源码在 src/，启动器在 launcher/，dist/ 只存产物。打包不会发布；网页保存不会自动更新手机。未配置 GitHub Actions。公开可下载不等于任意使用许可，当前未添加开源 LICENSE。

## Todo

- OPPO Find X7 / Android 16 实测前台及桌面录音、MiMo 网关音频兼容性。
- 实测截图授权、当前模型图片理解、共享文件权限与无障碍界面操作。
- 实测跨日整理、Obsidian 手工修改冲突和备份恢复。
- 实测安装回退、声音/音色稳定性、蓝狐动作与窗口交互。
- 后续另建电脑执行端；当前手机版不能直接修改电脑文件。
