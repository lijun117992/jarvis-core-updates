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

本轮准备发布 **preview18测试更新**，实际手机通道以[update.json](update.json)及对应Release为准。源码、标签与附件校验完成前不能说手机已经可更新。用户要求后续仅经GitHub交付，不再直接操作手机。

preview18包含自绘历史浮层、2秒静音结束、无执行统计的自然回复、当前指令/旧任务隔离，以及系统TTS文件播放与真实静音前导。原生通知桥、独立跨渠道模型、秘书式通知与运行期提醒继续保留；Key/个人记忆/音色不迁移。

290项桌面回归通过；WAV采样与长度、静音门限、取消、历史层次、限次兼容尝试和当前问题优先均为主机验证。系统声音首尾、文件合成引擎兼容、网关间歇422和手机浮层交互仍待用户实测。未宣称所有幻觉、后台强停或语音问题已消除。

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
