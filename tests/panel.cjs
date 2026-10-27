const fs=require('fs'),path=require('path'),assert=require('assert/strict'),vm=require('vm'),parser=require('@babel/parser');
const source=fs.readFileSync(path.join(__dirname,'../src/app.js'),'utf8');
const tree=parser.parse(source,{plugins:['jsx']});
function load(names,env){const b=vm.createContext(env);vm.runInContext(names.map(name=>{const f=tree.program.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name===name);assert(f,name);return source.slice(f.start,f.end)}).join('\n'),b);return b;}
let total=0;function test(name,f){f();total++;console.log('PASS '+name);}
const layout=tree.program.body.find(n=>n.type==='ExpressionStatement'&&n.expression.callee?.object?.name==='ui'&&n.expression.callee?.property?.name==='layout').expression.arguments[0];
const ids=new Map();
function walk(node,fn){if(!node||typeof node!=='object')return;fn(node);for(const [key,value]of Object.entries(node)){if(key==='loc')continue;if(Array.isArray(value))value.forEach(n=>walk(n,fn));else if(value&&typeof value==='object')walk(value,fn);}}
walk(layout,n=>{if(n.type==='JSXOpeningElement'){const attrs=Object.fromEntries(n.attributes.filter(a=>a.type==='JSXAttribute').map(a=>[a.name.name,a.value?.value]));if(attrs.id){assert(!ids.has(attrs.id),'duplicate main view '+attrs.id);ids.set(attrs.id,attrs);}}});
test('initial panel hides voice details and diagnostics; removed notification and mode controls',()=>{
 for(const name of ['systemPane','fishPane','fishEditPane','fishVoiceManager','voiceTuning','morePane','connectionPane'])assert.equal(ids.get(name)?.visibility,'gone',name);
 for(const name of ['notifications','voiceMode','systemVoice','overlayPerm','micPerm','accessPerm','noticePerm','refreshTts'])assert(!ids.has(name),name);
});
test('all main-panel event bindings resolve to existing views',()=>{
 walk(tree,n=>{if(n.type==='CallExpression'&&n.callee.type==='MemberExpression'&&n.callee.property.name==='on'&&n.callee.object.type==='MemberExpression'&&n.callee.object.object.name==='ui')assert(ids.has(n.callee.object.property.name),n.callee.object.property.name);});
});
test('new and management are separate and import has no extra action controls',()=>{
 for(const id of ['addFishVoice','manageFishVoices','openBatchImport','fishBatchPane'])assert(ids.has(id),id);
 for(const id of ['editFishVoice','voiceImportOverwrite','previewVoiceImport','applyVoiceImport','clearVoiceSelection','voiceRenamePrefix'])assert(!ids.has(id),id);
 let manager;walk(layout,n=>{if(n.type==='JSXElement'&&n.openingElement.attributes.some(a=>a.name?.name==='id'&&a.value?.value==='fishVoiceManager'))manager=n;});
 const nested=[];walk(manager,n=>{if(n.type==='JSXAttribute'&&n.name.name==='id')nested.push(n.value.value);});
 assert(!nested.includes('voiceBatchInput'));assert(!nested.includes('voice'));assert(nested.includes('deleteSelectedVoices'));assert(nested.includes('renameSelectedVoices'));
});
test('two provider choices are exclusive, preserve settings on reveal and reject unknown modes',()=>{
 const writes={},ui={},visible=0,gone=8;for(const id of ['systemPane','fishPane','voiceTuning','systemPitchGroup','voiceSummary','chooseSystem','chooseFish'])ui[id]={setVisibility(v){this.visibility=v},setText(v){this.text=v}};
 let sync=0;const b=load(['chooseVoice'],{C:{provider:'system',voice:'saved-id'},ui,V:{VISIBLE:visible,GONE:gone},store:{put:(k,v)=>writes[k]=v},rounded:()=>{},cancelAutoFishImport:()=>{},syncVoiceSettings:()=>sync++});
 b.chooseVoice('fish');assert.equal(ui.systemPane.visibility,gone);assert.equal(ui.fishPane.visibility,visible);assert.equal(ui.systemPitchGroup.visibility,gone);assert.equal(writes.voiceProviderV4,'fish');assert.equal(b.C.voice,'saved-id');
 b.chooseVoice('system');assert.equal(ui.systemPane.visibility,visible);assert.equal(ui.fishPane.visibility,gone);assert.equal(ui.systemPitchGroup.visibility,visible);assert.equal(writes.voiceProviderV4,'system');
 b.chooseVoice('auto');assert.equal(sync,2);assert.equal(b.C.provider,'system');
});
test('saving collapsed settings keeps provider, follows system voice and enables notifications',()=>{
 const data={},ui={connectionSummary:{setText:()=>{}},url:{text:()=> 'https://example.com'},key:{text:()=> 'test-key'},model:{text:()=> 'model'},fishKey:{text:()=> ''},voice:{text:()=> ''},autoSpeak:{isChecked:()=>true},speechRate:{getProgress:()=>64},systemPitch:{getProgress:()=>34},rateLabel:{setText:()=>{}},pitchLabel:{setText:()=>{}}};
 const b=load(['saveConfig','syncVoiceSettings','normalizeApiUrl'],{C:{provider:'fish',voice:'saved-id',systemVoice:'old-app-override'},ui,Companion:require('../src/CompanionCore.js'),clamp:(n,a,z)=>Math.max(a,Math.min(z,n)),store:{put:(k,v)=>data[k]=v}});b.saveConfig();
 assert.equal(data.voiceProviderV4,'fish');assert.equal(data.systemVoiceChoiceV43,'');assert.equal(data.notificationsV3,true);assert.equal(data.voiceId,'saved-id');assert.equal(data.speechRateV4,1.14);assert.equal(data.autoSpeakV3,true);
});
test('permission entry skips granted permissions and never opens settings when ready',()=>{
 let requested=[],checks=[true,true,true,false],messages=[];
 const b=load(['setupNextPermission'],{permissionState:()=>checks,settings:a=>requested.push(a),status:t=>messages.push(t),safeError:String});
 b.setupNextPermission();assert.deepEqual(requested,['android.settings.ACTION_NOTIFICATION_LISTENER_SETTINGS']);checks=[true,true,true,true];b.setupNextPermission();assert.equal(requested.length,1);assert(messages.at(-1).includes('无需重复授权'));
});
test('notification access matches exact package rather than substring',()=>{
 let listeners='org.example.jarvis.other/Listener';const b=load(['permissionState'],{context:{getPackageName:()=> 'org.example.jarvis',getContentResolver:()=>({}),checkSelfPermission:()=>0},auto:{service:{}},hasOverlayPermission:()=>true,android:{os:{Build:{VERSION:{SDK_INT:33}}},provider:{Settings:{Secure:{getString:()=>listeners}}}}});
 assert.equal(b.permissionState()[3],false);listeners+=':org.example.jarvis/Listener';assert.equal(b.permissionState()[3],true);
});
console.log(JSON.stringify({tests:total,passed:total,nativeUI:'NOT RUN'}));
