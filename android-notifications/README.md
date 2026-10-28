# Jarvis 通知桥

## Overview

原生 Android NotificationListenerService 和私有 SQLite 接收端。微信、QQ、钉钉实际通知先落盘，再通过用户授予的只读 ContentProvider 交给 AutoJs6 分析。不带 Key、联网/录音/全文件权限。完整说明见 [原生接入与验收](../docs/NATIVE_NOTIFICATIONS.md)。

## Status

0.1.0-preview，Android 9+，编译 SDK35。已构建签名 APK并通过主机检查，未连接安卓设备。可独立于脚本接收不等于不可被系统终止；强停/权限/OPPO 后台策略需实机验证。

## Todo

- 验证 OPPO Android16 的只读持久授权、锁屏/重启/强停、队列补收和通知跳转。
- 验证保留/清除/撤销授权和 UI 实际显示。
- 真机验收后再决定合并和公开发布，不修改现有手机更新指针。
