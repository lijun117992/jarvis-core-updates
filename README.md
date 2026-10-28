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

已发布 [preview19 离线听写接入测试更新](https://github.com/lijun117992/jarvis-core-updates/releases/tag/v4.0.0-preview19)，程序 ZIP 与启动器已匿名校验，main/update.json 已指向 preview19。手机用原启动器检查 GitHub 更新即可安装；此次不修改通知桥 APK，也不远程操作手机。

[手机离线听写试用](docs/OFFLINE_DICTATION.md)：安装上游 Offline Voice Input 无模型小包及 SenseVoice Small 中文 GGUF，听写方式选择系统直接识别。修正 Android 标准服务发现权限名称；不变更用户原有默认听写配置，不迁移 Key、音色或记忆。292 项主机检查通过，手机安装、中文准确率、后台麦克风与包可见性仍待用户实测。

preview18 的自绘历史浮层、系统 TTS 文件播放与真实静音前导、2秒无声结束、自然回复及当前指令隔离继续保留。系统声音首尾、网关间歇422与后台通知尚不保证已解决。

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
