const $=s=>document.querySelector(s);
const box=$('dialog');
const paths={mail:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',settings:'<path d="M3 7h6m6 0h6M3 17h10m6 0h2"/><circle cx="12" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>'};
const icon=k=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">'+paths[k]+'</svg>';
const button=(label,act,cls='')=>'<button data-act="'+act+'" class="'+cls+'">'+label+'</button>';
const prompts=['今天有件事一直放不下。','我有点累，想找人说说。','有件开心的事想分享。'];
let page='home',draft='',messages=[],signed=false,timer;
function closeSheet(){if(box.open)box.close()}
function sheet(title,items){$('#sheet').innerHTML='<h3>'+title+'</h3>'+items.join('');if(!box.open)box.showModal()}
function stopIntro(){clearTimeout(timer);document.querySelectorAll('.intro,.skip').forEach(el=>el.remove())}
function intro(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;stopIntro();$('.stage').insertAdjacentHTML('beforeend','<div class="intro" aria-hidden="true"><div class="doorframe"><div class="door"></div></div></div>'+button('跳过','skip','skip'));timer=setTimeout(stopIntro,1650)}
function show(next){
 stopIntro();closeSheet();page=next;
 const titles={home:'暖屿小屋',chat:'和小屿聊聊',inbox:'我的信箱',settings:'设置',login:'登录暖屿'};
 $('#top').innerHTML='<h2>'+titles[next]+'</h2><div class="tools">'+(next==='home'?button(icon('mail')+'信箱','inbox')+button(icon('settings')+'设置','settings'):button('返回',next==='login'?'settings':'home'))+'</div>';
 const body=$('#body');
 if(next==='home'){
 body.innerHTML='<div class="stage"><img class="room" src="room.svg" alt="窗边有沙发和落地灯的小屋"></div>'+(messages.length?'<div class="row">'+button('继续上次聊天','resume')+button('开启新聊天','new','quiet')+'</div>':'')+'<div class="compose"><small>小屿 · AI</small><h3>今天想聊些什么？</h3><div class="field"><textarea aria-label="你的第一句话" placeholder="从一句话开始……"></textarea><div class="row">'+button('不知道怎么开口','prompts','hint')+'<button data-act="send" class="primary">发送 ↑</button></div></div></div>';
 $('textarea').value=draft;updateSend();
 }else if(next==='chat'){
 body.innerHTML='<small>小屿 · AI</small>';for(const [speaker,text] of messages){const p=document.createElement('p');p.className='msg '+(speaker==='me'?'mine':'');p.textContent=text;body.appendChild(p)}
 body.insertAdjacentHTML('beforeend','<small class="lower">首页发送后的预览 · 示例回复</small>');
 }else if(next==='inbox'){
 body.innerHTML='<div class="middle">'+icon('mail')+'<h3>信箱还是空的</h3><p class="notice">留下的心事卡会出现在这里。</p>'+button('回小屋','home')+'</div>';
 }else if(next==='settings'){
 body.innerHTML='<small>账号</small>'+(signed?'<div class="tile">演示账号<span>已登录</span></div>':button('游客身份<span>登录　›</span>','login','tile'))+'<small>首次使用</small>'+button('观看开场动效<span>重播　›</span>','replay','tile');
 }else{
 body.innerHTML='<div class="middle"><h3>登录暖屿</h3><p class="notice">线框演示，无需填写账号</p></div>'+button('体验登录','signin','primary')+button('继续以游客身份使用','home');
 }
}
function updateSend(){$('[data-act="send"]').disabled=!draft.trim()}
function fresh(){messages=[];draft='';$('#scene').value='first';show('home');$('textarea').focus()}
function replay(){show('home');intro()}
$('#replay').onclick=replay;
$('#scene').onchange=e=>{draft='';messages=e.target.value==='resume'?[['me','我今天有点累。'],['ai','我在听。']]:[];show('home')};
document.addEventListener('input',e=>{if(e.target.matches('textarea')){draft=e.target.value;updateSend()}});
document.addEventListener('focusin',e=>{if(e.target.matches('textarea'))stopIntro()});
document.addEventListener('click',e=>{
 const a=e.target.closest('[data-act]')?.dataset.act;if(!a)return;
 if(a.startsWith('pick')){draft=prompts[Number(a.slice(4))];show('home');$('textarea').focus();return}
 switch(a){
 case 'home':case 'settings':case 'inbox':case 'login':show(a);break;
 case 'signin':signed=true;show('home');break;case 'skip':stopIntro();break;case 'replay':replay();break;
 case 'prompts':stopIntro();sheet('可以这样开口',prompts.map((p,i)=>button(p,'pick'+i)).concat(button('取消','close')));break;
 case 'send':if(!draft.trim())return;messages.push(['me',draft.trim()],['ai','我在听，你可以慢慢说。']);draft='';$('#scene').value='resume';show('chat');break;
 case 'resume':show('chat');break;
 case 'new':sheet('结束上次聊天，重新开始？',[button('开启新聊天','fresh','primary'),button('继续上次聊天','resume'),button('取消','close')]);break;
 case 'fresh':fresh();break;case 'close':closeSheet();break;
 }
});
show('home');intro();
