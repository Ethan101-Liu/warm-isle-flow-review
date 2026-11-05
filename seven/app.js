const names=['首次引导','暖屿小屋','登录','倾诉聊天','心事卡预览','信箱','心事卡回看'];
const $=s=>document.querySelector(s);
const pages=$('#pages'), dialog=$('dialog');
const escapeText=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const btn=(label,action,style='')=>'<button class="'+style+'" data-action="'+action+'">'+label+'</button>';
const row=(...items)=>'<div class="row">'+items.join('')+'</div>';
const sample='临时取消见面时，我希望对方能说声抱歉。';
const title='那次没说出口的委屈';
let page=0, logged=false, ongoing=false, mode=0, editing=false, correcting=false, draft=sample, selected=0;
const cards=[{title,body:sample}];
const initial=[['他临时取消见面，也没道歉。',true],['临时取消让你觉得委屈吗？',false],['我更在意的是，他没道歉。',true],['你希望他能为这件事说声抱歉。',false]];
let messages=initial.slice();
pages.innerHTML=names.map((n,i)=>'<option value="'+i+'">'+(i+1)+' / 7　'+n+'</option>').join('');
pages.onchange=()=>go(Number(pages.value));
const art='<svg class="icon" viewBox="0 0 96 96" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="m11 44 37-29 37 29M20 40v40h56V40M41 80V56h16v24"/><path d="M62 22v-7h9v14"/></svg>';
function go(n){if(dialog.open)dialog.close();page=n;pages.value=n;editing=false;correcting=false;render()}
function modal(heading,buttons){$('#sheet').innerHTML='<h2>'+heading+'</h2>'+buttons.join('');if(!dialog.open)dialog.showModal()}
function render(){
 let head='',body='',foot='';
 const back=(dest,label='返回')=>btn(label,dest,'small');
 const primary=(label,action)=>btn(label,action,'primary');
 switch(page){
 case 0:
 head=back('home','跳过');body='<div class="center">'+art+'<h2>欢迎来到暖屿</h2><p>聊聊心事，留一张卡给自己。</p></div>';foot=primary('开始体验','home');break;
 case 1:
 head=logged?'':back('login','登录');body='<img class="room" src="room.svg" alt="窗边的沙发与落地灯">';foot=primary(ongoing?'继续上次聊天':'开始聊天','chat')+(ongoing?btn('开始新聊天','new'):'')+btn('✉　信箱','inbox');break;
 case 2:
 head=back('home');body='<div class="center">'+art+'<h2>登录暖屿</h2></div>';foot=primary('模拟登录','signin')+btn('游客进入','home');break;
 case 3:
 head=back('end','结束');body=row(...['先听我说','帮我梳理'].map((m,i)=>btn(m,'mode'+i,mode===i?'active':'')))+messages.map(([m,mine])=>'<p class="bubble '+(mine?'mine':'')+'">'+escapeText(m)+'</p>').join('');
 foot=row(btn('纠正理解','correct'),btn('整理心事卡','draft'))+'<form class="line"><input aria-label="聊天内容" placeholder="'+(correcting?'我想纠正……':'说说你的心事……')+'"><button class="primary">发送</button></form>';break;
 case 4:
 head=back('chat');body='<div class="box card"><h2>'+title+'</h2>'+(editing?'<textarea aria-label="编辑心事卡">'+escapeText(draft)+'</textarea>':'<p>'+escapeText(draft)+'</p>')+'</div>';foot=editing?primary('完成编辑','edited')+btn('取消编辑','cancelEdit'):primary('确认内容','keep')+btn('编辑卡片','edit');break;
 case 5:
 head=back('home');body=cards.map((card,i)=>btn('<span><small class="muted">心事卡</small><br>'+escapeText(card.title)+'</span><span aria-hidden="true">›</span>','read'+i,'item')).join('');break;
 case 6:
 head=back('inbox');body='<div class="box card"><h2>'+escapeText(cards[selected].title)+'</h2><p>'+escapeText(cards[selected].body)+'</p></div>';foot=primary('看完了','mood')+btn('回到信箱','inbox');break;
 }
 $('header').innerHTML='<h1>'+names[page]+'</h1>'+head;$('section').innerHTML=body;$('footer').innerHTML=foot;$('footer').className=page===3?'chatFoot':'';
}
function fresh(){messages=initial.slice();mode=0;draft=sample;ongoing=true;go(3)}
function end(){modal('接下来想做什么？',[btn('继续聊','chat','primary'),btn('结束聊天','feedback')])}
document.addEventListener('click',e=>{
 const a=e.target.closest('button')?.dataset.action;if(!a)return;
 if(a.startsWith('read')){selected=Number(a.slice(4));go(6);return}
 switch(a){
 case 'home':go(1);break; case 'login':go(2);break;case 'signin':logged=true;go(1);break;
 case 'chat':ongoing=true;go(3);break;
 case 'new':modal('使用过往心情？',[btn('允许并开始','fresh','primary'),btn('跳过，直接开始','fresh')]);break;
 case 'fresh':fresh();break;case 'mode0':case 'mode1':mode=Number(a.slice(-1));render();break;
 case 'correct':correcting=true;render();$('form input').focus();break;
 case 'draft':go(4);break;case 'edit':editing=true;render();$('textarea').focus();break;
 case 'edited':draft=$('textarea').value.trim()||draft;
 case 'cancelEdit':editing=false;render();break;
 case 'keep':modal('如何留存这张卡？',[btn('放入信箱','save','primary'),btn('自己留存','download'),btn('不保留','end'),btn('返回预览','close')]);break;
 case 'save':cards.unshift({title,body:draft});end();break;
 case 'download':{const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([title+'\n'+draft],{type:'text/plain;charset=utf-8'}));link.download='暖屿心事卡.txt';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000);end();break}
 case 'end':end();break;
 case 'feedback':modal('这次聊天有帮助吗？',[btn('有帮助','finish','primary'),btn('一般','finish'),btn('跳过','finish')]);break;
 case 'finish':ongoing=false;messages=initial.slice();draft=sample;mode=0;go(1);break;
 case 'inbox':go(5);break;
 case 'mood':modal('现在感觉怎么样？',[btn('还不开心','invite'),btn('心情好了','reward','primary'),btn('直接离开','inbox')]);break;
 case 'invite':modal('愿意再聊一会儿吗？',[btn('继续聊','chat','primary'),btn('先不了','inbox')]);break;
 case 'reward':modal('☼　很高兴你感觉好些了',[btn('完成','inbox','primary')]);break;
 case 'close':dialog.close();break;
 }
});
document.addEventListener('submit',e=>{e.preventDefault();const value=$('form input').value.trim();if(!value)return;messages.push([value,true],[correcting?'我明白了，你想表达的是「'+value+'」。':'我在听。你愿意再说一点吗？',false]);draft=value;correcting=false;render();$('section').scrollTop=$('section').scrollHeight;$('form input').focus()});
go(0);
