const $=s=>document.querySelector(s);
const box=$('dialog');
const paths={mail:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="m3 6 9 7 9-7"/>',settings:'<path d="M3 7h6m6 0h6M3 17h10m6 0h2"/><circle cx="12" cy="7" r="3"/><circle cx="16" cy="17" r="3"/>'};
const icon=k=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">'+paths[k]+'</svg>';
const button=(label,act,cls='')=>'<button data-act="'+act+'" class="'+cls+'">'+label+'</button>';
const prompts=['他临时取消见面，也没跟我道歉。','我有点累，想找人说说。','有件开心的事想分享。'];
let page='home',draft='',messages=[],signed=false,timer;
function closeSheet(){if(box.open)box.close()}
function sheet(title,items){$('#sheet').innerHTML='<h3>'+title+'</h3>'+items.join('');if(!box.open)box.showModal()}
function stopIntro(){clearTimeout(timer);document.querySelectorAll('.intro,.skip').forEach(el=>el.remove())}
function intro(){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;stopIntro();$('.stage').insertAdjacentHTML('beforeend','<div class="intro" aria-hidden="true"><div class="doorframe"><div class="door"></div></div></div>'+button('跳过','skip','skip'));timer=setTimeout(stopIntro,1650)}
function show(next){
 stopIntro();closeSheet();page=next;
 const titles={home:'暖屿小屋',chat:'和小屿聊聊',inbox:'我的信箱',settings:'设置',login:'登录暖屿',ended:'本次聊天已结束'};
 $('#top').innerHTML='<h2>'+titles[next]+'</h2><div class="tools">'+(next==='home'?button(icon('mail')+'信箱','inbox')+button(icon('settings')+'设置','settings'):button('返回',next==='login'?'settings':'home'))+'</div>';
 const body=$('#body');body.classList.toggle('conversation',next==='chat');
 if(next==='home'){
 body.innerHTML='<div class="stage"><img class="room" src="room.svg" alt="窗边有沙发和落地灯的小屋"></div>'+(messages.length?'<div class="row">'+button('继续上次聊天','resume')+button('开启新聊天','new','quiet')+'</div>':'')+'<div class="compose"><small>小屿 · AI</small><h3>今天想聊些什么？</h3><div class="field"><textarea aria-label="你的第一句话" placeholder="从一句话开始……"></textarea><div class="row">'+button('不知道怎么开口','prompts','hint')+'<button data-act="send" class="primary">发送 ↑</button></div></div></div>';
 $('textarea').value=draft;updateSend();
 }else if(next==='chat'){
 renderChat(body);
 }else if(next==='ended'){
 body.innerHTML='<div class="middle"><div class="done">✓</div><h3>这次先聊到这里</h3><p class="notice">这次聊天对你有帮助吗？（可选）</p><div class="row">'+button('有帮助','helpful')+button('没帮到我','unhelpful')+'</div></div>'+button('回小屋','home','primary');
 }else if(next==='inbox'){
 body.innerHTML='<div class="middle">'+icon('mail')+'<h3>信箱还是空的</h3><p class="notice">留下的心事卡会出现在这里。</p>'+button('回小屋','home')+'</div>';
 }else if(next==='settings'){
 body.innerHTML='<small>账号</small>'+(signed?'<div class="tile">演示账号<span>已登录</span></div>':button('游客身份<span>登录　›</span>','login','tile'))+'<small>首次使用</small>'+button('观看开场动效<span>重播　›</span>','replay','tile');
 }else{
 body.innerHTML='<div class="middle"><h3>登录暖屿</h3><p class="notice">线框演示，无需填写账号</p></div>'+button('体验登录','signin','primary')+button('继续以游客身份使用','home');
 }
}
function updateSend(){$('[data-act="send"]').disabled=!draft.trim()}
function fresh(){resetChat();messages=[];draft='';$('#scene').value='first';show('home');$('textarea').focus()}
function replay(){show('home');intro()}
$('#replay').onclick=replay;
$('#scene').onchange=e=>{resetChat();draft='';messages=e.target.value==='resume'?[['me','我今天有点累。'],['ai','我在听。']]:[];show('home')};
document.addEventListener('input',e=>{if(e.target.matches('#revision')){$('[data-act=apply]').disabled=!e.target.value.trim()}else if(e.target.matches('textarea')){draft=e.target.value;updateSend()}});
document.addEventListener('focusin',e=>{if(e.target.matches('textarea'))stopIntro()});
document.addEventListener('click',e=>{
 const a=e.target.closest('[data-act]')?.dataset.act;if(!a)return;
 if(a.startsWith('pick')){draft=prompts[Number(a.slice(4))];show('home');$('textarea').focus();return}
 if(a.startsWith('fix-')){openCorrection(Number(a.slice(4)));return}
 switch(a){
 case 'home':case 'settings':case 'inbox':case 'login':show(a);break;
 case 'signin':signed=true;show('home');break;case 'skip':stopIntro();break;case 'replay':replay();break;
 case 'prompts':stopIntro();sheet('可以这样开口',prompts.map((p,i)=>button(p,'pick'+i)).concat(button('取消','close')));break;
 case 'send':if(!draft.trim())return;sendLine(draft.trim());break;
 case 'listen':case 'sort':mode=a;renderModes();break;
 case 'apply':applyCorrection();break;
 case 'end':sheet('结束这次聊天？',['<p class="notice">结束后，这段对话将无法继续。</p>',button('结束聊天','finish','primary'),button('继续聊','close')]);break;
 case 'finish':resetChat();messages=[];draft='';$('#scene').value='first';show('ended');break;
 case 'helpful':case 'unhelpful':$('.middle').innerHTML='<div class="done">✓</div><h3>谢谢你的反馈</h3>';break;
 case 'resume':show('chat');break;
 case 'new':sheet('结束上次聊天，重新开始？',[button('开启新聊天','fresh','primary'),button('继续上次聊天','resume'),button('取消','close')]);break;
 case 'fresh':fresh();break;case 'close':closeSheet();break;
 }
});

let mode='listen', understanding='', target=0;
function resetChat(){mode='listen';understanding='';target=0}
function renderModes(){
 for(const m of ['listen','sort']){const el=$('[data-act='+m+']');el.setAttribute('aria-pressed',String(m===mode))}
 $('#modeHint').textContent=mode==='listen'?'我在听，你可以慢慢说。':'下一句，一起理一理发生了什么。';
}
function renderChat(body){
 $('#top').innerHTML=button('‹ 小屋','home','quiet')+'<h2>小屿 <small>AI</small></h2>'+button('结束这次','end','quiet');
 body.innerHTML='<div class="prefs">'+button('先听我说','listen')+button('帮我理一理','sort')+'</div><small id="modeHint" aria-live="polite"></small><div id="log" role="log"></div><div class="chatbar"><textarea rows="1" aria-label="聊天输入" placeholder="继续说……"></textarea>'+button('发送 ↑','send','primary')+'</div>';
 renderModes();
 const log=$('#log');
 messages.forEach(([who,line,note],i)=>{
  const group=document.createElement('div');group.className='turn '+(who==='me'?'out':'');
  if(note){const cap=document.createElement('small');cap.textContent=note;group.append(cap)}
  const p=document.createElement('p');p.className='balloon';p.textContent=line;group.append(p);
  if(who==='ai')group.insertAdjacentHTML('beforeend',button('没理解对','fix-'+i,'correct'));
  log.append(group);
 });
 $('textarea').value=draft;updateSend();log.scrollTop=log.scrollHeight;
}
function answer(line){
 if(understanding)return mode==='sort'?'就「'+understanding+'」这件事，你最希望有什么变化？':'你刚才说「'+understanding+'」。我记着，你接着说。';
 if(mode==='sort')return '我们从「'+line+'」说起。这里面哪件事最让你在意？';
 if(line.includes('取消'))return '他临时取消了见面。是原来的安排被打乱，让你觉得难受吗？';
 if(line.includes('累'))return '你说有点累。想从今天的哪一刻说起？';
 return '你说「'+line+'」。我在听，你愿意再说一点吗？';
}
function sendLine(line){
 const direct=line.match(/^(?:我更在意的是|其实我在意的是|我想纠正一下)[，,：:\s]*(.+)$/)||line.match(/^不是.+?[，,]是(.+)$/);
 if(direct)understanding=direct[1];
 messages.push(['me',line],['ai',direct?'明白了，你在意的是「'+understanding+'」。你可以接着说。':answer(line),direct?'已按你的说法修正':'']);
 draft='';$('#scene').value='resume';show('chat');
}
function openCorrection(i){
 target=i;
 sheet('哪里没理解对？',['<blockquote id="original"></blockquote>','<textarea id="revision" rows="3" aria-label="正确的说法" placeholder="我更在意的是……"></textarea>',button('确认修正','apply','primary'),button('取消','close')]);
 $('#original').textContent=messages[i][1];$('[data-act=apply]').disabled=true;$('#revision').focus();
}
function applyCorrection(){
 const value=$('#revision').value.trim();if(!value)return;
 understanding=value;messages[target][2]='这句已纠正';
 messages.push(['me',value,'我的纠正'],['ai','我听明白了。你想让我记住的是「'+value+'」。'+(mode==='sort'?'我们可以从这一点继续理。':'你可以慢慢说。'),'已按你的说法修正']);
 show('chat');
}
show('home');intro();
