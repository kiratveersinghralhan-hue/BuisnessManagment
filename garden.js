import { catalog } from './catalog.js';
import { escapeHTML as e } from './student.js';
export function addStudyGarden(root,record,uid) {
  const completed = Object.values(record.completed || {}).reduce((n,x)=>n+Object.keys(x||{}).length,0);
  const practiced = Object.values(record.practice || {}).reduce((n,x)=>n+Object.values(x||{}).filter(Boolean).length,0);
  const level = completed+practiced;
  const state = level >= 65 ? ['🌳','Flourishing forest','Your consistency is growing into something big.'] : level >= 25 ? ['🌻','Sunny bloom','Look at all that learning!'] : level >= 8 ? ['🌿','Growing strong','A little progress really adds up.'] : level >= 1 ? ['🌱','First sprout','Every big idea begins with one small step.'] : ['🪴','A tiny beginning','Review a lesson or answer a practice question to grow.'];
  const compliments = ['Progress over perfection. ♡','You are allowed to learn slowly. ✿','One small win is still a win. ✦','Future you is cheering you on. ☀','Curiosity looks good on you. ✧'];
  const section=document.createElement('section');section.className='garden-strip';
  section.innerHTML='<div class="garden-plant" aria-hidden="true">'+state[0]+'</div><div class="garden-copy"><span class="eyebrow">✿ A LITTLE BIT OF FUN</span><h2>Your study garden</h2><p><strong>'+e(state[1])+'</strong> · '+e(state[2])+'</p><small>Grows with your saved lesson reviews &amp; correct practice answers · '+level+' learning moments</small></div><div class="garden-actions"><button type="button" id="garden-cheer">Get a little encouragement ✨</button><a class="action" id="surprise-quiz" href="#'+catalog[Math.floor(Math.random()*catalog.length)].id+'/practice">Surprise quiz ↗</a></div>';
  const b=section.querySelector('#garden-cheer');b.onclick=()=>{const i=Math.floor(Math.random()*compliments.length);b.textContent=compliments[i];};
  root.querySelector('.subjects-heading')?.before(section);
}
