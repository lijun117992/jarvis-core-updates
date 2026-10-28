const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),parser=require('@babel/parser');
const source=fs.readFileSync(path.join(__dirname,'../src/app.js'),'utf8'),tree=parser.parse(source,{plugins:['jsx']});let count=0;
function test(name,f){f();count++;console.log('PASS '+name)}
function load(names,env){const box=vm.createContext(env);vm.runInContext(names.map(name=>{const n=tree.program.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name===name);assert(n,name);return source.slice(n.start,n.end)}).join('\n'),box);return box;}
test('text read sends once with current bounds and never reopens the editor',()=>{
 let sent=[],stopped=0;const snapshot={package:'other.app',items:[{text:'课程',bounds:[10,20,30,40]}]};
 const b=load(['readScreen'],{busy:false,state:'IDLE',main:f=>f(),setTimeout:f=>f(),threads:{start:f=>f()},device:{width:1080,height:2376},context:{getPackageName:()=> 'host.app'},phoneUiSnapshot:()=>snapshot,closeEditor:()=>{},closePanel:()=>{},stopListening:()=>{},stopAudio:()=>stopped++,processUserCommand:t=>sent.push(t),showAnswer:()=>{throw Error('unexpected error')},safeError:String});
 b.readScreen();assert.equal(sent.length,1);assert(sent[0].includes('[10,20,30,40]'));assert(sent[0].includes('captured_at'));assert(sent[0].includes('1080'));assert.equal(b.state,'THINKING');assert.equal(stopped,1);
});
test('busy or inaccessible screen does not submit stale content',()=>{
 let sent=0,errors=0;const b=load(['readScreen'],{busy:true,state:'IDLE',status:()=>{},main:f=>f(),setTimeout:f=>f(),threads:{start:f=>f()},closeEditor:()=>{},closePanel:()=>{},stopListening:()=>{},stopAudio:()=>{},phoneUiSnapshot:()=>{throw Error('no service')},processUserCommand:()=>sent++,showAnswer:()=>errors++,safeError:String});b.readScreen();assert.equal(sent,0);b.busy=false;b.readScreen();assert.equal(sent,0);assert.equal(errors,1);assert.equal(b.state,'IDLE');
});
test('long press submits the screenshot fast path without using text reading',()=>{
 let request;const b=load(['readScreenImage'],{busy:false,closeEditor:()=>{},closePanel:()=>{},stopListening:()=>{},processUserCommand:(...args)=>request=args});assert.equal(b.readScreenImage(),true);assert.equal(request[1].tool,'screen.inspect');assert.equal(request[2],true);
});
test('system speech warms the route and a slow started utterance is not cut by a guessed deadline',()=>{
 let calls=[],timeout,failed=0,notes=[];const b=load(['nativePhrase'],{speechSession:{serial:1,createdAt:0,index:0,audioStartedEver:false,systemConfigured:false,settings:{speechRate:1}},ttsReady:true,nativeUtterance:null,tts:{playSilentUtterance:(ms,mode,id)=>(calls.push(['silence',ms,mode,id]),0),speak:(phrase,mode,args,id)=>(calls.push(['speak',phrase,mode,id]),0)},android:{speech:{tts:{TextToSpeech:{QUEUE_FLUSH:0,QUEUE_ADD:1,ERROR:-1}}}},Companion:{speed:()=>1},configureSystemVoice:()=>{},main:f=>f(),status:t=>notes.push(t),nativeFailure:()=>failed++,setTimeout:f=>(timeout=f,1)});
 b.nativePhrase(1,1,'完整回答');assert.equal(calls[0][0],'silence');assert.equal(calls[0][1],350);assert.equal(calls[1][2],1);b.nativeUtterance.started=true;timeout();assert.equal(failed,0);assert.equal(notes.length,1);b.nativeUtterance.started=false;timeout();assert.equal(failed,1);
});
test('cancelled speech cannot be restarted by a delayed initialization retry',()=>{
 let spoke=0;const b=load(['nativePhrase'],{speechSession:null,ttsReady:true,tts:{speak:()=>spoke++}});b.nativePhrase(1,1,'旧回答');assert.equal(spoke,0);
});
test('minimal settings hide tool toggles and diagnostics while history stays on home',()=>{
 const more=source.slice(source.indexOf('<vertical id="morePane"'),source.indexOf('<vertical visibility="gone">',source.indexOf('<vertical id="morePane"')));
 for(const id of ['agentEnabled','dailyMemory','connectNativeBridge','testRecognition','testCompatSpeech','history'])assert(!more.includes('id="'+id+'"'),id);
 assert(more.includes('id="autoSpeak"'));assert(more.includes('id="recognitionMode"'));assert(source.indexOf('id="history"')<source.indexOf('id="morePane"'));
});
console.log(JSON.stringify({screenUiAudioTests:count,passed:count,device:'Host mocks only; OPPO playback and native popup appearance require phone acceptance'}));
