# 本地与 GitHub 双向维护

## 工作前核对

```text
python scripts/check_remote.py
git status --short
git log -5 --oneline origin/main
```

脚本 fetch refs，并读取 GitHub 近期提交、Release、main/update.json，结果保存在忽略的 .work/remote-check.json。需区分“最新源码”“最新 Release”“手机通道指向版本”。远端落后/分叉状态未核清前禁止拿旧本地文件覆盖。

本地干净且仅落后时 `git pull --ff-only`；有修改则先查看 git diff 并保存/协调，分叉需审查合并，不自动丢弃工作、不强推。

## 在本地或 GitHub 修改

修改 src/app.js（安卓 UI/识别/声音/气泡/通知）、src/CompanionCore.js（纯逻辑与帧元数据）、launcher/Jarvis_Launcher-v2.js（更新器）。src 是正式可维护源码，不再依赖本机历史生成器。

GitHub 网页可直接编辑同样文件并提交，或用分支/PR。回到本地必须先重新核对远端并拉取，再测试、打包和发布。**网页保存源码不会自动打包或推送到手机。** 仓库未配置 GitHub Actions；纯云端自动发布需另行确认 CI/CD 方案。

## 检查与打包

依赖：Python 3.10+、Git、正常登录的 GitHub CLI、Node 22.18+ 或 24.11+。

```text
npm ci
node scripts/test.cjs
python scripts/package.py
```

也可 npm test；本机 npm 子 shell 曾无法解析 node，直接执行上述 test.cjs 已验证，无需修改全局环境。检查为 35 应用 + 7 更新器 + 15 音色批量管理桌面模拟，共 57 项，无真实语音/付费请求。

打包仅取 src/ 的三项文件，写 dist/ 下 ZIP、manifest.json 和 update.json，不上传、不读手机配置、不改根目录已发布指针。源版本从 version.json 读取。程序改动升新版本，并同步 package.json 与 CHANGELOG；不要把旧 tag 附件覆盖成新代码。

**当前 src 与 preview6 原包内文件字节一致。但新打包器固定 ZIP 元数据，重打 preview6 的 ZIP 整体 SHA 会变。不得覆盖旧附件；未来改动必须升版。** 原文件基线在 releases/4.0.0-preview6-source.json。

## 发布

`python scripts/release.py` 默认只检查/显示计划；完成审查并得到发布授权后，才可 `python scripts/release.py --publish --confirm-public`。

脚本要求源码已提交并推送、工作树干净、版本大于线上且 tag 不存在。先检查/打包，上传与源提交绑定的 Release 包及启动器，匿名下载校验成功后，最后用文件 SHA 并发检查更新 main/update.json。失败不强推、不覆盖旧包。若附件已发而指针更新失败，手机继续看到旧版，应核对远端后单独恢复发布。

启动器 2.0 不会自我替换；改启动器时需说明重新导入要求，不可只提高 minLauncher 却不给升级路径。旧离线安装仍查 Download/WeiXin 和 Download 顶层。

## 数据与真机

配置仍在原 AutoJs6 jarvis_config_v2；记忆在 /sdcard/Jarvis/Memory/。程序版本在 /sdcard/Jarvis/App/releases/，当前/上一版由 App/state.json 指向。更新不得清除这些数据。

安装/回退、麦克风、系统/Fish 音色、字幕节奏、蓝狐动画、键盘/触摸需真机验证，不能把桌面通过当作验收。
