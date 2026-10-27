"ui";
/* Import this once into the SAME AutoJs6 app. Config stays in jarvis_config_v2.
 * Checks a fixed public GitHub manifest. No GitHub tokens are stored on the phone.
 */
const ROOT = "/sdcard/Jarvis/App/";
const POINTER = ROOT + "state.json";
const ALLOWED = ["app.js", "CompanionCore.js", "Assets/blue-fox/atlas.png"];
let working = false;
const UPDATE_REPO = "lijun117992/jarvis-core-updates";
const UPDATE_MANIFEST = "https://raw.githubusercontent.com/" + UPDATE_REPO + "/main/update.json";
let pendingUpdate = null;
ui.layout(
    <vertical padding="24" bg="#101926">
        <text text="JARVIS / LAUNCHER 2.0" textColor="#AFCDF9" textSize="13sp" marginTop="20"/>
        <text text="小狐妖的固定入口" textColor="#F1F6FF" textSize="25sp" marginTop="12"/>
        <text text="以后只更新程序包。Key 和个人记忆沿用原位置。" textColor="#9BACBF" textSize="14sp" marginTop="10" marginBottom="24"/>
        <button id="launch" text="启动 / 重启小狐妖" bg="#B8D5FF" textColor="#18324F"/>
        <button id="checkUpdate" text="检查 GitHub 更新" marginTop="12"/>
        <button id="applyUpdate" text="下载、校验并安装更新" enabled="false" marginTop="8"/>
        <button id="install" text="安装下载目录里的最新更新包" marginTop="12"/>
        <button id="rollback" text="回退到上一版" marginTop="8"/>
        <text id="status" text="支持微信默认保存目录 Download/WeiXin，也支持 Download 顶层。更新包以 Jarvis-Core-v 开头，扩展名为 .zip。" textColor="#A7B9D0" textSize="14sp" marginTop="20"/>
        <text id="instructions" text="" textColor="#7F93AC" textSize="13sp" marginTop="18"/>
    </vertical>
);
ui.instructions.setText(["在线更新：检查更新 → 下载并安装 → 启动。", "网络不可用时仍可从微信目录安装。", "Key、记忆和候选音色保留在原 AutoJs6。"].join("\n"));
function message(s) { ui.run(function() { ui.status.setText(String(s)); }); }
function readState() {
    if (!files.exists(POINTER)) return { current: null, previous: null };
    let state = JSON.parse(files.read(POINTER));
    [state.current, state.previous].forEach(function(id) {
        if (id && !/^4\.[0-9]+\.[0-9]+(?:-[a-z0-9]+)?-[0-9]{13}$/.test(id)) throw Error("版本记录格式异常，未执行程序");
    });
    return state;
}
function writeState(state) {
    files.ensureDir(ROOT);
    let candidate = ROOT + "state-" + Date.now() + ".json";
    files.write(candidate, JSON.stringify(state, null, 2));
    let target = new java.io.File(POINTER), backup = new java.io.File(ROOT + "state-backup-" + Date.now() + ".json");
    if (target.exists() && !target.renameTo(backup)) throw Error("无法保留上一份版本记录");
    if (!new java.io.File(candidate).renameTo(target)) {
        if (backup.exists()) backup.renameTo(target);
        throw Error("版本指针写入失败，未应用新版本");
    }
}
function hex(bytes) {
    let s = ""; for (let i = 0; i < bytes.length; i++) s += ("0" + ((bytes[i] & 255).toString(16))).slice(-2); return s;
}
function digestFile(path) {
    let md = java.security.MessageDigest.getInstance("SHA-256"), input = new java.io.FileInputStream(path);
    let buffer = util.java.array("byte", 8192), n;
    try { while ((n = input.read(buffer)) !== -1) md.update(buffer, 0, n); }
    finally { input.close(); }
    return hex(md.digest());
}
function verifyRelease(id) {
    let dir = ROOT + "releases/" + id + "/";
    let manifest = JSON.parse(files.read(dir + "manifest.json"));
    validateManifest(manifest);
    ALLOWED.forEach(function(name) {
        if (!files.exists(dir + name) || digestFile(dir + name) !== manifest.files[name].sha256) throw Error("程序文件校验失败：" + name + "。可重新安装或回退");
    });
    return dir;
}
function validateManifest(m) {
    if (!m || m.project !== "Jarvis-Core" || m.schema !== 1 || m.entry !== "app.js" || !/^4\.[0-9]+\.[0-9]+(?:-[a-z0-9]+)?$/.test(m.version)) throw Error("不是兼容的 Jarvis v4 更新包");
    if (!m.files || Object.keys(m.files).length !== ALLOWED.length) throw Error("更新包文件清单不匹配");
    ALLOWED.forEach(function(name) {
        let item = m.files[name];
        if (!item || !/^[0-9a-f]{64}$/.test(item.sha256) || !Number.isInteger(item.bytes) || item.bytes < 1 || item.bytes > 20 * 1024 * 1024) throw Error("更新清单异常：" + name);
    });
}
function latestPackage() {
    let dirs = ["/sdcard/Download/WeiXin/", "/sdcard/Download/", "/sdcard/Downloads/WeiXin/", "/sdcard/Downloads/"], candidates = [];
    dirs.forEach(function(dir) {
        if (!files.exists(dir)) return;
        (files.listDir(dir) || []).forEach(function(name) {
            if (/^Jarvis-Core-v[^/\\]*\.zip$/i.test(name)) {
                let f = new java.io.File(dir + name);
                if (f.isFile()) candidates.push({ path: String(f.getAbsolutePath()), time: Number(f.lastModified()) });
            }
        });
    });
    candidates.sort(function(a,b) { return b.time-a.time; });
    if (!candidates.length) throw Error("未找到更新包。已检查 Download/WeiXin 和 Download 顶层。请保留 Jarvis-Core-v 开头的 zip 文件名，并允许 AutoJs6 访问文件");
    return candidates[0].path;
}
function readZipJson(zip, name) {
    let entry = zip.getEntry(name); if (!entry || entry.getSize() > 32768) throw Error("缺少或损坏的更新清单");
    let input = zip.getInputStream(entry), out = new java.io.ByteArrayOutputStream(), buffer = util.java.array("byte",4096), total=0,n;
    try { while ((n=input.read(buffer)) !== -1) { total+=n;if(total>32768)throw Error("清单过大");out.write(buffer,0,n); } }
    finally { input.close(); }
    return JSON.parse(String(new java.lang.String(out.toByteArray(), "UTF-8")));
}
function installPackage(packagePath, expectedVersion) {
    let zip = new java.util.zip.ZipFile(packagePath);
    try {
        let seen = {}, entries = zip.entries(), count=0;
        while (entries.hasMoreElements()) {
            let entry = entries.nextElement(), name=String(entry.getName());
            if (entry.isDirectory() || (ALLOWED.indexOf(name)<0 && name!=="manifest.json") || seen[name]) throw Error("更新包含不允许或重复的路径");
            seen[name]=true;count++;
        }
        if(count!==4)throw Error("更新包文件数量不正确");
        let m=readZipJson(zip,"manifest.json"); validateManifest(m);
        if (expectedVersion && m.version !== expectedVersion) throw Error("更新包内版本与线上清单不一致，未切换现有版本");
        let id=m.version+"-"+Date.now(), dir=ROOT+"releases/"+id+"/";
        ALLOWED.forEach(function(name) {
            let entry=zip.getEntry(name), input=zip.getInputStream(entry), output=null;
            let total=0,buffer=util.java.array("byte",8192),n;
            files.ensureDir(dir+name);
            try {
                output=new java.io.FileOutputStream(dir+name);
                while((n=input.read(buffer))!==-1) { total+=n;if(total>m.files[name].bytes)throw Error("文件尺寸超出清单");output.write(buffer,0,n); }
            } finally { input.close();if(output)output.close(); }
            if(total!==m.files[name].bytes || digestFile(dir+name)!==m.files[name].sha256)throw Error("更新包校验失败："+name);
        });
        files.write(dir+"manifest.json",JSON.stringify(m,null,2));
        let old=readState();writeState({current:id,previous:old.current||null});
        message("已安装 "+m.version+"。点击“启动 / 重启”。配置和个人记忆未移动。");
    } finally { zip.close(); }
}
function versionParts(version) {
    let match=/^4\.([0-9]+)\.([0-9]+)(?:-([a-z]+)([0-9]*))?$/.exec(String(version));
    if (!match) throw Error("无法比较版本：" + version);
    return [Number(match[1]),Number(match[2]),match[3]||"",Number(match[4]||0)];
}
function compareVersions(a,b) {
    let x=versionParts(a),y=versionParts(b);
    for(let i=0;i<2;i++)if(x[i]!==y[i])return x[i]>y[i]?1:-1;
    if(x[2]!==y[2])return !x[2]?1:!y[2]?-1:x[2]>y[2]?1:-1;
    return x[3]===y[3]?0:x[3]>y[3]?1:-1;
}
function validateUpdate(info) {
    if(!info||info.project!=="Jarvis-Core"||info.schema!==1||info.channel!=="preview")throw Error("更新清单格式不正确");
    versionParts(info.version);
    if(!Number.isInteger(info.minLauncher)||info.minLauncher<1)throw Error("启动器最低版本字段不正确");
    if(info.minLauncher>2)throw Error("该版本需要更新启动器，请查看发布说明");
    let expected="https://github.com/"+UPDATE_REPO+"/releases/download/v"+info.version+"/Jarvis-Core-v"+info.version+".zip";
    if(info.url!==expected||!/^[0-9a-f]{64}$/.test(info.sha256)||!Number.isInteger(info.bytes)||info.bytes<1||info.bytes>25*1024*1024)throw Error("下载地址、大小或校验值不正确");
    if(typeof info.notes!=="string"||info.notes.length>5000)throw Error("更新说明不正确");
    return info;
}
function fetchUpdate() {
    let r=http.get(UPDATE_MANIFEST+"?t="+Date.now(),{headers:{"Cache-Control":"no-cache","User-Agent":"Jarvis-Launcher/2"}});
    if(r.statusCode!==200)throw Error("更新清单 HTTP "+r.statusCode+"。可继续运行已安装版本，或使用离线安装");
    let body=String(r.body.string());if(body.length>32768)throw Error("更新清单过大");
    return validateUpdate(JSON.parse(body));
}
function currentVersion() {
    let state=readState();
    if(!state.current)return null;
    let m=JSON.parse(files.read(ROOT+"releases/"+state.current+"/manifest.json"));validateManifest(m);return m.version;
}
function downloadUpdate(info) {
    validateUpdate(info);
    let url=info.url,connection=null,input=null,output=null;
    let path=ROOT+"updates/"+info.version+"-"+Date.now()+".zip.part";
    files.ensureDir(path);
    try {
        // Only GitHub HTTPS release/CDN redirects; no auth headers or credentials.
        for(let redirect=0;redirect<6;redirect++){
            let parsed=new java.net.URL(url),host=String(parsed.getHost());
            if(String(parsed.getProtocol())!=="https"||["github.com","release-assets.githubusercontent.com","objects.githubusercontent.com"].indexOf(host)<0)throw Error("下载跳转到非预期地址");
            connection=parsed.openConnection();connection.setConnectTimeout(20000);connection.setReadTimeout(60000);connection.setInstanceFollowRedirects(false);connection.setRequestProperty("User-Agent","Jarvis-Launcher/2");
            let code=connection.getResponseCode();
            if([301,302,303,307,308].indexOf(code)>=0){let location=connection.getHeaderField("Location");if(!location)throw Error("下载跳转缺少地址");url=String(new java.net.URL(parsed,location));connection.disconnect();connection=null;continue;}
            if(code!==200)throw Error("下载 HTTP "+code);
            input=connection.getInputStream();break;
        }
        if(!input)throw Error("下载跳转次数过多");
        output=new java.io.FileOutputStream(path);
        let md=java.security.MessageDigest.getInstance("SHA-256"),buffer=util.java.array("byte",8192),total=0,n;
        while((n=input.read(buffer))!==-1){total+=n;if(total>info.bytes)throw Error("下载尺寸超出清单，未安装");output.write(buffer,0,n);md.update(buffer,0,n);}
        output.close();output=null;
        if(total!==info.bytes||hex(md.digest())!==info.sha256)throw Error("下载不完整或 SHA-256 校验失败，未安装");
        return path;
    } finally {if(output)output.close();if(input)input.close();if(connection)connection.disconnect();}
}
ui.checkUpdate.on("click",function(){runTask(function(){
    pendingUpdate=null;ui.run(function(){ui.applyUpdate.setEnabled(false);});message("正在检查 GitHub 更新…");
    let info=fetchUpdate(),current=currentVersion();
    if(current&&compareVersions(info.version,current)<=0){message("当前已是 "+current+"，没有更新。");return;}
    pendingUpdate=info;ui.run(function(){ui.applyUpdate.setEnabled(true);});
    message("可更新到 "+info.version+"\n"+info.notes+"\n下载约 "+(info.bytes/1024/1024).toFixed(1)+" MB。点击下载并安装。");
});});
ui.applyUpdate.on("click",function(){runTask(function(){
    if(!pendingUpdate)throw Error("请先检查更新");
    let info=pendingUpdate;message("正在下载并校验 "+info.version+"…");
    let packagePath=downloadUpdate(info);installPackage(packagePath,info.version);
    pendingUpdate=null;ui.run(function(){ui.applyUpdate.setEnabled(false);});
});});
function runTask(fn) {
    if(working)return;working=true;
    threads.start(function(){try{fn();}catch(e){message("未完成："+String(e));}finally{working=false;}});
}
ui.install.on("click",function(){runTask(function(){message("正在验证并安装本地更新包…");installPackage(latestPackage());});});
ui.launch.on("click",function(){runTask(function(){
    let state=readState();if(!state.current)throw Error("请先安装更新包");
    let dir=verifyRelease(state.current);
    engines.all().forEach(function(engine){
        let source=String(engine.source||"");
        if(source.indexOf(ROOT+"releases/")===0 && /\/app\.js$/.test(source))engine.forceStop();
    });
    engines.execScriptFile(dir+"app.js");message("已启动 "+state.current);
});});
ui.rollback.on("click",function(){runTask(function(){
    let state=readState();if(!state.previous)throw Error("还没有上一版可回退");
    verifyRelease(state.previous);writeState({current:state.previous,previous:state.current});
    message("已切换上一版。点击“启动 / 重启”生效。");
});});
