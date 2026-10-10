/* Canvas-first shell: reuses the existing controls, model and generation pipeline. */
(() => {
  'use strict';
  const $ = s => document.querySelector(s);
  const el = (tag, className, text) => { const node=document.createElement(tag); node.className=className||''; if(text)node.textContent=text; return node; };
  const icon = name => { const node=el('img','shell-icon'); node.src=`/static/icons/${name}.svg`; node.alt=''; node.setAttribute('aria-hidden','true'); return node; };
  const makeButton = (id,text,iconName) => {const node=el('button','shell-button');node.type='button';node.id=id;node.setAttribute('aria-label',text);if(iconName)node.append(icon(iconName));node.append(el('span','',text));return node;};
  const move = (selector,target) => {const node=$(selector); if(node)target.append(node);return node;};
  document.body.classList.add('studio-canvas');
  const shell=$('.app-shell'), header=$('.topbar'), main=$('.main-panel'), workspace=$('#sceneWorkspace');
  shell.prepend(header);
  const heading=$('.title-wrap');
  const brand=move('.brand',heading); heading.prepend(brand);
  $('.brand span').textContent='';
  $('.topbar h1').textContent='自由创作';
  move('#sceneSaveState',heading);
  [['sceneHomeButton','创作','sparkle'],['projectButton','项目','folder'],['libraryButton','素材','images']].forEach(([id,text,name])=>{
    const b=$('#'+id);b.replaceChildren(icon(name),el('span','',text));b.title=text;
  });
  $('#sceneHomeButton').setAttribute('aria-current','page');
  $('#headerHistoryButton span').textContent='历史';
  $('#headerTaskButton span').textContent='任务';
  $('#headerTaskButton').title='没有正在运行的任务';
  $('#newChatButton').title='开始新的创作，保留当前构图';
  $('.lite-advanced-tools summary').title='节点工作流与专业图片工具';

  // Keep thumbnails and names together; the original buttons retain their listeners.
  const toolbar=$('.scene-toolbar');
  const assets=el('div','shell-assets');toolbar.prepend(assets);
  const chipNodes={};
  for(const [category,id,label,removeId] of [['background','scenePickBackground','场景','sceneRemoveBackground'],['character','scenePickCharacter','角色',null]]){
    const chip=el('div','shell-asset-chip'); const pick=move('#'+id,chip);
    const thumb=el('img','shell-asset-thumb');thumb.alt='';thumb.hidden=true;
    const title=el('span','shell-asset-title',`选择${label}`);pick.replaceChildren(thumb,title);
    if(removeId){const remove=move('#'+removeId,chip);remove.replaceChildren(icon('x'));remove.setAttribute('aria-label','移除场景');remove.title='移除场景';}
    assets.append(chip);chipNodes[category]={pick,thumb,title,label};
  }
  for(const [id,name,label] of [['sceneUndo','arrow-u-up-left','撤销'],['sceneRedo','arrow-u-up-right','重做']]){
    const b=$('#'+id);b.replaceChildren(icon(name));b.setAttribute('aria-label',label);
  }
  const fitButton=makeButton('sceneFit','适应画布','corners-out');toolbar.insertBefore(fitButton,$('.scene-more'));
  const more=$('.scene-more');more.querySelector('summary').replaceChildren(icon('dots-three'));more.querySelector('summary').setAttribute('aria-label','更多画布操作');more.querySelector('summary').title='更多画布操作';
  move('#scenePrepare',more.lastElementChild);
  move('#sceneImageNote',more.lastElementChild);
  const commandHelp=move('.scene-command',more.lastElementChild);
  commandHelp.querySelector('summary').textContent='可用的快捷指令';

  const viewTabs=el('div','shell-view-tabs');viewTabs.setAttribute('role','tablist');viewTabs.setAttribute('aria-label','工作区视图');
  const canvasTab=makeButton('canvasViewTab','构图'),resultsTab=makeButton('resultsViewTab','结果');
  for(const [b,panel] of [[canvasTab,'sceneCanvasPanel'],[resultsTab,'sceneResultsPanel']]){b.setAttribute('role','tab');b.setAttribute('aria-controls',panel);viewTabs.append(b);}
  toolbar.insertBefore(viewTabs,$('.scene-toolbar-gap'));
  const canvasPanel=el('div','shell-canvas-panel');canvasPanel.id='sceneCanvasPanel';canvasPanel.setAttribute('role','tabpanel');canvasPanel.setAttribute('aria-labelledby','canvasViewTab');
  const floating=move('#sceneObjectTools',canvasPanel);
  const fitHost=el('div','shell-fit-host');canvasPanel.append(fitHost);move('#sceneViewport',fitHost);
  workspace.insertBefore(canvasPanel,$('.scene-layer-summary'));
  // A compact, non-overlapping contextual toolbar reserves one short row above the image.
  const inspector=el('dialog','shell-inspector');inspector.id='sceneInspectorDialog';inspector.setAttribute('aria-labelledby','sceneInspectorTitle');
  const inspectorHead=el('div','shell-dialog-head');const inspectorTitle=el('h2','','角色设置');inspectorTitle.id='sceneInspectorTitle';
  const closeInspector=makeButton('closeSceneInspector','关闭角色设置','x');inspectorHead.append(inspectorTitle,closeInspector);inspector.append(inspectorHead);
  const inspectorBody=el('div','shell-inspector-body');inspector.append(inspectorBody);document.body.append(inspector);
  move('#sceneCharacterName',inspectorBody);move('#sceneCenter',inspectorBody);move('#sceneRemoveCharacter',inspectorBody);
  const originalDetails=floating.querySelector('details');originalDetails.open=true;inspectorBody.append(originalDetails);
  const objectMore=makeButton('sceneObjectMore','更多角色设置','dots-three');floating.append(objectMore);objectMore.querySelector('span').classList.add('shell-sr-only');
  objectMore.addEventListener('click',()=>inspector.showModal());closeInspector.addEventListener('click',()=>inspector.close());
  $('#sceneRemoveCharacter').addEventListener('click',()=>inspector.close());
  $('#openFullLibrary').addEventListener('click',()=>inspector.close());

  $('#sceneFlip').prepend(icon('arrows-horizontal'));
  $('.scene-preview-badge').textContent='构图预览';$('.scene-preview-badge').title='素材合成预览，不是已生成视频或自动光影融合';
  const statusline=el('div','shell-statusline');move('.scene-use-frame',statusline);move('#sceneRouteStatus',statusline);canvasPanel.append(statusline);
  $('.scene-use-frame').lastChild.textContent='使用画布首帧';
  const routeStatus=$('#sceneRouteStatus');
  new MutationObserver(()=>{routeStatus.title=routeStatus.textContent;statusline.classList.toggle('has-error',/未完成|失败|重启/.test(routeStatus.textContent));}).observe(routeStatus,{childList:true,characterData:true,subtree:true});
  $('.scene-layer-summary').hidden=true;$('.scene-footer').hidden=true;$('.scene-heading').hidden=true;

  // Results reuse real in-flight and completed message cards, not a second job store.
  const resultsPanel=el('section','shell-results-panel');resultsPanel.id='sceneResultsPanel';resultsPanel.hidden=true;resultsPanel.setAttribute('role','tabpanel');resultsPanel.setAttribute('aria-labelledby','resultsViewTab');
  const resultsEmpty=el('div','shell-results-empty');resultsEmpty.append(icon('film-strip'),el('h2','','先构图，再让画面动起来'),el('p','','当前创作的进度和结果会显示在这里。以前的作品可从历史中打开。'));
  const oldResults=makeButton('sceneOpenHistory','查看创作历史','clock');resultsEmpty.append(oldResults);oldResults.addEventListener('click',()=>$('#headerHistoryButton').click());
  resultsPanel.append(resultsEmpty);move('#messages',resultsPanel);workspace.append(resultsPanel);
  $('#returnToScene').hidden=true;
  let view='canvas';
  function setView(next){
    view=next==='results'?'results':'canvas';
    elements.welcome.style.display='flex';canvasPanel.hidden=view!=='canvas';resultsPanel.hidden=view!=='results';
    canvasTab.setAttribute('aria-selected',String(view==='canvas'));resultsTab.setAttribute('aria-selected',String(view==='results'));
    canvasTab.tabIndex=view==='canvas'?0:-1;resultsTab.tabIndex=view==='results'?0:-1;
    workspace.classList.toggle('showing-results',view==='results');
    if(view==='canvas')requestAnimationFrame(fitCanvas);
  }
  canvasTab.addEventListener('click',()=>setView('canvas'));resultsTab.addEventListener('click',()=>setView('results'));
  viewTabs.addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();e.stopPropagation();const next=e.key==='Home'?'canvas':e.key==='End'?'results':view==='canvas'?'results':'canvas';setView(next);(next==='canvas'?canvasTab:resultsTab).focus();}});
  new MutationObserver(()=>{resultsEmpty.hidden=!!elements.messages.childElementCount;resultsTab.classList.toggle('has-results',!!elements.messages.childElementCount);}).observe(elements.messages,{childList:true});

  // One compact composer; advanced controls are disclosed only when asked for.
  const tools=$('.composer-tools'),params=$('#liteParameters');
  move('.lite-output',params.lastElementChild);move('#attachButton',params.lastElementChild);
  tools.append(params);params.querySelector('summary').setAttribute('aria-label','更多设置');params.querySelector('summary').replaceChildren(icon('sliders-horizontal'),el('span','','更多设置'));
  tools.prepend($('#durationChip'));
  const quality=elements.quality.closest('label');tools.insertBefore(quality,params);
  const promptHint=el('div','shell-command-feedback');promptHint.id='sceneCommandFeedback';promptHint.setAttribute('role','status');$('.composer').prepend(promptHint);promptHint.hidden=true;
  const promptText='描述动作与镜头，或输入“左一点”调整角色…';elements.prompt.placeholder=promptText;elements.prompt.setAttribute('aria-label','描述动作或调整画布');
  $('.composer-hint').textContent='Enter 执行 · Shift + Enter 换行 · 画布调整不会启动生成';
  function commandCandidate(){const scene=window.sceneWorkspace.getState();return scene.character&&window.SceneModel.command(scene,elements.prompt.value.trim());}
  function updateAction(){
    const candidate=commandCandidate();const text=candidate?'应用调整':elements.mode.value==='text_image'?'生成图片':'生成视频';
    elements.generate.querySelector('span').textContent=text;elements.generate.setAttribute('aria-label',text);
    if(candidate){promptHint.textContent='只调整当前角色，不生成视频';promptHint.hidden=false;}else if(promptHint.dataset.success!=='true'){promptHint.hidden=true;}
  }
  elements.prompt.addEventListener('input',()=>{promptHint.dataset.success='false';updateAction();});
  function applyLocalCommand(){
    if(!window.sceneWorkspace.applyText(elements.prompt.value.trim()))return false;
    setView('canvas');elements.prompt.value='';autoGrow();promptHint.dataset.success='true';promptHint.textContent='已调整角色，场景未改。可点击撤销恢复。';promptHint.hidden=false;updateAction();setTimeout(()=>{if(promptHint.dataset.success==='true'){promptHint.hidden=true;promptHint.dataset.success='false';}},4000);return true;
  }
  function updateChip(category,asset){
    const {pick,thumb,title,label}=chipNodes[category];
    // Existing scene render may replace button children; restore the same nodes.
    if(!pick.contains(thumb))pick.replaceChildren(thumb,title);
    title.textContent=asset?`${label}：${assetDisplayName(asset)}`:`选择${label}`;
    pick.title=asset?`更换${label}：${asset.name}`:`选择${label}`;
    pick.setAttribute('aria-label',asset?`更换${label}`:`选择${label}`);
    thumb.hidden=!asset;if(asset && thumb.getAttribute('src')!==asset.url)thumb.src=asset.url;
  }
  function fitCanvas(){
    if(view!=='canvas')return;
    const [w,h]=window.SceneModel.size(elements.quality.value),box=fitHost.getBoundingClientRect();
    if(box.width<=0||box.height<=0)return;
    const width=Math.max(1,Math.min(box.width,box.height*w/h));
    const viewport=$('#sceneViewport');viewport.style.width=`${width}px`;viewport.style.height=`${width*h/w}px`;
    viewport.dataset.fitted='true';
  }
  fitButton.addEventListener('click',()=>{fitCanvas();showToast('完整构图已适应当前窗口');});
  new ResizeObserver(fitCanvas).observe(fitHost);
  function syncSelection(state,selected){floating.hidden=!(state.character&&selected);canvasPanel.classList.toggle('has-selection',!!state.character&&selected);}
  function sync(state,selected){updateChip('background',state.background);updateChip('character',state.character);syncSelection(state,selected);updateAction();requestAnimationFrame(fitCanvas);}
  function tasksChanged(records){
    const active=records.filter(r=>!['complete','error','cancelled','paused'].includes(r.job.status));
    $('#headerTaskButton').title=active.length?`${active.length} 个任务进行中`:'没有正在运行的任务';
    $('#headerTaskButton').setAttribute('aria-label',active.length?`任务，${active.length} 个进行中`:'任务，无运行任务');
    $('#headerTaskButton').classList.toggle('has-running',active.length>0);
  }
  window.studioShell={setView,sync,syncSelection,tasksChanged,applyLocalCommand};
  document.addEventListener('click',e=>{for(const detail of [params,more]){if(detail.open&&!detail.contains(e.target))detail.open=false;}});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){params.open=false;more.open=false;}});
  $('#newChatButton').addEventListener('click',()=>{promptHint.hidden=true;promptHint.dataset.success='false';setView('canvas');updateAction();});
  elements.quality.addEventListener('change',()=>requestAnimationFrame(fitCanvas));
  new MutationObserver(()=>{if(elements.prompt.placeholder!==promptText)elements.prompt.placeholder=promptText;}).observe(elements.prompt,{attributes:true,attributeFilter:['placeholder']});
  // Extra-reference routes retain their own editor rather than cramming it into the stage.
  function syncReferenceMode(){document.body.classList.toggle('shell-reference-mode',elements.mode.value==='h3_reference');updateAction();}
  new MutationObserver(syncReferenceMode).observe($('#h3ReferencePanel'),{attributes:true,attributeFilter:['hidden']});
  setView('canvas');window.sceneWorkspace.refresh();tasksChanged([...tasks.values()]);syncReferenceMode();
})();
