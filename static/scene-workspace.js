/* A: progressive disclosure. B: local composition with a real image-to-video handoff.
   Existing generation, library and advanced workflow functions remain authoritative. */
(() => {
  'use strict';
  const M = window.SceneModel;
  const key = 'agent-studio-scene-v1';
  const q = selector => document.querySelector(selector);
  const esc = escapeHtml;
  let saved;
  try { saved = M.parse(localStorage.getItem(key)); } catch { saved = M.empty(); }
  const history = M.history(saved);
  let state = history.get(), restoring = false, initialized = false, exporting = false;
  let selected = false, drag = null, frameStamp = '', errorText = '', saveTimer;
  let cutoutPending = null, cutoutToken = 0, cutoutBusy = false;
  const imageCache = new Map();

  function button(id, label, className = '') {
    const b = document.createElement('button'); b.type = 'button'; b.id = id; b.textContent = label; b.className = className; return b;
  }
  function move(id, parent) { const el = q('#' + id); if (el) parent.append(el); return el; }
  function showHome() {
    closeDrawers(); closePicker(); elements.sidebar.classList.remove('open');
    elements.welcome.style.display = 'flex'; elements.messages.classList.remove('visible');
    window.studioShell?.setView('canvas');
  }
  function closePicker() {
    document.body.classList.add('asset-dock-hidden');
    q('#scenePickerScrim').hidden = true;
    elements.assetDock.removeAttribute('aria-modal');
  }
  function openPicker(category) {
    closeDrawers(); elements.sidebar.classList.remove('open');
    assetDockCategory = category; elements.assetDockSearch.value = ''; renderAssetDock();
    showAssetDock();
  }

  // Reuse controls rather than duplicate their state and handlers.
  const nav = document.createElement('nav'); nav.className = 'lite-nav'; nav.setAttribute('aria-label', '主导航');
  const home = button('sceneHomeButton', '创作', 'workspace-button active'); nav.append(home);
  const project = move('projectButton', nav); project.querySelector('b').textContent = '项目';
  const library = move('libraryButton', nav); library.querySelector('b').textContent = '素材';
  q('.brand').after(nav); home.addEventListener('click', showHome);
  const advanced = document.createElement('details'); advanced.className = 'lite-advanced-tools';
  advanced.innerHTML = '<summary>高级工具</summary><div class="lite-tool-list"></div>';
  nav.after(advanced);
  ['canvasButton', 'sdxlStudioButton', 'openDataFolderButton'].forEach(id => move(id, advanced.lastElementChild));
  q('#canvasButton b').textContent = '节点工作流';
  q('#canvasButton').setAttribute('title', '专业模式：素材连线、模型编排');
  const newButton = q('#newChatButton'); newButton.textContent = '新建'; newButton.className = 'lite-new-button';
  q('.topbar-actions').prepend(newButton);
  q('.topbar h1').textContent = '创作';
  const importButton = move('txtProjectButton', q('#projectDrawer .drawer-header > div'));
  importButton.className = 'lite-import-button'; importButton.textContent = '导入 TXT 剧本';
  ['headerProjectButton','headerLibraryButton','taskButton','historyButton'].forEach(id => q('#' + id).classList.add('lite-retired'));
  q('#headerTaskButton').setAttribute('aria-label', '任务进度'); q('#headerTaskButton').title = '任务进度';
  q('#headerHistoryButton').setAttribute('aria-label', '创作记录'); q('#headerHistoryButton').title = '创作记录与重做';
  const returnButton = button('returnToScene', '返回构图');
  elements.messages.before(returnButton); returnButton.addEventListener('click', showHome);
  newButton.addEventListener('click', () => { closePicker(); showHome(); });

  const tools = q('.composer-tools');
  const output = document.createElement('label'); output.className = 'select-chip lite-output';
  output.innerHTML = '<select id="sceneOutput" aria-label="创作类型"><option value="video">视频</option><option value="image">图片</option></select>';
  tools.prepend(output);
  const params = document.createElement('details'); params.id = 'liteParameters'; params.className = 'lite-parameters';
  params.innerHTML = '<summary>生成设置</summary><div class="lite-parameter-grid"></div>';
  q('.composer').append(params);
  const paramGrid = params.lastElementChild;
  const route = elements.mode.closest('label');
  const routeLabel = document.createElement('span'); routeLabel.textContent = '生成路线'; route.prepend(routeLabel); paramGrid.append(route);
  ['imageModelChip','seedChip','referenceButton','directorButton','stateLockButton','turnaroundButton'].forEach(id => move(id, paramGrid));
  elements.attach.querySelector('span').textContent = '首帧图片';
  elements.prompt.placeholder = '描述动作、镜头和声音；画面构图可以直接调整';
  elements.generate.querySelector('span').textContent = '生成视频';
  // The full history is loaded only when its existing entry is opened.
  q('.composer-hint').textContent = 'Enter 生成 · Shift + Enter 换行 · 选素材和拖动画布不会启动生成';

  const preview = elements.studioHeroImage.closest('.studio-preview');
  const workspace = document.createElement('section'); workspace.id = 'sceneWorkspace'; workspace.setAttribute('aria-label', '交互构图画布');
  workspace.innerHTML = `
    <div class="scene-heading"><div><h2>先把画面摆好</h2><p>选素材，调构图，再让画面动起来。</p></div><span id="sceneSaveState" role="status">本地草稿</span></div>
    <div class="scene-toolbar" role="toolbar" aria-label="构图工具">
      <button type="button" id="scenePickBackground">选择场景</button><button type="button" id="scenePickCharacter">选择角色</button>
      <span class="scene-toolbar-gap"></span><button type="button" id="sceneUndo" title="撤销 Ctrl+Z">撤销</button><button type="button" id="sceneRedo" title="重做 Ctrl+Shift+Z">重做</button>
      <details class="scene-more"><summary>更多</summary><div><button type="button" id="sceneDownload">导出构图 PNG</button><button type="button" id="sceneClear">清空画布</button><button type="button" id="sceneReferences">添加参考素材</button></div></details>
    </div>
    <div id="sceneViewport" class="scene-viewport" tabindex="0" role="group" aria-label="构图预览；选中角色后可用方向键移动">
      <img id="sceneBackground" alt="场景背景" draggable="false" hidden>
      <div id="sceneEmpty" class="scene-empty"><h3>你的下一幕，从这里开始</h3><p>先选择场景和角色，或上传透明背景的人物素材。</p></div>
      <button type="button" id="sceneCharacter" class="scene-character" aria-label="画布角色；拖动或用方向键调整位置" hidden><img id="sceneCharacterImage" alt="" draggable="false"><span class="scene-selection-label">拖动调整位置</span></button>
      <span class="scene-preview-badge">构图预览 · 非 AI 融合结果</span>
    </div>
    <div id="sceneObjectTools" class="scene-object-tools" hidden>
      <b id="sceneCharacterName"></b><label>大小 <input id="sceneScale" type="range" min="15" max="150" value="78" aria-label="角色大小"><output id="sceneScaleValue">78%</output></label>
      <button type="button" id="sceneCenter">居中</button><button type="button" id="sceneFlip">镜像</button><button type="button" id="sceneCutout">去除背景</button><button type="button" id="sceneRemoveCharacter">移除角色</button>
      <details><summary>角色参考设置</summary><div id="sceneCharacterSettings"></div></details>
    </div>
    <div class="scene-layer-summary"><span id="sceneLayerSummary">尚未选择素材</span><button id="sceneRemoveBackground" type="button" hidden>移除场景</button></div>
    <div class="scene-footer"><label class="scene-use-frame"><input type="checkbox" id="sceneUseFrame" checked>使用画布作为视频首帧</label><button type="button" id="scenePrepare">预览首帧</button></div>
    <p id="sceneRouteStatus" class="scene-route-status" role="status"></p>
    <p id="sceneImageNote" class="scene-image-note" hidden>人物按原图叠加；透明 PNG 可直接融入背景。普通照片保留原背景，三视图建议仅作参考。</p>
    <details class="scene-command"><summary>快捷调整</summary><div><input id="sceneCommand" aria-label="画布快捷指令" placeholder="左一点 / 大一点 / 居中 / 镜像"><button type="button" id="sceneApplyCommand">应用</button></div><small>本地快捷指令，只调整角色，不触发 AI 生成。</small></details>`;
  preview.before(workspace); preview.classList.add('lite-retired');
  move('assetInspector', q('#sceneCharacterSettings'));
  const scrim = button('scenePickerScrim', '关闭素材选择器'); scrim.className = 'scene-picker-scrim'; scrim.hidden = true; document.body.append(scrim);
  scrim.addEventListener('click', closePicker);
  q('#assetDockCollapse').addEventListener('click', () => { closePicker(); q('#scenePickCharacter').focus(); });
  elements.assetDock.querySelector('h2').textContent = '选择素材';
  elements.assetDock.querySelector('.asset-dock-head p').textContent = '人物和场景加入画布，其他素材仅作参考';
  elements.assetDock.setAttribute('role', 'dialog');
  elements.assetDock.setAttribute('aria-label', '素材选择器');
  closePicker();

  const viewport = q('#sceneViewport'), character = q('#sceneCharacter'), bg = q('#sceneBackground'), img = q('#sceneCharacterImage');
  const characterUrl = a => a?.useCutout && a?.cutoutUrl ? a.cutoutUrl : a?.url;
  function persist() {
    clearTimeout(saveTimer);
    q('#sceneSaveState').textContent = '正在保存…';
    saveTimer = setTimeout(() => {
      try { localStorage.setItem(key, JSON.stringify(state)); q('#sceneSaveState').textContent = '草稿已保存到本机'; }
      catch { q('#sceneSaveState').textContent = '本机存储已满，请导出构图'; }
    }, 180);
  }
  function commit(next, { bindings = false } = {}) {
    if (!history.commit(next)) return;
    if (next.character?.id !== state.character?.id) cancelCutout();
    state = history.get(); errorText = ''; expandedPrompts = null;
    if (bindings) restoreBindings();
    persist(); render();
  }
  function restoreBindings() {
    restoring = true;
    try {
      for (const category of ['background', 'character']) {
        const target = state[category], existing = selectedAssets.get(category);
        if (target?.id === existing?.id) continue;
        if (!target) { if (existing) removeSelectedAsset(category); continue; }
        const full = assetDockItems.find(a => a.id === target.id);
        if (full) { selectedAssets.set(category, full); if (category === 'character') { lockedAsset = full; setReferenceFromAsset(full); } }
        else { selectedAssets.delete(category); if (category === 'character') { lockedAsset = null; clearReferenceAttachment(); } }
      }
      saveAssetSelection(); renderSelectedAssets();
    } finally { restoring = false; }
  }
  function syncAssets() {
    if (restoring) return;
    const next = M.sync(state, selectedAssets.get('background'), selectedAssets.get('character'));
    if (next.character?.id !== state.character?.id) cancelCutout();
    if (!initialized) {
      history.commit(next); initialized = true; state = history.get();
    } else if (history.commit(next)) { state = history.get(); expandedPrompts = null; }
    errorText = ''; persist(); render();
  }
  function setImage(el, url) {
    if (el.getAttribute('src') !== url) { el.removeAttribute('data-failed'); if (url) el.src = url; else el.removeAttribute('src'); }
  }
  function drawTransform() {
    const t = state.transform;
    character.style.left = `${t.x * 100}%`; character.style.top = `${t.y * 100}%`;
    character.style.height = `${t.scale * 100}%`;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    character.style.aspectRatio = iw && ih ? `${iw} / ${ih}` : '2 / 3';
    img.style.transform = t.flip ? 'scaleX(-1)' : '';
    character.classList.toggle('selected', selected);
    character.setAttribute('aria-pressed', String(selected));
    character.dataset.x = t.x.toFixed(4); character.dataset.y = t.y.toFixed(4); character.dataset.scale = t.scale.toFixed(4);
    q('#sceneScale').value = String(Math.round(t.scale * 100)); q('#sceneScaleValue').textContent = `${Math.round(t.scale * 100)}%`;
    q('#sceneFlip').setAttribute('aria-pressed', String(t.flip));
    window.studioShell?.syncSelection(state, selected);
  }
  function render() {
    const [w,h] = M.size(elements.quality.value); viewport.style.aspectRatio = `${w}/${h}`;
    setImage(bg, state.background?.url || ''); bg.hidden = !state.background;
    setImage(img, characterUrl(state.character) || ''); character.hidden = !state.character;
    q('#sceneEmpty').hidden = !!(state.background || state.character);
    q('#sceneObjectTools').hidden = !(state.character && selected);
    q('#sceneImageNote').hidden = !state.character;
    q('#sceneImageNote').textContent = state.character?.useCutout
      ? '已使用本地抠图；发丝和半透明边缘请检查，可随时恢复原图。光影不会自动重绘。'
      : '人物按原图叠加；选中角色可去除背景，三视图建议仅作参考。';
    q('#sceneCutout').textContent = cutoutBusy ? '正在去背景…' : state.character?.useCutout ? '恢复原图' : '去除背景';
    q('#sceneCutout').disabled = cutoutBusy || exporting;
    q('#sceneCharacterName').textContent = state.character?.name || '';
    q('#sceneLayerSummary').textContent = [state.background ? `场景：${state.background.name}` : '未选场景', state.character ? `角色：${state.character.name}` : '未选角色'].join(' · ');
    q('#sceneRemoveBackground').hidden = !state.background;
    q('#scenePickBackground').textContent = state.background ? '更换场景' : '选择场景';
    q('#scenePickCharacter').textContent = state.character ? '更换角色' : '选择角色';
    q('#sceneUndo').disabled = !history.canUndo(); q('#sceneRedo').disabled = !history.canRedo();
    q('#scenePrepare').disabled = exporting || !(state.background || state.character);
    q('#sceneDownload').disabled = exporting || !(state.background || state.character);
    q('#sceneClear').disabled = !(state.background || state.character);
    q('#sceneApplyCommand').disabled = !state.character;
    q('#sceneWorkspace').classList.toggle('is-exporting', exporting);
    drawTransform(); routeStatus();
    window.studioShell?.sync(state, selected);
    // The reference strip only displays assets which are not already represented on the canvas.
    elements.selectedAssetsStrip.querySelectorAll('.selected-asset-chip').forEach(card => {
      const a = [...selectedAssets.values()].find(a => a.id === card.dataset.selectedId);
      card.hidden = a?.category === 'character' || a?.category === 'background';
    });
    elements.selectedAssetsBlock.classList.toggle('lite-retired', ![...selectedAssets.values()].some(a => !['character','background'].includes(a.category)));
  }
  function routeStatus() {
    const active = !!(state.background || state.character);
    const uses = q('#sceneUseFrame').checked && active && ['flux_video', 'image_video'].includes(elements.mode.value);
    q('#sceneUseFrame').disabled = !['flux_video','image_video'].includes(elements.mode.value);
    q('#sceneOutput').value = elements.mode.value === 'text_image' ? 'image' : 'video';
    elements.generate.querySelector('span').textContent = elements.mode.value === 'text_image' ? '生成图片' : '生成视频';
    const stamp = JSON.stringify(state) + elements.quality.value;
    q('#sceneRouteStatus').textContent = errorText || (cutoutBusy ? '正在本机提取角色，完成后自动更新画布…' : exporting ? '正在合成首帧，尚未提交生成…' : uses
      ? (frameStamp === stamp && attachment?.sceneComposition ? '首帧已准备；点击生成视频才会提交任务。' : '生成时自动合成当前画布作为首帧，保留当前站位与大小。')
      : active ? '当前走独立生成路线，画布不作为首帧。可在生成设置切回首帧路线。' : '选择素材后可以预览；也可以直接输入文字开始创作。');
  }
  function cancelCutout() { cutoutToken++; cutoutBusy = false; cutoutPending = null; }
  function undo(redo = false) {
    cancelCutout();
    if (!(redo ? history.redo() : history.undo())) return;
    state = history.get(); errorText = ''; restoreBindings(); expandedPrompts = null; persist(); render();
  }
  function loadImage(url) {
    if (!imageCache.has(url)) {
      imageCache.set(url, new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => { imageCache.delete(url); reject(Error('素材图片读取失败，请重新选择素材。')); };
        image.src = url;
      }));
    }
    return imageCache.get(url);
  }
  async function compose() {
    if (!(state.background || state.character)) throw Error('请先选择场景或角色。');
    const snapshot = M.sanitize(state), [w,h] = M.size(elements.quality.value);
    const stamp = JSON.stringify(snapshot) + elements.quality.value;
    const [back, person] = await Promise.all([snapshot.background ? loadImage(snapshot.background.url) : null, snapshot.character ? loadImage(characterUrl(snapshot.character)) : null]);
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#eae9ee'; ctx.fillRect(0,0,w,h);
    if (back) { const r = M.cover(w,h,back.naturalWidth,back.naturalHeight); ctx.drawImage(back,r.x,r.y,r.width,r.height); }
    if (person) {
      const r = M.rect(snapshot,w,h,person.naturalWidth,person.naturalHeight);
      ctx.save(); ctx.translate(r.x + r.width/2, r.y + r.height/2); if (snapshot.transform.flip) ctx.scale(-1,1);
      ctx.drawImage(person,-r.width/2,-r.height/2,r.width,r.height); ctx.restore();
    }
    const blob = await new Promise((resolve,reject) => canvas.toBlob(b => b ? resolve(b) : reject(Error('首帧导出失败')), 'image/png'));
    return { blob, stamp, width:w, height:h };
  }
  async function prepareFrame() {
    if (exporting) return false;
    exporting = true; errorText = ''; render();
    try {
      if (cutoutPending) await cutoutPending;
      const result = await compose();
      if (result.stamp !== JSON.stringify(state) + elements.quality.value) throw Error('画布已变化，请重新准备首帧。');
      addAttachment(new File([result.blob], `构图首帧_${result.width}x${result.height}.png`, {type:'image/png'}));
      attachment.sceneComposition = true; frameStamp = result.stamp; q('#sceneUseFrame').checked = true;
      // Store provenance on the displayed attachment for inspectable handoff evidence.
      elements.attachmentPreview.dataset.sceneStamp = frameStamp;
      elements.attachmentPreview.dataset.dimensions = `${result.width}x${result.height}`;
      return true;
    } catch(e) { errorText = e.message; showToast(e.message); return false; }
    finally { exporting = false; render(); }
  }
  window.sceneWorkspace = {
    getState: () => M.sanitize(state), refresh: render,
    applyText(text) {
      const next = M.command(state, text);
      if (!next || !state.character) return false;
      selected = true; commit(next); return true;
    },
    syncAssets, modeChanged: () => { routeStatus(); },
    pickerOpened() { scrim.hidden = false; elements.assetDock.setAttribute('aria-modal','true'); },
    assetSelected(asset) {
      if (['character','background'].includes(asset.category) && elements.mode.value !== 'h3_reference') {
        selected = asset.category === 'character'; closePicker(); render();
        if (selected && !state.character?.cutoutUrl && !/三视图|面部|参考脸/.test(asset.name)) runCutout();
      }
    },
    attachmentAdded() { q('#sceneUseFrame').checked = false; frameStamp = ''; routeStatus(); },
    attachmentRemoved() { frameStamp = ''; routeStatus(); },
    async prepareForGeneration() {
      if (!elements.prompt.value.trim()) return true;
      if (exporting) { showToast('正在合成首帧，请稍候。'); return false; }
      if (q('#sceneUseFrame').checked && (state.background || state.character) && ['flux_video','image_video'].includes(elements.mode.value)) return prepareFrame();
      return true;
    },
  };

  q('#scenePickBackground').addEventListener('click', () => openPicker('background'));
  q('#scenePickCharacter').addEventListener('click', () => openPicker('character'));
  q('#sceneReferences').addEventListener('click', () => openPicker('reference'));
  q('#sceneUndo').addEventListener('click', () => undo()); q('#sceneRedo').addEventListener('click', () => undo(true));
  q('#sceneCenter').addEventListener('click', () => commit(M.change(state,{x:.5,y:.5})));
  q('#sceneFlip').addEventListener('click', () => commit(M.change(state,{flip:!state.transform.flip})));
  function runCutout() {
    const source = state.character;
    if (!source || exporting) return;
    if (source.cutoutUrl) { commit({...state,character:{...source,useCutout:!source.useCutout}}); return; }
    const token = ++cutoutToken;
    cutoutBusy = true; errorText = ''; render();
    cutoutPending = (async () => {
      try {
        const response = await fetch(`/api/scene/cutout/${encodeURIComponent(source.id)}`, {method:'POST', signal:AbortSignal.timeout(60000)});
        if (!response.ok) { const detail = await response.text(); throw Error(detail.includes('404: Not Found') ? '请重启工作台以启用去背景功能' : detail); }
        const result = await response.json();
        if (!/^\/api\/scene\/cutout\/[a-f0-9]{64}$/.test(result.url)) throw Error('抠图结果地址无效');
        await loadImage(result.url);
        if (token !== cutoutToken || state.character?.id !== source.id) return;
        commit({...state,character:{...state.character,cutoutUrl:result.url,useCutout:true}});
      } catch(e) {
        if (token === cutoutToken) {errorText=`去背景未完成：${e.message}。原图已保留。`;showToast(errorText);}
      } finally {
        if (token === cutoutToken) {cutoutBusy=false;cutoutPending=null;}
        render();
      }
    })();
  }
  q('#sceneCutout').addEventListener('click',runCutout);
  q('#sceneRemoveCharacter').addEventListener('click', () => { cancelCutout(); selected=false; commit({...state,character:null},{bindings:true}); });
  q('#sceneRemoveBackground').addEventListener('click', () => commit({...state,background:null},{bindings:true}));
  q('#sceneClear').addEventListener('click', () => { cancelCutout(); selected=false; commit(M.empty(),{bindings:true}); });
  q('#sceneScale').addEventListener('input', e => { state=M.change(state,{scale:Number(e.target.value)/100}); drawTransform(); routeStatus(); });
  q('#sceneScale').addEventListener('change', () => { const next=state; state=history.get(); commit(next); });
  q('#sceneUseFrame').addEventListener('change', routeStatus);
  q('#scenePrepare').addEventListener('click', prepareFrame);
  q('#sceneDownload').addEventListener('click', async () => {
    if(exporting) return; exporting=true; render();
    try { if(cutoutPending) await cutoutPending; const result=await compose(); const url=URL.createObjectURL(result.blob); const link=document.createElement('a'); link.href=url; document.body.append(link); link.download=`构图_${result.width}x${result.height}.png`; link.click(); link.remove(); showToast("构图 PNG 已准备，正在请求浏览器下载"); setTimeout(()=>URL.revokeObjectURL(url),60000); }
    catch(e) { errorText=e.message; showToast(e.message); } finally {exporting=false;render();}
  });
  q('#sceneOutput').addEventListener('change', e => { setMode(e.target.value==='image'?'text_image':(attachment?'image_video':'flux_video')); render(); });
  elements.quality.addEventListener('change', render);
  function applyCommand() {
    if(!state.character) return showToast('请先选择角色。');
    const next=M.command(state,q('#sceneCommand').value);
    if(!next) return showToast('支持：左一点、右一点、上移、下移、大一点、小一点、居中、镜像。');
    selected=true; commit(next); q('#sceneCommand').value='';
  }
  q('#sceneApplyCommand').addEventListener('click',applyCommand);
  q('#sceneCommand').addEventListener('keydown',e=>{ if(e.key==='Enter'){e.preventDefault();applyCommand();} });
  img.addEventListener('load',drawTransform);
  [img,bg].forEach(el=>el.addEventListener('error',()=>{ if(el.getAttribute('src')){errorText='素材图片读取失败，请更换素材后再导出。';routeStatus();} }));
  character.addEventListener('pointerdown',e=>{
    if(e.button!==0 || exporting) return; e.preventDefault(); selected=true; character.focus();
    drag={id:e.pointerId,x:e.clientX,y:e.clientY,start:history.get(),rect:viewport.getBoundingClientRect()};
    character.setPointerCapture(e.pointerId); render();
  });
  character.addEventListener('pointermove',e=>{
    if(!drag || e.pointerId!==drag.id) return;
    state=M.change(state,{x:drag.start.transform.x+(e.clientX-drag.x)/drag.rect.width,y:drag.start.transform.y+(e.clientY-drag.y)/drag.rect.height}); drawTransform();
  });
  function endDrag(e) {
    if(!drag || e.pointerId!==drag.id) return;
    const next=state; state=drag.start; drag=null; if(character.hasPointerCapture(e.pointerId))character.releasePointerCapture(e.pointerId); commit(next); render();
  }
  character.addEventListener('pointerup',endDrag); character.addEventListener('pointercancel',endDrag);
  character.addEventListener('click',()=>{selected=true;render();});
  viewport.addEventListener('click',e=>{if(!character.contains(e.target)){selected=false;render();}});
  workspace.addEventListener('keydown',e=>{
    if(/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable)return;
    if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undo(e.shiftKey);return;}
    if(!state.character||!selected)return;
    const step=e.shiftKey ? .05 : .01, t=state.transform;
    const moves={ArrowLeft:{x:t.x-step},ArrowRight:{x:t.x+step},ArrowUp:{y:t.y-step},ArrowDown:{y:t.y+step}};
    if(moves[e.key]){e.preventDefault();commit(M.change(state,moves[e.key]));}
    if(e.key==='Delete'){e.preventDefault();commit({...state,character:null},{bindings:true});}
  });
  document.addEventListener('keydown',e=>{
    if(document.body.classList.contains('asset-dock-hidden'))return;
    if(e.key==='Escape'){closePicker();q('#scenePickCharacter').focus();}
    if(e.key==='Tab'){
      const focusable=[...elements.assetDock.querySelectorAll('button,input,select,a')].filter(el=>!el.disabled&&el.getClientRects().length);
      if(!focusable.length)return;
      const first=focusable[0],last=focusable[focusable.length-1];
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
    }
  });
  // Close a transient picker before opening an existing management surface.
  ['projectButton','libraryButton','headerTaskButton','headerHistoryButton','canvasButton','sdxlStudioButton','openFullLibrary'].forEach(id=>q('#'+id).addEventListener('click',()=>{closePicker();elements.sidebar.classList.remove('open');}));
  window.addEventListener('pagehide',()=>{try{localStorage.setItem(key,JSON.stringify(state));}catch{}});
  render();
  if(assetDockItems.length)syncAssets();
})();
