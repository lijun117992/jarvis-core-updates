const fs=require('fs'),path=require('path'),assert=require('assert/strict'),vm=require('vm');
const parser=require('@babel/parser');
const project=path.resolve(__dirname,'..'), dir=path.join(project,'src');
const core=require(path.join(dir,'CompanionCore.js'));
const app=fs.readFileSync(path.join(dir,'app.js'),'utf8'),launcher=fs.readFileSync(path.join(project,'launcher/Jarvis_Launcher-v2.js'),'utf8');
fs.mkdirSync(path.join(project,'.work'),{recursive:true});
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name)}
test('startup resolves its directory without files.dirname',()=>{
  const expected='/sdcard/Jarvis/App/releases/4.0.0-preview2-1793074161921';let required;
  const sandbox=vm.createContext({engines:{myEngine:()=>({source:expected+'/app.js'})},files:{join:(a,b)=>a+'/'+b},
    java:{io:{File:function(p){this.getParent=()=>p.slice(0,p.lastIndexOf('/'));}}},require:p=>{required=p;return core;}});
  vm.runInContext(app.split('\n').slice(0,3).join('\n'),sandbox);
  assert.equal(required,expected+'/CompanionCore.js');
});
function load(src,names,env){const tree=parser.parse(src,{plugins:['jsx']}),box=vm.createContext(env);const parts=names.map(name=>{const n=tree.program.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name===name);assert(n,name);return src.slice(n.start,n.end)});vm.runInContext(parts.join('\n'),box);return box;}
test('app, core and launcher JS all parse',()=>{parser.parse(app,{plugins:['jsx']});parser.parse(launcher,{plugins:['jsx']});parser.parse(fs.readFileSync(path.join(dir,'CompanionCore.js'),'utf8'));});
test('first overlay is created off UI thread before view event binding',()=>{
  const n=parser.parse(app,{plugins:['jsx']}).program.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='createOrb');
  const src=app.slice(n.start,n.end).replace(/floaty\.rawWindow\([\s\S]*?\);/,'floaty.rawWindow(null);');
  let worker=false,threadJob,uiJob,ready=false,bound=false;
  const win={setSize:()=>{},setPosition:()=>{},art:{on:()=>bound=true},touch:{setOnTouchListener:()=>{}},close:()=>{}};
  const box=vm.createContext({threads:{start:f=>threadJob=f},main:f=>uiJob=f,loadAvatar:()=>{},floaty:{rawWindow:()=>{assert(worker,'rawWindow must wait for native creation on worker');return win}},dp:n=>n,orbSize:96,screenW:1080,screenH:2400,drawAvatar:()=>{},scheduleDock:()=>{}});
  vm.runInContext(src,box);box.createOrb(()=>ready=true,e=>{throw e});assert(!bound);worker=true;threadJob();worker=false;assert(!bound);uiJob();assert(bound&&ready);
});
test('system-default voice is not reset by language or explicit voice calls',()=>{
  let speed,pitch;
  const box=load(app,['initializeSystemLanguage','configureSystemVoice'],{tts:{setLanguage:()=>{throw Error('must not reset language')},setVoice:()=>{throw Error('must preserve engine choice')},setSpeechRate:v=>speed=v,setPitch:v=>pitch=v},C:{systemVoice:'',speechRate:1.14,pitch:.67},systemVoiceOptions:[null],Companion:core});
  box.initializeSystemLanguage();box.configureSystemVoice();assert.equal(speed,1.14);assert.equal(pitch,.67);
});
test('private/empty vendor voice list retains a truthful system-default option',()=>{
  let labels;
  const box=load(app,['populateSystemVoices'],{tts:{getVoices:()=>null},systemVoiceOptions:[],C:{systemVoice:''},ui:{systemVoice:{setSelection:()=>{}}},lightSpinner:(s,v)=>labels=v,status:()=>{},safeError:String,setTimeout:f=>f(),main:f=>f()});
  box.populateSystemVoices();assert.equal(box.systemVoiceOptions.length,1);assert.equal(labels[0],'跟随系统设置（保留当前音色）');
});
test('voice locale aliases zho and cmn are included',()=>{
  const voices=['zho','cmn','zh','en'].map((lang,i)=>({getLocale:()=>({getLanguage:()=>lang,getCountry:()=>lang==='en'?'US':'CN'}),getName:()=>String(i),isNetworkConnectionRequired:()=>false}));let at=0;
  const box=load(app,['populateSystemVoices'],{tts:{getVoices:()=>({iterator:()=>({hasNext:()=>at<voices.length,next:()=>voices[at++]})})},C:{systemVoice:''},systemVoiceOptions:[],ui:{systemVoice:{setSelection:()=>{}}},lightSpinner:()=>{},status:()=>{},safeError:String,setTimeout:f=>f(),main:f=>f()});box.populateSystemVoices();assert.equal(box.systemVoiceOptions.length,4);
});
test('client error five is diagnostic rather than asserted background denial',()=>{
  const b=load(app,['recognitionFailure'],{android:{provider:{Settings:{Secure:{getString:()=> 'vendor/Recognizer'}}}},context:{getContentResolver:()=>({})}});
  const text=b.recognitionFailure(5);assert(text.includes('ERROR_CLIENT'));assert(text.includes('vendor/Recognizer'));assert(text.includes('不能仅据此断定'));
});
test('device recognizer is preferred only when supported, explicit direct mode preserved',()=>{
 const calls=[];
 const recognizer={isOnDeviceRecognitionAvailable:()=>true,createOnDeviceSpeechRecognizer:()=>{calls.push('local');return{}},createSpeechRecognizer:()=>{calls.push('default');return{}}};
 const androidStub={os:{Build:{VERSION:{SDK_INT:31}}},speech:{SpeechRecognizer:recognizer}};
 const b=load(app,['onDeviceRecognitionAvailable','createRecognizer'],{recognitionMode:'auto',activity:{},status:()=>{},resolveRecognitionComponent:()=>null,android:androidStub});
 b.createRecognizer();b.recognitionMode='direct';b.createRecognizer();assert.deepEqual(calls,['local','default']);
});
test('compatibility test returns text without invoking the model',()=>{
 let displayed,sent=0;const b=load(app,['handleCompatibilityResult'],{COMPAT_SPEECH_REQUEST:7406,compatRecognition:{testOnly:true},main:f=>f(),stopListening:()=>{b.compatRecognition=null},status:()=>{},showAnswer:(title,text)=>displayed=text,processUserCommand:()=>sent++,android:{app:{Activity:{RESULT_OK:-1}},speech:{RecognizerIntent:{EXTRA_RESULTS:'results'}}}});
 b.handleCompatibilityResult(7406,-1,{getStringArrayListExtra:()=>({size:()=>1,get:()=> '听写测试'})});assert(displayed.includes('听写测试'));assert.equal(sent,0);assert.equal(b.compatRecognition,null);
});
test('cancelled compatibility input never creates a command',()=>{let sent=0;const b=load(app,['handleCompatibilityResult'],{COMPAT_SPEECH_REQUEST:7406,compatRecognition:{testOnly:false},main:f=>f(),stopListening:()=>{b.compatRecognition=null},status:()=>{},processUserCommand:()=>sent++,android:{app:{Activity:{RESULT_OK:-1}}}});b.handleCompatibilityResult(7406,0,null);assert.equal(sent,0);assert.equal(b.compatRecognition,null)});
test('input bubble uses opaque light palette and matches reply width',()=>{
  const n=parser.parse(app,{plugins:['jsx']}).program.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='openEditor');const s=app.slice(n.start,n.end);
  assert(s.includes('#FFEDF4FF'));assert(s.includes('#172C48'));assert(s.includes('Math.min(dp(284)'));assert(s.includes('Companion.bubble('));
  assert(app.includes('Theme_Material_Light'));assert(app.includes('ui.testRecognition.on("click", function() { startListening(true); })'));
});
test('launcher finds WeChat-saved packages and compares timestamps with top-level files',()=>{
  const wx='/sdcard/Download/WeiXin/',top='/sdcard/Download/';let includeTop=false;
  const table={[wx+'Jarvis-Core-v4.0.0-preview2 (1).zip']:200,[top+'Jarvis-Core-v4.0.0-preview1.zip']:100};
  const b=load(launcher,['latestPackage'],{files:{exists:p=>p===wx||(includeTop&&p===top),listDir:p=>p===wx?['unrelated.zip','Jarvis-Core-v4.0.0-preview2 (1).zip']:['Jarvis-Core-v4.0.0-preview1.zip']},
    java:{io:{File:function(p){this.isFile=()=>p in table;this.getAbsolutePath=()=>p;this.lastModified=()=>table[p];}}}});
  assert.equal(b.latestPackage(),wx+'Jarvis-Core-v4.0.0-preview2 (1).zip');
  includeTop=true;assert.equal(b.latestPackage(),wx+'Jarvis-Core-v4.0.0-preview2 (1).zip');
  table[top+'Jarvis-Core-v4.0.0-preview1.zip']=300;assert.equal(b.latestPackage(),top+'Jarvis-Core-v4.0.0-preview1.zip');
});
test('all eight states expose exactly eight bounded frame source rectangles',()=>{for(const s of core.states){const seen=new Set;for(let i=0;i<8;i++){const f=core.frame(s,Math.ceil(i*1000/core.fps[core.states.indexOf(s)]),1254,1254);seen.add(f.col);assert(f.left>=0&&f.top>=0&&f.right<=1254&&f.bottom<=1254&&f.right>f.left&&f.bottom>f.top)}assert.equal(seen.size,8)}});
test('all sprite destinations fit the viewport and keep a shared foot baseline',()=>{for(const s of core.states)for(let i=0;i<8;i++){const f=core.frame(s,i*210,1254,1254),d=core.destination(f,96);assert(d.x>=0&&d.y>=0);assert(d.x+d.width<=96&&d.y+d.height<=96);assert(Math.abs(d.y+d.height-96*.94)<.001)}});
test('listening always mirrors toward screen center',()=>{assert(core.mirror(100,1080));assert(!core.mirror(980,1080));assert(!core.mirror(540,1080))});
test('behavior priorities override decorative moods',()=>{assert.equal(core.chooseState(true,true,true,'HAPPY'),'LISTENING');assert.equal(core.chooseState(false,true,true,'CRYING'),'THINKING');assert.equal(core.chooseState(false,false,true,'CRYING'),'WORKING');assert.equal(core.chooseState(false,false,false,'CRYING'),'CRYING')});
test('bubble stays in screen bounds on phone edges and falls below near top',()=>{for(const x of[0,240,984])for(const y of[32,600,2000]){const p=core.bubble(x,y,96,1080,2400,284,230);assert(p.x>=10&&p.x+284<=1070);assert(p.y>=30&&p.y+230<=2350);assert(p.tail>=20&&p.tail<=264)}assert(!core.bubble(984,32,96,1080,2400,284,230).above)});
test('speech chunks preserve text and natural sentence boundaries',()=>{const text='先听我说。这里是一句稍长一点的中文，接下来再告诉你第二件事！\n没有丢字。';assert.equal(core.splitSentences(text,42).join(''),text);assert(core.splitSentences('长'.repeat(100),42).every(s=>s.length<=42))});
test('emoji prefixes stay whole and playback count clamps',()=>{assert.equal(core.prefix('你好🦊！',3),'你好🦊');assert.equal(core.progressCount('你好',500,1000),1);assert.equal(core.progressCount('你好',2000,1000),2);assert.equal(core.progressCount('你好',1,0),0)});
test('Fish emotion/emphasis are constructed separately from plain text',()=>{const text='请记住明天交表格。';const tagged=core.fishText(text,'HAPPY',['明天'],true);assert(tagged.startsWith('[happy]'));assert(tagged.includes('[emphasis]明天'));assert.equal(tagged.replace(/\[[^\]]*\]/g,''),text);assert(!core.fishText(text,'INVALID',['[evil]'],true).includes('evil'));assert(!core.fishText(text,'SPEECHLESS',[],false).includes('[sigh]'))});
test('multiple Fish voices accumulate; same ID renames without duplicates',()=>{
 let list=core.upsertFishVoice([],'男声','voice-1');list=core.upsertFishVoice(list,'女声','voice-2');
 const previous=JSON.stringify(list);const renamed=core.upsertFishVoice(list,'清朗男声','voice-1');
 assert.equal(renamed.length,2);assert.equal(renamed[0].name,'清朗男声');assert.equal(renamed[1].id,'voice-2');assert.equal(JSON.stringify(list),previous);
});
test('Fish voice entry rejects blank ID, URL, accidental API key and corrupt existing data',()=>{
 for(const id of['','https://example.test/voice','sk-not-a-voice','a b'])assert.throws(()=>core.upsertFishVoice([],'test',id));
 assert.throws(()=>core.upsertFishVoice(null,'x','voice-1'));assert.throws(()=>core.upsertFishVoice([{id:'broken'}],'x','voice-1'));
});
test('saved Fish preset persists ID, can be selected after reload, and leaves provider unchanged',()=>{
 let saved={},name='少年音',id='voice-1',rendered;
 const b=load(app,['backupFishVoices','saveFishVoicePreset','selectFishVoice'],{fishVoicePresets:[],updatingFishList:false,Companion:core,C:{provider:'system',voice:''},
  ui:{voice:{text:()=>id,setText:v=>id=v},fishVoiceName:{text:()=>name,setText:v=>name=v}},
  store:{put:(k,v)=>saved[k]=JSON.parse(JSON.stringify(v))},renderFishVoiceList:v=>rendered=v,status:()=>{},safeError:String});
 b.saveFishVoicePreset();id='voice-2';name='温柔音';b.saveFishVoicePreset();assert.equal(saved.fishVoicePresetsV45.length,2);assert.equal(rendered,'voice-2');
 b.fishVoicePresets=JSON.parse(JSON.stringify(saved.fishVoicePresetsV45));b.selectFishVoice(1);
 assert.equal(id,'voice-2');assert.equal(name,'温柔音');assert.equal(b.C.voice,'voice-1');assert.equal(saved.voiceId,'voice-1');assert.equal(b.C.provider,'system');
});
test('speed is natural by default, mood changes are small, bounds enforced',()=>{assert.equal(core.speed(undefined,'IDLE'),1);assert.equal(core.speed(1,'URGENT'),1.05);assert.equal(core.speed(1,'CRYING'),.95);assert.equal(core.speed(99,'URGENT'),1.3);assert.equal(core.speed(.1,'CRYING'),.8)});
test('system voice permits 0.5–2.0 rate without changing selected voice',()=>{assert.equal(core.speed(.5,'IDLE','system'),.5);assert.equal(core.speed(2,'IDLE','system'),2);for(const name of['systemSpeak','nativePhrase']){const n=parser.parse(app,{plugins:['jsx']}).program.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name===name);assert(app.slice(n.start,n.end).includes('configureSystemVoice('))}assert(app.includes('tts.setPitch(settings.pitch || 1)'));});
test('current reply locks provider despite later UI changes',()=>{let fish=0,native=0;const box=load(app,['nextPhrase'],{speechSession:{serial:1,provider:'system',settings:{fishKey:'configured'},phrases:['hello'],index:0,attempt:0,explicit:true},C:{provider:'system',fishKey:'configured'},fishRetryAt:0,exiting:false,fishPhrase:()=>fish++,nativePhrase:()=>native++});box.nextPhrase(1);box.C.provider='fish';box.nextPhrase(1);assert.equal(fish,0);assert.equal(native,2)});
test('ordinary multi-sentence reply is one synthesis block, long blocks preserve emoji',()=>{const text='第一句。第二句！第三句？';assert.deepEqual(core.speechBlocks(text),[text]);const long='甲'.repeat(2199)+'🦊'+'乙'.repeat(600);const blocks=core.speechBlocks(long);assert.equal(blocks.join(''),long);assert(blocks.every(x=>x.length<=2200));assert(blocks.every(x=>!/[\uD800-\uDBFF]$/.test(x)))});
test('auto-read starts without explicit tap and settings are snapshotted',()=>{let started=0,silent=0;const C={autoSpeak:true,provider:'system',speechRate:1,pitch:1,systemVoice:'voiceA',fishKey:'key',voice:'id'};
 const b=load(app,['startPresentation'],{C,Companion:core,stopAudio:()=>{},syncSerial:1,canPlayReplyAudio:()=>true,typeSilently:()=>silent++,speechStyle:{mood:'IDLE',emphasis:[]},setBubbleText:()=>{},nextPhrase:()=>started++});b.startPresentation('一。二。',false);assert.equal(started,1);assert.equal(silent,0);assert.equal(b.speechSession.phrases.length,1);C.systemVoice='voiceB';C.pitch=1.7;assert.equal(b.speechSession.settings.systemVoice,'voiceA');assert.equal(b.speechSession.settings.pitch,1);C.autoSpeak=false;b.startPresentation('文字',false);assert.equal(silent,1);});
