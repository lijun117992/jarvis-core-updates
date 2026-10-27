# Jarvis Core 工作规则

1. **开工先查看 GitHub 更新记录**：运行 `python scripts/check_remote.py`，核对近期 commits、Releases、main/update.json、HEAD 与 origin/main。旧聊天、本地文件和本文不能代替线上核对；无网络不得宣称已核对最新版或发布。
2. 本地干净且仅落后时才 `git pull --ff-only`；有未提交改动或分叉时先审查差异，禁止 reset/force push 覆盖任一端工作。
3. 可编辑源码是 src/app.js、src/CompanionCore.js、src/Assets/blue-fox/atlas.png，启动器在 launcher/；dist/ 只是产物。本地和 GitHub 网页均修改这套文件。
4. 不再运行仓库外旧 v3→v4 生成器覆盖 src/app.js；那些文件只作历史档案，不能覆盖远端更新。
5. 保持原 AutoJs6 的 jarvis_config_v2 与 /sdcard/Jarvis/Memory/。不得随更新清空或迁移 Key、个人记忆、音色候选。不得把截图、真实聊天/通知、Token、用户 ID 名单提交到公共仓库。
6. 改完运行 `node scripts/test.cjs`，再 `python scripts/package.py`。解析和模拟不等于安卓运行或美术验收。
7. 程序变更要升 version.json/package.json 版本并补 CHANGELOG；纯文档变更无需发手机包。源提交不等于手机更新，update.json 只指已发布附件。
8. 发布需明确授权。禁止覆盖旧 tag/附件；先上传并匿名校验 Release 附件，最后更新 main/update.json。失败不切换、保留手动回退；不自动增设 CI/CD。
9. 普通回答整段合成，固定本段音色/参数；切换对下一次回答生效。Fish 标签只进入专用语音文本，气泡和系统 TTS 用干净正文。
10. 用户已要求微信/QQ/钉钉通知默认分析并移除勾选项；权限仍须系统授权，通知分析失败不阻止召唤。读屏须用户主动预览再发送，不宣称持续看屏幕/截图识图/自动发消息。
11. ERROR_CLIENT(5) 不等于缺权限；前台也失败是已反馈事实，兼容语音页面未真机确认。未接云 ASR，未经授权不得付费调用。
12. 系统声音默认跟随系统，不用 setLanguage() 重置；getVoices() 为空不能说手机没有音色。首次 floaty 需等控件创建后绑定事件。
13. 保持蓝狐男孩身份；新图集核对源矩形、透明度和基线，生成提交不等于视觉通过。

状态与边界：docs/HANDOFF.md。双向维护与发布：docs/MAINTENANCE.md。历史：CHANGELOG.md。
