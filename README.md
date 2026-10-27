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

手机已发布版本始终以 [update.json](update.json) 与对应 Release 为准；当前源码与手机通道均为 preview12，公开附件大小/哈希和更新指针已验证。新增 MiMo 中转站听写、当前视觉模型截图理解、手机文件/界面工具、当天持久上下文及每日整理。使用方式与权限见 [Agent 使用说明](docs/AGENT_GUIDE.md)。

保留八状态蓝狐、淡蓝悬浮输入/回复、系统/Fish 整段自动朗读、多音色候选批量管理，以及在线更新与回退。现有 User_Persona.md、人际关系表.md 手工内容保留，配置与 Key 留在手机。

173 项桌面检查通过，覆盖模拟 API、合成录音和隔离文件执行；尚未进行安卓实机验收或真实付费 API 调用。OPPO 原系统识别入口已确认缺失，新增 relay ASR 代替默认路径，不能仅凭桌面结果宣称收音已修复。

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
