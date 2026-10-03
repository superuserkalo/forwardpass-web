import { readFile, writeFile } from 'node:fs/promises';
import { performance } from 'node:perf_hooks';
import { canonicalSourceUrl } from '/Users/kalo/forwardpass/agent/lib/source-evidence.ts';
import { attachAttention } from '/Users/kalo/forwardpass/agent/lib/attention.ts';
import { editorialBrief } from '/Users/kalo/forwardpass/agent/lib/editorial-brief.ts';
import { groupEditorialEvents, selectIssuePortfolio } from '/Users/kalo/forwardpass/agent/lib/editorial-selection.ts';
const snapshot = JSON.parse(await readFile('/Users/kalo/forwardpass/.delivery/collection/runs/2026-09-24/20.json','utf8'));
const candidateMap = new Map();
for (const item of [...snapshot.attention.candidates, ...snapshot.items]) {
 const key=canonicalSourceUrl(item.url),old=candidateMap.get(key);
 if(item.source==='Hacker News' && old && old.source!=='Hacker News') continue;
 candidateMap.set(key,item);
}
const candidates=attachAttention([...candidateMap.values()],snapshot.attention.measurements);
const cards=candidates.map((candidate,i)=>({id:`card-${String(i).padStart(5,'0')}`,candidate,date:'2026-09-24',documentId:null,previousDocumentId:null,status:'unavailable',excerpt:'',changedExcerpt:'',assessment:{evaluated:false,relevant:0.5,substantive:0.5,change:'unclear',kind:'other',probabilities:{}}}));
let confirmations=0;
const start=performance.now();
const events=await groupEditorialEvents(cards,async()=>{confirmations++;return false;});
const groupMs=performance.now()-start;
const brief=editorialBrief('2026-09-24',events,[]);
const parsed=JSON.parse(brief.prompt);
const item=(id,targetWords,priority)=>({job:{id,title:id,eventIds:[id],historyIds:[],question:id,coverage:[id],essential:false,targetWords},verifiedCoverage:[id],publishable:true,checks:[],story:{},priority});
const items=[item('high-priority',400,0),...Array.from({length:6},(_,i)=>item(`lower-priority-${i}`,60,i+1))];
const selection=selectIssuePortfolio(items,400).map(x=>x.job.id);
const output={snapshotDate:snapshot.collectedAt,sourceRecords:snapshot.items.length,communityRecords:snapshot.attention.candidates.length,canonicalCandidates:candidates.length,measuredAttentionCandidates:candidates.filter(c=>c.attention?.length).length,realVelocityCandidates:candidates.filter(c=>c.attention?.some(m=>m.scorePerHour!==null)).length,grouping:{assumption:'Every candidate pair judged a distinct event; title prefilter still executes unchanged',groups:events.length,possibleJudgeCalls:confirmations,cpuMilliseconds:Math.round(groupMs)},brief:{assumption:'Captured excerpts unavailable; real source text and history can increase prompt length',characters:brief.prompt.length,maxRetainedSummaryCharacters:Math.max(...parsed.events.flatMap(e=>e[1].map(r=>r[4].length)))},portfolio:{budget:400,inputPriority:items.map(x=>x.job.id),selected:selection,selectedEstimatedWords:selectIssuePortfolio(items,400).reduce((n,x)=>n+x.job.targetWords,0)}};
await writeFile('/tmp/forwardpass-infra-probe-results.json',JSON.stringify(output,null,2)+'\n');
console.log(JSON.stringify(output,null,2));
