// Development plugin: update branding on the current page without rebuilding it.
(async()=>{
  let changed=0;
  const candidates=figma.currentPage.findAll(n=>n.type==='TEXT'&&(/^(spotter\.?|SPOTTER\s*\/)/i.test(n.characters)));
  for(const node of candidates){
    const matches=[...node.characters.matchAll(/^spotter\.?/gi)];
    const fonts=node.getStyledTextSegments(['fontName']).map(s=>s.fontName);
    await Promise.all(fonts.map(font=>figma.loadFontAsync(font)));
    for(const match of matches.reverse()){
      // Range edits retain the surrounding text formatting and node identities.
      node.insertCharacters(match.index,'GymSpot','AFTER');
      node.deleteCharacters(match.index+7,match.index+7+match[0].length);
    }
    if(matches.length)changed++;
  }
  figma.closePlugin(`GymSpot branding updated in ${changed} text layers. Your existing layout, components, colors and prototype links were preserved.`);
})().catch(error=>figma.closePlugin(error.message));
