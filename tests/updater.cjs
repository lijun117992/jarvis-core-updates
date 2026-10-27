const path=require('path');
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const parser=require('@babel/parser');
const src=fs.readFileSync(path.join(__dirname,'../launcher/Jarvis_Launcher-v2.js'),'utf8');
const ast=parser.parse(src,{plugins:['jsx']});
function load(names,env={}){const b=vm.createContext(env);vm.runInContext(names.map(name=>{const n=ast.program.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name===name);return src.slice(n.start,n.end)}).join('\n'),b);return b;}
let count=0;function test(name,fn){fn();count++;console.log('PASS '+name)}
test('native launcher JSX parses',()=>assert(ast));
test('preview numeric versions, stable versions and older updates compare correctly',()=>{const b=load(['versionParts','compareVersions']);assert(b.compareVersions('4.0.0-preview10','4.0.0-preview9')>0);assert(b.compareVersions('4.0.0','4.0.0-preview99')>0);assert(b.compareVersions('4.0.1-preview1','4.0.0')>0);assert.equal(b.compareVersions('4.0.0-preview6','4.0.0-preview6'),0);assert.throws(()=>b.compareVersions('../bad','4.0.0'));});
const repo='lijun117992/jarvis-core-updates';
const good={project:'Jarvis-Core',schema:1,channel:'preview',version:'4.0.0-preview6',minLauncher:2,url:'https://github.com/'+repo+'/releases/download/v4.0.0-preview6/Jarvis-Core-v4.0.0-preview6.zip',bytes:2000000,sha256:'a'.repeat(64),notes:'Update'};
test('only fixed repository and version-pinned asset URLs are accepted',()=>{const b=load(['versionParts','validateUpdate'],{UPDATE_REPO:repo});b.validateUpdate(good);for(const url of['http://github.com/file','https://evil.test/file',good.url.replace(repo,'other/repo'),good.url.replace('/v4.0.0-preview6/','/v4.0.0-preview1/')])assert.throws(()=>b.validateUpdate({...good,url}));});
test('corrupt hashes, oversized downloads, unknown channel and launcher version rejected',()=>{const b=load(['versionParts','validateUpdate'],{UPDATE_REPO:repo});for(const change of[{sha256:'bad'},{bytes:0},{bytes:26*1024*1024},{channel:'other'},{minLauncher:undefined},{minLauncher:3}])assert.throws(()=>b.validateUpdate({...good,...change}));});
test('offline check never mutates installed version pointer',()=>{let writes=0;const b=load(['fetchUpdate'],{UPDATE_MANIFEST:'https://example.test/update.json',http:{get:()=>({statusCode:503})},files:{write:()=>writes++}});assert.throws(()=>b.fetchUpdate(),/503/);assert.equal(writes,0)});
test('metadata remains bounded before parsing',()=>{const b=load(['fetchUpdate'],{UPDATE_MANIFEST:'https://example.test/update.json',http:{get:()=>({statusCode:200,body:{string:()=> 'x'.repeat(32769)}})}});assert.throws(()=>b.fetchUpdate(),/过大/)});
test('online ZIP version is checked before installation and switching pointers',()=>{const n=ast.program.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='installPackage');const s=src.slice(n.start,n.end);assert(s.indexOf('m.version !== expectedVersion')<s.indexOf('ALLOWED.forEach'));assert(s.indexOf('digestFile(dir+name)')<s.indexOf('writeState('));});
const report={tests:count,passed:count,network:'Offline checks; production reachability is verified separately',android:'NOT RUN'};
fs.writeFileSync(path.join(__dirname,'../.work/updater-verification.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
