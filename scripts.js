/* ── CURSOR ── */
const cur = document.getElementById('cur');
const trail = document.getElementById('cur-trail');
let mx=0,my=0,tx=0,ty=0;
document.addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY});
(function animCur(){
  cur.style.left=mx+'px'; cur.style.top=my+'px';
  tx+=(mx-tx)*.1; ty+=(my-ty)*.1;
  trail.style.left=tx+'px'; trail.style.top=ty+'px';
  requestAnimationFrame(animCur);
})();

/* ── PROGRESS BAR (throttled) ── */
const prog=document.getElementById('progress');
let scrollTicking=false;
window.addEventListener('scroll',()=>{
  if(!scrollTicking){
    requestAnimationFrame(()=>{
      const h=document.documentElement.scrollHeight-innerHeight;
      prog.style.width=(scrollY/h*100)+'%';
      scrollTicking=false;
    });
    scrollTicking=true;
  }
},{passive:true});

/* ── CANVAS PARTICLES (optimized) ── */
const canvas=document.getElementById('canvas-bg');
if(canvas){
const ctx=canvas.getContext('2d');
let W,H,particles=[];
const PARTICLE_COUNT=matchMedia('(max-width:900px)').matches?50:80;
const CONNECT_DIST=120;
const CONNECT_DIST_SQ=CONNECT_DIST*CONNECT_DIST;

function resize(){W=canvas.width=innerWidth;H=canvas.height=innerHeight}
resize(); window.addEventListener('resize',resize);

class Particle{
  constructor(){this.reset()}
  reset(){
    this.x=Math.random()*W;
    this.y=Math.random()*H;
    this.vx=(Math.random()-.5)*.3;
    this.vy=(Math.random()-.5)*.3;
    this.life=Math.random();
    this.maxLife=.3+Math.random()*.5;
    this.r=Math.random()*1.5+.3;
    this.red=Math.random()>.7;
  }
  update(){
    this.x+=this.vx; this.y+=this.vy;
    this.life+=.002;
    if(this.life>this.maxLife||this.x<0||this.x>W||this.y<0||this.y>H) this.reset();
  }
  draw(){
    const a=Math.sin(this.life/this.maxLife*Math.PI)*.4;
    ctx.beginPath();
    ctx.arc(this.x,this.y,this.r,0,Math.PI*2);
    if(this.red) ctx.fillStyle=`rgba(192,24,42,${a})`;
    else ctx.fillStyle=`rgba(232,221,208,${a*.4})`;
    ctx.fill();
  }
}

for(let i=0;i<PARTICLE_COUNT;i++) particles.push(new Particle());

(function animCanvas(){
  ctx.clearRect(0,0,W,H);
  // Batch connection lines by opacity for fewer strokeStyle changes
  const lines=[];
  for(let i=0;i<particles.length;i++){
    const pi=particles[i];
    for(let j=i+1;j<particles.length;j++){
      const pj=particles[j];
      const dx=pi.x-pj.x, dy=pi.y-pj.y;
      const dSq=dx*dx+dy*dy;
      if(dSq<CONNECT_DIST_SQ){
        const d=Math.sqrt(dSq);
        lines.push(pi.x,pi.y,pj.x,pj.y,(1-d/CONNECT_DIST)*.04);
      }
    }
  }
  // Draw lines in batches
  ctx.lineWidth=.5;
  for(let i=0;i<lines.length;i+=5){
    ctx.beginPath();
    ctx.moveTo(lines[i],lines[i+1]);
    ctx.lineTo(lines[i+2],lines[i+3]);
    ctx.strokeStyle=`rgba(192,24,42,${lines[i+4]})`;
    ctx.stroke();
  }
  for(let i=0;i<particles.length;i++){particles[i].update();particles[i].draw()}
  requestAnimationFrame(animCanvas);
})();
}

/* ── SCROLL REVEAL ── */
const reveals=document.querySelectorAll('.s-reveal,.s-reveal-left');
const revObs=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('in')});
},{threshold:.12,rootMargin:'0px 0px -40px 0px'});
reveals.forEach(el=>revObs.observe(el));

/* ── LIVES ANIMATION on scroll ── */
const livesSection=document.getElementById('concept');
let livesPhase=0;
const life3=document.getElementById('life3');
const life2=document.getElementById('life2');
const life1=document.getElementById('life1');

function setLivesPhase(p){
  if(p===livesPhase) return;
  livesPhase=p;
  [life3,life2,life1].forEach(l=>l.classList.remove('active','dead'));
  if(p===0){
    life3.classList.add('active');
  } else if(p===1){
    life3.classList.add('dead');
    life2.classList.add('active');
  } else {
    life3.classList.add('dead');
    life2.classList.add('dead');
    life1.classList.add('active');
  }
}

