// Shared client/server vocabulary. Extend this list when reviewing missed terms.
const words=['motherfucker','motherfuckers','motherfucking','fuck','fucks','fucker','fuckers','fucking','fucked','fuckhead','bullshit','shit','shits','shitty','shithead','asshole','assholes','arsehole','arse','ass','bitch','bitches','bitching','bastard','bastards','cunt','cunts','dick','dicks','cock','cocks','pussy','pussies','whore','whores','slut','sluts','piss','pissed','wanker','wank','damn','damned','bollocks','prick','crap','nigger','niggers','nigga','niggas','faggot','faggots','fag','fags','dyke','kike','kikes','chink','chinks','gook','gooks','spic','spics','wetback','wetbacks','tranny','trannies','retard','retards','retarded','pula','pule','pizda','pizde','muie','futut','futu','futi','curva','curve','cacat','caca','coaie','poponar'];
const aliases={'0':'o','1':'i','3':'e','4':'a','5':'s','7':'t','@':'a','$':'s','!':'i','|':'i','а':'a','е':'e','о':'o','с':'c','р':'p','х':'x','і':'i','ѕ':'s'};
const gap='[\\s._*\\-]*';
words.push('hell','wtf','stfu','dumbass','jackass','dipshit','shite','twat','dickhead','goddamn','coon','shemale','raghead','towelhead');
const patterns=words.sort((a,b)=>b.length-a.length).map(word=>word.split('').map(c=>c+'+').join(gap));
const matcher=new RegExp('(^|[^\\p{L}\\p{N}])('+patterns.join('|')+')(?=$|[^\\p{L}\\p{N}])','giu');
export function censorText(value){
  const original=String(value??'');let normalized='',indices=[],offset=0;
  for(const char of original){let n=char.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase();n=n.replace(/[\u200B-\u200D\uFEFF]/g,'');for(const part of n){const punctuation=['!','|','@','$'].includes(part);const internal=/[\p{L}\p{N}]/u.test(original[offset-1]||' ')&&/[\p{L}\p{N}]/u.test(original[offset+char.length]||' ');const mapped=(!punctuation||internal?aliases[part]:null)||part;for(const c of mapped){normalized+=c;for(let i=0;i<c.length;i++)indices.push({start:offset,end:offset+char.length});}}offset+=char.length;}
  matcher.lastIndex=0;const ranges=[];let match;
  while((match=matcher.exec(normalized))){const start=match.index+match[1].length,end=start+match[2].length-1;ranges.push([indices[start].start,indices[end].end]);}
  let result=original;for(const [start,end] of ranges.reverse())result=result.slice(0,start)+'****'+result.slice(end);
  return result;
}
