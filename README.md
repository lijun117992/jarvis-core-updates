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

preview21候选改用透明前台Activity录音入口，停止使用实测报9的RecognitionService链。另附离线APK v0.4，和已安装v0.2同包名/同签名、版本递增，覆盖安装保留模型。步骤与边界见[离线听写](docs/OFFLINE_DICTATION.md)。不是后台录音服务，切换应用可能取消；系统隐私指示与麦克风权限检查保留。

303项主机回归通过，APK升级身份/对齐/DEX受限修改和原生库一致性通过。未操作手机；错误9根因仍未由日志锁定，OPPO透明入口收音、闪屏和生命周期未实测。发布状态看main/update.json及Release附件。

听写仅保留MiMo与手机离线两项，离线隐藏MiMo模型，测试跟随方式。原Key、音色、记忆不迁移；不需电脑运行，识别文字仍由配置的大脑接口处理。原通知桥APK不变。

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
