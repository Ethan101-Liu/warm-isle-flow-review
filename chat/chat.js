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
 const titles={home:'暖屿小屋',chat:'和小屿聊聊',inbox:'我的信箱',settings:'设置',login:'登录暖屿'};
 $('#top').innerHTML='<h2>'+titles[next]+'</h2><div class="tools">'+(next==='home'?button(icon('mail')+'信箱','inbox')+button(icon('settings')+'设置','settings'):button('返回',next==='login'?'settings':'home'))+'</div>';
 const body=$('#body');body.classList.toggle('conversation',next==='chat');
 if(next==='home'){
 body.innerHTML='<div class="stage"><img class="room" src="room.svg" alt="窗边有沙发和落地灯的小屋"></div>'+(messages.length?'<div class="row">'+button('继续上次聊天','resume')+button('开启新聊天','new','quiet')+'</div>':'')+'<div class="compose"><small>小屿 · AI</small><h3>今天想聊些什么？</h3><div class="field"><textarea aria-label="你的第一句话" placeholder="从一句话开始……"></textarea><div class="row">'+button('不知道怎么开口','prompts','hint')+'<button data-act="send" class="primary">发送 ↑</button></div></div></div>';
 $('textarea').value=draft;updateSend();
 }else if(next==='chat'){
 renderChat(body);
 }else if(next==='inbox'){
 renderInbox(body);
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
$('#scene').onchange=e=>{if(e.target.value==='tomorrow'){show('inbox');return}resetChat();draft='';messages=e.target.value==='resume'?[['me','我今天有点累。'],['ai','我在听。']]:[];show('home')};
document.addEventListener('input',e=>{if(e.target.matches('#revision')){$('[data-act=apply]').disabled=!e.target.value.trim()}else if(e.target===document.querySelector('#body textarea')){draft=e.target.value;updateSend()}});
document.addEventListener('focusin',e=>{if(e.target.matches('textarea'))stopIntro()});
document.addEventListener('click',e=>{
 const a=e.target.closest('[data-act]')?.dataset.act;if(!a)return;
 if(a.startsWith('pick')){draft=prompts[Number(a.slice(4))];show('home');$('textarea').focus();return}
 if(a.startsWith('card:')){const card=readCards().find(item=>item.id===a.slice(5));if(card)openCard(card,false);return}
 if(a==='unhappy'){sheet('愿意再聊一会儿吗？我在。',[button('继续聊','resume','primary'),button('先不了','inbox')]);return}
 if(a==='better'){sheet('心事卡',['<div class="paper quiet-light"><span aria-hidden="true">☼</span><p>很高兴你现在感觉好些了。</p></div>',button('完成','inbox','primary')]);return}
 if(a.startsWith('fix-')){openCorrection(Number(a.slice(4)));return}
 switch(a){
 case 'home':case 'settings':case 'inbox':case 'login':show(a);break;
 case 'signin':signed=true;show('home');break;case 'skip':stopIntro();break;case 'replay':replay();break;
 case 'prompts':stopIntro();sheet('可以这样开口',prompts.map((p,i)=>button(p,'pick'+i)).concat(button('取消','close')));break;
 case 'send':if(!draft.trim())return;sendLine(draft.trim());break;
 case 'apply':applyCorrection();break;
 case 'end':if(!messages.length){show('home');break}sheet('结束这次聊天？',['<p class="notice">先看心事卡草稿，再选是否留存。</p>',button('结束聊天','finish','primary'),button('继续聊','close')]);break;
 case 'finish':previewDraft();break;
 case 'edit-card':editCard();break;
 case 'apply-card':applyEdits();break;
 case 'review-card':previewDraft();break;
 case 'keep-options':chooseRetention();break;
 case 'keep-inbox':case 'keep-file':case 'discard-card':finishChat(a);break;
 case 'resume':show('chat');break;
 case 'new':sheet('结束上次聊天，重新开始？',[button('开启新聊天','fresh','primary'),button('继续上次聊天','resume'),button('取消','close')]);break;
 case 'fresh':fresh();break;case 'close':closeSheet();break;
 }
});

let understanding='', target=0;
function resetChat(){understanding='';target=0;pendingCard=null}
function renderChat(body){
 $('#top').innerHTML=button('‹ 小屋','home','quiet')+'<h2>小屿 <small>AI</small></h2>'+button('结束这次','end','quiet');
 body.innerHTML='<div id="log" role="log"></div><div class="chatbar"><textarea rows="1" aria-label="聊天输入" placeholder="继续说……"></textarea>'+button('发送 ↑','send','primary')+'</div>';
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
 if(understanding)return '你刚才说「'+understanding+'」。我记着，你接着说。';
 if(line.includes('取消'))return '他临时取消了见面。是原来的安排被打乱，让你觉得难受吗？';
 if(line.includes('累'))return '你说有点累。想从今天的哪一刻说起？';
 return '你说「'+line+'」。我在听，你愿意再说一点吗？';
}
function sendLine(line){
 pendingCard=null;
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
 pendingCard=null;understanding=value;messages[target][2]='这句已纠正';
 messages.push(['me',value,'我的纠正'],['ai','我听明白了。你想让我记住的是「'+value+'」。你可以慢慢说。','已按你的说法修正']);
 show('chat');
}
const cardPrefix='warm-isle:wireframe:card:';
function readCards(){
 const cards=[];
 for(const key of Object.keys(localStorage)){
  if(key.startsWith(cardPrefix))cards.push(JSON.parse(localStorage.getItem(key)));
 }
 if(!cards.length && $('#scene').value==='tomorrow'){
  cards.push({id:'preview',time:Date.now(),title:'那句没等到的道歉',body:'他临时取消了见面。我在意的是，他没有道歉。'});
 }
 return cards.sort((a,b)=>b.time-a.time);
}
let pendingCard=null;
function createDraft(){
 const lines=messages.filter(([who])=>who==='me').map(([,line])=>line);
 const first=lines[0];
 const feelings=['委屈','难过','开心','失望','有点累','紧张','生气','焦虑'];
 const emotion=lines.findLast(line=>feelings.some(word=>line.includes(word)));
 const focus=understanding||(lines.length>1?lines.at(-1):first.includes('没跟我道歉')?'希望对方能说声抱歉。':'');
 const paragraphs=[first,focus&&focus!==first?'我在意的：'+focus:'',emotion&&emotion!==first&&emotion!==focus?'我当时的感觉：'+emotion:''].filter(Boolean);
 const title=Array.from(focus||first);
 return {id:crypto.randomUUID(),time:Date.now(),title:title.slice(0,14).join('')+(title.length>14?'…':''),body:paragraphs.join('\n\n')};
}
function previewDraft(){
 if(!messages.length)return;
 pendingCard??=createDraft();
 sheet('心事卡草稿',['<div class="paper"><h4></h4><p></p></div>',
  '<div class="card-actions">'+button('返回聊天','close')+button('编辑','edit-card')+button('确认内容','keep-options','primary')+'</div>']);
 $('.paper h4').textContent=pendingCard.title;
 $('.paper p').textContent=pendingCard.body;
}
function editCard(){
 sheet('编辑心事卡',['<label>标题<input id="cardTitle" maxlength="80"></label>',
  '<label>总结<textarea id="cardBody" rows="5"></textarea></label>',
  button('完成编辑','apply-card','primary'),button('取消','review-card')]);
 $('#cardTitle').value=pendingCard.title;
 $('#cardBody').value=pendingCard.body;
 const validate=()=>{$('[data-act="apply-card"]').disabled=!$('#cardTitle').value.trim()||!$('#cardBody').value.trim()};
 $('#cardTitle').oninput=validate;$('#cardBody').oninput=validate;$('#cardBody').focus();
}
function applyEdits(){
 pendingCard.title=$('#cardTitle').value.trim();pendingCard.body=$('#cardBody').value.trim();
 previewDraft();
}
function chooseRetention(){
 sheet('如何留存这张卡？',[button('放入信箱','keep-inbox','primary'),button('自己留存 · 下载文本','keep-file'),button('不保留','discard-card'),button('返回预览','review-card','quiet')]);
}
function finishChat(choice){
 const card=pendingCard;
 if(!card)return;
 if(choice==='keep-inbox'){
  try{localStorage.setItem(cardPrefix+card.id,JSON.stringify(card))}
  catch{sheet('暂时无法存入信箱',[button('重试','keep-inbox','primary'),button('返回选择','keep-options')]);return}
 }else if(choice==='keep-file'){
  const file=new Blob([card.title,'\n',cardDate(card.time),'\n\n',card.body],{type:'text/plain;charset=utf-8'});
  const link=document.createElement('a');link.href=URL.createObjectURL(file);link.download='暖屿心事卡.txt';
  document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(link.href),30000);
 }
 resetChat();messages=[];draft='';$('#scene').value='first';show('home');
 if(choice==='keep-inbox')openCard(card,true);
}
function cardDate(time){return new Date(time).toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric'})}
function encouragement(card){
 const text=card.body;
 if(text.includes('道歉'))return '那句没等到的道歉，当时让你在意，今天也可以慢慢说。';
 if(text.includes('累'))return '累的时候，也可以给自己一点歇一歇的时间。';
 return '昨天写下的心事，今天也可以按自己的步子慢慢理清。';
}
function openCard(card,justSaved){
 const today=new Date();
 if($('#scene').value==='tomorrow')today.setDate(today.getDate()+1);
 today.setHours(0,0,0,0);
 const unlocked=!justSaved && card.time<today.getTime();
 const flipButton='<button type="button" id="flip" aria-controls="card-faces">看背面</button>';
 sheet('心事卡',[
  '<div class="paper" id="card-faces"><div class="face-front"><small></small><h4></h4><p></p></div><div class="face-back" hidden>明天再来看吧</div></div>',
  ...(justSaved?['<small class="saved">✓ 已存入信箱</small>','<div class="card-actions">'+button('查看信箱','inbox','primary')+flipButton+button('回小屋','home')+'</div>']:['<div id="mood" hidden><p>现在感觉怎么样？</p><div>'+button('还不开心','unhappy')+button('心情好了','better')+'</div></div>','<div class="card-actions">'+flipButton+button('返回信箱','close')+'</div>'])
 ]);
 $('.paper small').textContent=cardDate(card.time);
 $('.paper h4').textContent=card.title;
 $('.paper p').textContent=card.body;
 const front=$('.face-front'),back=$('.face-back'),flip=$('#flip');
 if(unlocked)back.textContent=encouragement(card);
 flip.onclick=()=>{
  const showBack=back.hidden;
  front.hidden=showBack;
  back.hidden=!showBack;
  if(!justSaved)$('#mood').hidden=!(showBack && unlocked);
  flip.textContent=showBack?'看正面':'看背面';
  if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
   $('.paper').animate([{transform:'perspective(600px) rotateY('+ (showBack?-27:27) +'deg)'},{transform:'none'}],{duration:190,easing:'ease-out'});
  }
 };
}
function renderInbox(body){
 let cards;
 try{cards=readCards()}catch{body.innerHTML='<div class="middle">信箱暂时无法打开</div>'+button('重试','inbox');return}
 if(!cards.length){
  body.innerHTML='<div class="middle">'+icon('mail')+'<h3>信箱还是空的</h3><p class="notice">留下的心事卡会出现在这里。</p>'+button('回小屋','home')+'</div>';return
 }
 body.replaceChildren();
 for(const card of cards){
  const entry=document.createElement('button');
  entry.className='mailCard';entry.dataset.act='card:'+card.id;
  entry.innerHTML='<small></small><strong></strong><span aria-hidden="true">›</span>';
  entry.querySelector('small').textContent=(card.id==='preview'?'示例 · ':'')+cardDate(card.time);
  entry.querySelector('strong').textContent=card.title;
  body.append(entry);
 }
}
if(location.hash==='#tomorrow'){
 $('#scene').value='tomorrow';
 show('inbox');
}else{show('home');intro()}