test('native progress ignores stale utterances and uses clean text offsets',()=>{let output;const box=load(app,['nativeRange'],{main:f=>f(),nativeUtterance:{id:'new',phrase:'你好🦊！',range:false},speechSession:{prefix:'之前。'},setBubbleText:s=>output=s});box.nativeRange('old',0,2);assert.equal(output,undefined);box.nativeRange('new',0,2);assert.equal(output,'之前。你好');assert.equal(box.nativeUtterance.range,true)});
test('bubble uses requested height and retains pointer handle while reparenting',()=>{const pointer={setText:()=>{},getLayoutParams:()=>({}),setLayoutParams:()=>{}};let attached=true,measured;const p={setSize:(w,h)=>measured=h,setPosition:()=>{},root:{removeView:v=>{assert.equal(v,pointer);attached=false},getChildCount:()=>1,addView:v=>{assert.equal(v,pointer);attached=true}}};Object.defineProperty(p,'pointer',{get:()=>attached?pointer:null});const box=load(app,['positionBubble'],{panel:p,orb:{getX:()=>500,getY:()=>600},orbSize:96,screenW:1080,screenH:2400,dp:n=>n,bubbleHeight:230,Companion:core});box.positionBubble();assert.equal(measured,230);assert(attached)});
test('stale completion cannot advance a new speech session',()=>{let calls=0;const box=load(app,['phraseDone'],{speechSession:{serial:8,attempt:2,prefix:'',index:0},nativeUtterance:{},clearBubbleAnimation:()=>{},clearPhrasePlayer:()=>{},setBubbleText:()=>{},nextPhrase:()=>calls++});box.phraseDone(7,2,'old');box.phraseDone(8,1,'old');assert.equal(calls,0);box.phraseDone(8,2,'new');assert.equal(calls,1);assert.equal(box.speechSession.prefix,'new')});
test('manifest rejects unexpected files, hashes, version and oversize payloads',()=>{const good={project:'Jarvis-Core',schema:1,entry:'app.js',version:'4.0.0-preview1',files:{}};const names=['app.js','CompanionCore.js','Assets/blue-fox/atlas.png'];for(const n of names)good.files[n]={sha256:'a'.repeat(64),bytes:100};const b=load(launcher,['validateManifest'],{ALLOWED:names});b.validateManifest(good);const bad=JSON.parse(JSON.stringify(good));bad.files['../secret']={};assert.throws(()=>b.validateManifest(bad));assert.throws(()=>b.validateManifest({...good,version:'../app'}));const big=JSON.parse(JSON.stringify(good));big.files['app.js'].bytes=21*1024*1024;assert.throws(()=>b.validateManifest(big))});
test('corrupt version pointers cannot escape release directory',()=>{const b=load(launcher,['readState'],{POINTER:'state',files:{exists:()=>true,read:()=>JSON.stringify({current:'../../evil'})}});assert.throws(()=>b.readState());});
test('config stays in same namespace; package code has no embedded credentials',()=>{assert(app.includes('storages.create("jarvis_config_v2")'));assert(!launcher.includes('jarvis_config_v2")'));for(const s of[app,launcher])assert(!/sk-[A-Za-z0-9_-]{12,}/.test(s));assert(!/Authorization\s*:/.test(launcher));});
test('no duplicate top-level function names in Android app',()=>{const names=parser.parse(app,{plugins:['jsx']}).program.body.filter(n=>n.type==='FunctionDeclaration').map(n=>n.id.name);assert.equal(new Set(names).size,names.length)});
const report={tests:count,passed:count,android:'NOT RUN',FishRequests:'NONE',browser:'Real interaction and visual acceptance not run',art:'64 measured source rectangles; appearance and loop smoothness await user review'};fs.writeFileSync(path.join(project,'.work/app-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
