# Jarvis Core · 蓝狐小伙伴

## Overview

AutoJs6 安卓悬浮助手。这个公开仓库维护可编辑源码与手机更新通道，支持本地和 GitHub 网页修改同一套文件。

**每次开工先运行 `python scripts/check_remote.py` 查看 GitHub 最近提交、Releases 和 update.json，核对最新版再修改。** 不能以旧聊天或本地版本号代替远端核对。

- [项目交接](docs/HANDOFF.md)：现状、故障证据、边界与待验收。
- [维护与发布](docs/MAINTENANCE.md)：本地/GitHub 双向修改、检查、打包、发布。
- [工作规则](AGENTS.md)、[变更记录](CHANGELOG.md)。

手机首次导入 [启动器 2.0](https://github.com/lijun117992/jarvis-core-updates/releases/download/v4.0.0-preview6/Jarvis_Launcher-v2.js)，点击检查更新、下载安装、启动。Key、记忆、音色名单留在原 AutoJs6，不上传本仓库。

## Status

当前已发布程序是 [4.0.0-preview6](https://github.com/lijun117992/jarvis-core-updates/releases/tag/v4.0.0-preview6)，手机指针见 [update.json](update.json)。本轮加入源码与文档，不改变已发布程序包。

已有八状态蓝狐、悬浮输入/回复、系统/Fish 选择、整段自动朗读、多音色候选、主动无障碍文字预览、可选通知分析、在线/离线更新与回退。35 项应用与 7 项更新器桌面检查通过，匿名下载/哈希检查通过；GitHub 全新克隆的依赖安装、检查、打包及源文件基线校验也已通过。

尚未完整手机验收。旧系统直接识别在前台也报 5，preview6 设备端/语音页面路径仍需实测。实际音色稳定性、动画与在线安装也不能仅靠桌面检查认定通过。

开发环境：Python 3.10+、Git、GitHub CLI、Node 22.18+ 或 24.11+。

```text
npm ci
node scripts/test.cjs
python scripts/package.py
```

正式源码在 src/，启动器在 launcher/，dist/ 只存产物。打包不会发布；网页保存不会自动更新手机。未配置 GitHub Actions。公开可下载不等于任意使用许可，当前未添加开源 LICENSE。

## Todo

- 真机在线安装/回退、配置保留。
- 设备端/系统语音页面测试，定位 ERROR_CLIENT(5)。
- 系统/Fish 整段声音、音色与失败回退验收。
- 蓝狐动作、镜像耳朵、键盘/气泡/触摸与屏幕适配验收。