// Initial state
life3.classList.add('active');

function updateLives(){
  // Use text description block positions for accurate sync with sticky visual
  const step1=document.getElementById('lifeStep1');
  const step2=document.getElementById('lifeStep2');
  const step3=document.getElementById('lifeStep3');
  const mid=window.innerHeight*0.55;
  if(step3&&step3.getBoundingClientRect().top<mid) setLivesPhase(2);
  else if(step2&&step2.getBoundingClientRect().top<mid) setLivesPhase(1);
  else setLivesPhase(0);
}

window.addEventListener('scroll',updateLives,{passive:true});
updateLives();

/* ── MAP GENERATION ── */
const mapGrid=document.getElementById('mapGrid');
const factionMap={
  '0,0':'f1','1,0':'f1','2,0':'f1','3,0':'f1','4,0':'f1','5,0':'f1',
  '0,1':'f1','1,1':'f1','2,1':'f1','3,1':'f1','4,1':'f1',
  '0,2':'f1','1,2':'f1','2,2':'f1','3,2':'contested',
  '0,3':'f1','1,3':'f1','2,3':'contested',
  '0,4':'f1','1,4':'contested',
  '6,0':'f2','7,0':'f2','8,0':'f2','9,0':'f2','10,0':'f2','11,0':'f2',
  '6,1':'f2','7,1':'f2','8,1':'f2','9,1':'f2','10,1':'f2','11,1':'f2',
  '7,2':'f2','8,2':'f2','9,2':'f2','10,2':'f2','11,2':'f2',
  '8,3':'f2','9,3':'f2','10,3':'f2','11,3':'f2',
  '0,8':'f3','0,9':'f3','0,10':'f3','0,11':'f3',
  '1,8':'f3','1,9':'f3','1,10':'f3','1,11':'f3',
  '2,8':'f3','2,9':'f3','2,10':'f3','2,11':'f3',
  '3,9':'f3','3,10':'f3','3,11':'f3',
  '4,10':'f3','4,11':'f3','5,11':'f3',
  '7,7':'f4','8,7':'f4','9,7':'f4','10,7':'f4','11,7':'f4',
  '7,8':'f4','8,8':'f4','9,8':'f4','10,8':'f4','11,8':'f4',
  '7,9':'f4','8,9':'f4','9,9':'f4','10,9':'f4','11,9':'f4',
  '8,10':'f4','9,10':'f4','10,10':'f4','11,10':'f4',
  '9,11':'f4','10,11':'f4','11,11':'f4',
  '4,4':'contested','5,5':'contested','6,5':'contested','5,6':'contested','6,6':'contested',
};
const factionNames={'f1':'Faction A','f2':'Faction B','f3':'Faction C','f4':'Faction D','contested':'Zone contestée'};
for(let row=0;row<12;row++){
  for(let col=0;col<12;col++){
    const cell=document.createElement('div');
    cell.className='map-cell';
    const key=col+','+row;
    if(factionMap[key]) cell.classList.add('faction-'+factionMap[key].replace('f','').replace('contested','contested'));
    if(factionMap[key]==='contested') cell.classList.add('contested');
    mapGrid.appendChild(cell);
  }
}

/* ── FEATURES DRAG SCROLL ── */
const track=document.getElementById('featTrack');
let isDragging=false,startX=0,startScroll=0;
track.addEventListener('mousedown',e=>{isDragging=true;startX=e.pageX;startScroll=track.scrollLeft;track.style.cursor='grabbing'});
document.addEventListener('mousemove',e=>{if(!isDragging)return;track.scrollLeft=startScroll-(e.pageX-startX)});
document.addEventListener('mouseup',()=>{isDragging=false;track.style.cursor=''});

/* ── LEADERBOARD & FACTION BARS trigger ── */
const lbObs=new IntersectionObserver(entries=>{
  if(entries[0].isIntersecting){
    document.getElementById('leaderboard').classList.add('in');
    document.querySelectorAll('.faction-card').forEach(c=>c.classList.add('in'));
  }
},{threshold:.2});
lbObs.observe(document.getElementById('leaderboard'));

/* ── CTA reveal ── */
const ctaObs=new IntersectionObserver(entries=>{
  if(entries[0].isIntersecting) document.getElementById('ctaInner').classList.add('in');
},{threshold:.3});
ctaObs.observe(document.getElementById('ctaInner'));

/* ── COPY IP ── */
function copyIP(){
  navigator.clipboard.writeText('play.cantale.fr');
  const el=document.getElementById('ipCopy');
  el.textContent='Copié !';
  setTimeout(()=>el.textContent='Copier',2000);
}
