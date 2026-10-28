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

[preview20 测试更新](https://github.com/lijun117992/jarvis-core-updates/releases/tag/v4.0.0-preview20)已发布，ZIP/启动器/离线适配APK/许可说明均匿名下载校验，main/update.json已切换；298项主机检查通过：听写仅保留 MiMo 与手机离线两项；离线模式隐藏 MiMo 模型配置，测试跟随选中方式，不再启动底部兼容面板。页脚版本同步为 preview20。

[离线听写步骤](docs/OFFLINE_DICTATION.md)：本次另附“Jarvis 离线听写（测试）”独立 APK，保留上游识别代码，补充 AutoJs6 调用可见性。需手动安装、允许麦克风、重新导入已有 SenseVoice GGUF；原版可保留回退。APK签名/16KB对齐/原DEX与本地库字节一致性已核查，包含上游MIT许可及修改说明。无模型、联网权限、Key或个人数据；不需电脑常驻。

用户已确认原版兼容页面中文可用，直接识别报9。适配包是否解除 OPPO Android16 的权限失败仍待用户测试；无界面服务不创建兼容面板，系统麦克风隐私指示保留。发布状态以 main/update.json 和 Release 附件为准。后续仅经GitHub交付，不直接操作手机。

preview18 的系统语音文件播放、历史浮层与当前问题隔离继续保留；声音首尾、网关间歇422和后台通知尚不保证已解决。Key、音色、记忆不迁移。

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
