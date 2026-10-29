import {createRequire} from 'node:module';
import {readFile,writeFile,copyFile} from 'node:fs/promises';
const require=createRequire(import.meta.url);const xcode=require('xcode');
const path='ios/App/App.xcodeproj/project.pbxproj';
const project=xcode.project(path);project.parseSync();
const objects=project.hash.project.objects;
const target=Object.entries(objects.PBXNativeTarget).find(([k,v])=>!k.endsWith('_comment')&&v.name==='App')?.[0];
const group=Object.entries(objects.PBXGroup).find(([k,v])=>!k.endsWith('_comment')&&v.path==='App')?.[0];
if(!target||!group)throw Error('Could not find the iOS App target.');
for(const file of ['GymSpotHealthPlugin.swift','GymSpotViewController.swift']){
  await copyFile(`native/ios/${file}`,`ios/App/App/${file}`);
  if(!project.hasFile(file))project.addSourceFile(file,{target},group);
}
await copyFile('native/ios/App.entitlements','ios/App/App/App.entitlements');
for(const [key,value] of Object.entries(objects.XCBuildConfiguration))if(!key.endsWith('_comment')&&String(value.buildSettings?.INFOPLIST_FILE).includes('App/Info.plist'))value.buildSettings.CODE_SIGN_ENTITLEMENTS='App/App.entitlements';
const attributes=project.getFirstProject().firstProject.attributes;
attributes.TargetAttributes??={};attributes.TargetAttributes[target]??={};attributes.TargetAttributes[target].SystemCapabilities??={};attributes.TargetAttributes[target].SystemCapabilities['com.apple.HealthKit']={enabled:1};
for(const ref of Object.values(objects.PBXFileReference))if(ref&&typeof ref==='object')for(const [key,value] of Object.entries(ref))if(value===undefined||value==='undefined')delete ref[key];
await writeFile(path,project.writeSync());
const storyboard='ios/App/App/Base.lproj/Main.storyboard';
await writeFile(storyboard,(await readFile(storyboard,'utf8')).replace('customClass="CAPBridgeViewController" customModule="Capacitor"','customClass="GymSpotViewController" customModule="App"'));
const info='ios/App/App/Info.plist';let plist=await readFile(info,'utf8');
if(!plist.includes('NSHealthShareUsageDescription'))plist=plist.replace('</dict>\n</plist>','<key>NSHealthShareUsageDescription</key><string>GymSpot reads your workouts to show your training activity and progress. Health data stays on your device and is never shared with gym partners.</string>\n</dict>\n</plist>');
if(!plist.includes('NSHealthShareUsageDescription'))throw Error('Health usage text was not added.');
await writeFile(info,plist);
await copyFile('assets/icon-1024.png','ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png');
console.log('GymSpot iOS bridge, Swift sources, Health entitlement and usage text configured.');
