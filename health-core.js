export function mergeHealthWorkouts(existing,incoming){
  const keys=new Set(existing.filter(w=>w.healthId).map(w=>w.healthId));let added=0;
  const workouts=[...existing];
  for(const w of incoming){if(!w.healthId||keys.has(w.healthId)||!Number.isFinite(w.minutes)||w.minutes<=0||w.minutes>1440||!/^\d{4}-\d{2}-\d{2}$/.test(w.date))continue;keys.add(w.healthId);workouts.push(w);added++;}
  return {workouts,added};
}
export function parseHealthXML(xml){
  if(!/<HealthData\b/.test(xml))throw Error('Choose the export.xml file from Apple Health.');
  if(/<!ENTITY/i.test(xml))throw Error('This XML format is not supported.');
  const workouts=[];
  for(const match of xml.matchAll(/<Workout\b[^>]*>/g)){
    const doc=new DOMParser().parseFromString(match[0].replace(/\/?\s*>$/,'/>'),'application/xml');
    const node=doc.documentElement;if(node.tagName!=='Workout'||doc.querySelector('parsererror'))continue;
    const start=node.getAttribute('startDate'),end=node.getAttribute('endDate'),activity=node.getAttribute('workoutActivityType');
    if(!start||!end||!activity)continue;
    let minutes=Number(node.getAttribute('duration'));const unit=node.getAttribute('durationUnit');
    if(unit==='s')minutes/=60;else if(unit==='hr'||unit==='h')minutes*=60;else if(unit!=='min')continue;
    const type=activity.replace('HKWorkoutActivityType','').replace(/([a-z])([A-Z])/g,'$1 $2');
    workouts.push({healthId:`apple:${start}|${end}|${activity}`,type,minutes:Math.round(minutes*10)/10,date:start.slice(0,10),source:'Apple Health'});
    if(workouts.length>50000)throw Error('The export contains too many workouts. Use a smaller export.');
  }
  return mergeHealthWorkouts([],workouts).workouts;
}
