const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

const elements = {
  conversation: $("#conversation"), welcome: $("#welcome"), messages: $("#messages"),
  prompt: $("#promptInput"), mode: $("#modeSelect"), quality: $("#qualitySelect"),
  imageModel: $("#imageModelSelect"), imageModelChip: $("#imageModelChip"), ultraQuality: $("#ultraQualityOption"),
  duration: $("#durationSelect"), durationChip: $("#durationChip"), generate: $("#generateButton"),
  attach: $("#attachButton"), imageInput: $("#imageInput"), attachmentPreview: $("#attachmentPreview"),
  attachmentImage: $("#attachmentImage"), attachmentName: $("#attachmentName"),
  removeAttachment: $("#removeAttachment"), dropZone: $("#dropZone"), toast: $("#toast"),
  referenceButton: $("#referenceButton"), referenceInput: $("#referenceInput"), referencePreview: $("#referencePreview"),
  referenceImage: $("#referenceImage"), referenceName: $("#referenceName"), removeReference: $("#removeReference"),
  referenceStrength: $("#referenceStrength"), referenceStrengthValue: $("#referenceStrengthValue"),
  statusDot: $("#statusDot"), engineState: $("#engineState"), engineDevice: $("#engineDevice"),
  theme: $("#themeButton"), sidebar: $("#sidebar"), menu: $("#menuButton"),
  directorButton: $("#directorButton"), directorState: $("#directorState"), directorModal: $("#directorModal"),
  stateLockButton: $("#stateLockButton"), stateLockState: $("#stateLockState"),
  turnaroundButton: $("#turnaroundButton"), turnaroundState: $("#turnaroundState"),
  seedChip: $("#seedChip"), seedMode: $("#seedModeSelect"), seedInput: $("#seedInput"), randomizeSeed: $("#randomizeSeedButton"),
  directorBrief: $("#directorBrief"), directorStyle: $("#directorStyle"), directorShots: $("#directorShots"),
  directorResults: $("#directorResults"), imagePromptResult: $("#imagePromptResult"),
  videoPromptResult: $("#videoPromptResult"), videoPromptField: $("#videoPromptField"),
  expandPrompt: $("#expandPromptButton"), applyPrompts: $("#applyPromptsButton"),
  taskDrawer: $("#taskDrawer"), taskList: $("#taskList"), drawerScrim: $("#drawerScrim"),
  taskCount: $("#headerTaskCount"), sidebarTaskCount: $("#sidebarTaskCount"),
  runningTaskCount: $("#runningTaskCount"), completedTaskCount: $("#completedTaskCount"),
  historyDrawer: $("#historyDrawer"), historyList: $("#historyList"), historySearch: $("#historySearch"),
  historyMode: $("#historyMode"), historySummary: $("#historySummary"), historyCount: $("#sidebarHistoryCount"),
  libraryDrawer: $("#libraryDrawer"), libraryGrid: $("#libraryGrid"), libraryTabs: $("#libraryTabs"),
  saveAssetModal: $("#saveAssetModal"),
  projectDrawer: $("#projectDrawer"), projectList: $("#projectList"), projectCreate: $("#projectCreate"),
  projectDetail: $("#projectDetail"), projectName: $("#projectName"), projectBrief: $("#projectBrief"),
  projectShotCount: $("#projectShotCount"), activeProjectName: $("#activeProjectName"),
  activeProjectMeta: $("#activeProjectMeta"), projectTimeline: $("#projectTimeline"),
  librarySearch: $("#librarySearch"), promptDiagnostics: $("#promptDiagnostics"), contextMenu: $("#contextMenu"),
  uploadAssetModal: $("#uploadAssetModal"), assetFileInput: $("#assetFileInput"), assetDropZone: $("#assetDropZone"),
  uploadFilePreview: $("#uploadFilePreview"), uploadThumb: $("#uploadThumb"), uploadFileName: $("#uploadFileName"),
  uploadFileMeta: $("#uploadFileMeta"), uploadCategory: $("#uploadCategory"), uploadAssetName: $("#uploadAssetName"),
  uploadAssetTags: $("#uploadAssetTags"), uploadAssetDescription: $("#uploadAssetDescription"),
  uploadProgress: $("#uploadProgress"), uploadProgressText: $("#uploadProgressText"),
  uploadProgressPercent: $("#uploadProgressPercent"), uploadProgressFill: $("#uploadProgressFill"),
  confirmAssetUpload: $("#confirmAssetUpload"),
  txtProjectModal: $("#txtProjectModal"), txtFileInput: $("#txtFileInput"), txtDropZone: $("#txtDropZone"),
  txtFileLabel: $("#txtFileLabel"), txtProjectName: $("#txtProjectName"), txtTotalDuration: $("#txtTotalDuration"),
  txtShotDuration: $("#txtShotDuration"), txtQuality: $("#txtQuality"), txtPipeline: $("#txtPipeline"),
  createTxtProject: $("#createTxtProjectButton"), startTxtBatch: $("#startTxtBatchButton"),
  studioHeroImage: $("#studioHeroImage"), studioPreviewEmpty: $("#studioPreviewEmpty"),
  previewModeLabel: $("#previewModeLabel"), previewTitle: $("#previewTitle"), previewSubtitle: $("#previewSubtitle"),
  selectedAssetsBlock: $("#selectedAssetsBlock"), selectedAssetsStrip: $("#selectedAssetsStrip"), clearSelectedAssets: $("#clearSelectedAssets"),
  h3ReferencePanel: $("#h3ReferencePanel"), h3ReferenceGrid: $("#h3ReferenceGrid"), h3ReferenceEmpty: $("#h3ReferenceEmpty"),
  h3ReferenceCount: $("#h3ReferenceCount"), h3ReferenceInput: $("#h3ReferenceInput"), h3AddFiles: $("#h3AddFiles"),
  h3AddFromLibrary: $("#h3AddFromLibrary"), h3ReferenceQuality: $("#h3ReferenceQuality"), h3ReferenceSteps: $("#h3ReferenceSteps"),
  h3ShiftVideo: $("#h3ShiftVideo"), h3ShiftAudio: $("#h3ShiftAudio"),
  assetDock: $("#assetDock"), assetDockTabs: $("#assetDockTabs"), assetDockSearch: $("#assetDockSearch"),
  assetDockGrid: $("#assetDockGrid"), assetInspector: $("#assetInspector"), inspectorImage: $("#inspectorImage"),
  inspectorName: $("#inspectorName"), inspectorTags: $("#inspectorTags"), assetConsistency: $("#assetConsistency"),
  assetConsistencyValue: $("#assetConsistencyValue"), lockFace: $("#lockFaceToggle"), lockOutfit: $("#lockOutfitToggle"),
  assetRouteNote: $("#assetRouteNote"),
  canvasDrawer: $("#canvasDrawer"), canvasName: $("#canvasName"), canvasSaveState: $("#canvasSaveState"),
  canvasStage: $("#canvasStage"), canvasStageWrap: $("#canvasStageWrap"), canvasNodeLayer: $("#canvasNodeLayer"),
  canvasLinks: $("#canvasLinks"), canvasEmpty: $("#canvasEmpty"), canvasAssetList: $("#canvasAssetList"),
  canvasAssetSearch: $("#canvasAssetSearch"), canvasModelsPanel: $("#canvasModelsPanel"),
  canvasModelSummary: $("#canvasModelSummary"), savedCanvasList: $("#savedCanvasList"),
  canvasZoomLabel: $("#canvasZoomLabel"),
  canvasPalette: $(".canvas-palette"), canvasSidepanel: $(".canvas-sidepanel"),
};

const modeNames = {
  flux_video: "高清首帧 → MiniMax-H3 视频",
  image_video: "图片 → MiniMax-H3 视频",
  text_video: "MiniMax-H3 文字 → 视频",
  h3_reference: "MiniMax-H3 多素材参考 → 视频",
  text_image: "FLUX 文字 → 图片",
  merge: "项目镜头合并",
  postprocess: "视频后期处理",
  txt_batch: "TXT 剧本批量生成",
};
const qualityNames = { fast: "快速", standard: "标准", hd: "高清", ultra: "超清图片 1536×1024" };
const categoryNames = { character: "人物库", background: "背景库", reference: "参考图", work: "作品" };

let attachment = null;
let referenceAttachment = null;
let submitting = false;
let sceneGenerationPreparing = false;
let autoDirector = true;
let preserveFirstFrameState = true;
let turnaroundEnabled = false;
let expandedPrompts = null;
let pendingAsset = null;
let libraryCategory = "all";
let activeProject = null;
let lockedAsset = null;
const selectedAssets = new Map();
let h3References = [];
let assetDockCategory = "character";
let assetDockItems = [];
let assetSearchTimer = null;
let contextTarget = null;
let uploadFile = null;
let uploadPreviewUrl = null;
let txtFile = null;
let toastTimer = null;
const tasks = new Map();
let historyItems = [];
let localModels = { checkpoints: [], inpaint: [], controlnet: [], ipadapter: [], clip_vision: [], loras: [] };
let activeCanvas = null;
let canvasZoom = 1;
let canvasLinkStart = null;
let canvasDirty = false;

function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function showToast(text) {
  elements.toast.textContent = text;
  elements.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 2800);
}

function scrollToBottom() {
  requestAnimationFrame(() => { elements.conversation.scrollTop = elements.conversation.scrollHeight; });
}

function generateSeed() {
  return Math.floor(100_000_000 + Math.random() * 8_900_000_000);
}

function updateSeedControl() {
  const fixed = elements.seedMode.value === "fixed";
  elements.seedInput.hidden = !fixed;
  elements.randomizeSeed.title = fixed ? "换一个固定种子" : "预先生成一个固定种子";
  localStorage.setItem("agent-studio-seed-mode", elements.seedMode.value);
  if (fixed) localStorage.setItem("agent-studio-seed-value", elements.seedInput.value);
}

function syncTurnaroundUi() {
  const available = elements.mode.value === "text_image";
  const active = available && turnaroundEnabled;
  elements.turnaroundButton.style.display = available ? "flex" : "none";
  elements.turnaroundButton.classList.toggle("active", active);
  elements.turnaroundState.textContent = active ? "开启" : "关闭";
  elements.imageModel.disabled = active;
  elements.quality.disabled = active;
  if (active) {
    elements.imageModel.value = "realvis_xl";
    elements.quality.value = "ultra";
    elements.prompt.placeholder = "只描述角色的独特五官、发型、身材、服装和露肤范围；系统会分别生成正面、侧面、背面并自动拼版…";
  }
}

function setTurnaround(enabled, notify = true) {
  turnaroundEnabled = Boolean(enabled);
  if (turnaroundEnabled && elements.mode.value !== "text_image") setMode("text_image");
  if (turnaroundEnabled) {
    autoDirector = false;
    elements.directorState.textContent = "原样";
    elements.directorButton.classList.remove("active");
    elements.directorButton.title = "三视图模式会自动拆分视角，人物描述将原样发送";
  }
  localStorage.setItem("agent-studio-turnaround", turnaroundEnabled ? "1" : "0");
  syncTurnaroundUi();
  if (notify) showToast(turnaroundEnabled ? "已开启角色三视图：将分别生成面部、正面、侧面和背面" : "已关闭角色三视图");
}

function setMode(mode) {
  elements.mode.value = mode;
  elements.durationChip.style.display = mode === "text_image" ? "none" : "flex";
  elements.imageModelChip.style.display = ["text_image", "flux_video"].includes(mode) ? "flex" : "none";
  elements.stateLockButton.style.display = ["image_video", "flux_video"].includes(mode) ? "flex" : "none";
  elements.ultraQuality.hidden = mode !== "text_image";
  elements.ultraQuality.disabled = mode !== "text_image";
  if (mode !== "text_image" && elements.quality.value === "ultra") elements.quality.value = "hd";
  updateQualityLabels();
  $$(".quick-mode").forEach((button) => button.classList.toggle("active", button.dataset.mode === mode));
  $$(".creation-mode-tab").forEach((button) => button.classList.toggle("active", button.dataset.mode === mode));
  elements.videoPromptField.style.display = mode === "text_image" ? "none" : "block";
  if (elements.h3ReferencePanel) elements.h3ReferencePanel.hidden = mode !== "h3_reference";
  if (elements.selectedAssetsBlock) elements.selectedAssetsBlock.hidden = mode === "h3_reference";
  if (mode === "h3_reference") {
    elements.attach.style.display = "none";
    elements.referenceButton.style.display = "none";
  } else {
    elements.attach.style.display = "";
    elements.referenceButton.style.display = "";
  }
  if (mode === "image_video" && !attachment) elements.prompt.placeholder = "插入图片，再描述人物动作、镜头和声音…";
  else if (mode === "text_image") elements.prompt.placeholder = "描述要生成的高清图片…";
  else if (mode === "h3_reference") elements.prompt.placeholder = "描述这些人物在什么场景中做什么；系统会自动写入 <Subject>/<Picture>/<Video>/<Audio> 引用标签…";
  else elements.prompt.placeholder = "写下简单想法，提示词导演会自动补全分镜、背景和声音…";
  const previewLabels = {
    flux_video: ["高清首帧 → 视频", "角色参考会先稳定高清首帧，再交给 MiniMax-H3 生成视频"],
    image_video: ["图片 → 视频", "当前图片是首帧；角色资产用于补充人物设定，不替换原图"],
    text_video: ["文字 → 视频", "角色参考图会直接送入 MiniMax-H3，不经过 FLUX"],
    h3_reference: ["多素材参考 → 视频", "可组合最多 9 张图片、3 段视频和 3 段音频，并分别指定人物、场景、动作、风格或声音"],
    text_image: ["文字 → 图片", "RealVisXL 可使用角色参考图保持人物外观"],
  };
  if (elements.previewModeLabel) elements.previewModeLabel.textContent = previewLabels[mode][0];
  if (elements.assetRouteNote) elements.assetRouteNote.textContent = previewLabels[mode][1];
  syncTurnaroundUi();
  if (mode === "text_image" && turnaroundEnabled && elements.assetRouteNote) {
    elements.assetRouteNote.textContent = "三视图会分开生成面部、正面、侧面和背面，再自动拼成 1792×1024 角色设定图";
  }
  expandedPrompts = null;
  window.sceneWorkspace?.modeChanged();
}

function updateQualityLabels() {
  const imageOnly = elements.mode.value === "text_image";
  const labels = imageOnly
    ? { fast:"快速 · 896×576", standard:"高质量 · 1152×768", hd:"高清 · 1344×896", ultra:"超清 · 1536×1024" }
    : { fast:"快速 · 768×448", standard:"标准 · 1056×608", hd:"高清 · 1344×768" };
  [...elements.quality.options].forEach((option) => { if (labels[option.value]) option.textContent = labels[option.value]; });
}

function addAttachment(file) {
  if (!file || !file.type.startsWith("image/")) return showToast("请插入 PNG、JPG、WEBP 或 BMP 图片");
  if (file.size > 50 * 1024 * 1024) return showToast("图片不能超过 50MB");
  if (attachment?.preview) URL.revokeObjectURL(attachment.preview);
  attachment = { file, preview: URL.createObjectURL(file), uploadedFilename: null };
  elements.attachmentImage.src = attachment.preview;
  elements.attachmentName.textContent = file.name;
  elements.attachmentPreview.classList.remove("hidden");
  setMode("image_video");
  window.sceneWorkspace?.attachmentAdded();
}

function clearAttachment() {
  if (attachment?.preview) URL.revokeObjectURL(attachment.preview);
  attachment = null;
  elements.imageInput.value = "";
  elements.attachmentImage.removeAttribute("src");
  elements.attachmentPreview.classList.add("hidden");
  window.sceneWorkspace?.attachmentRemoved();
}

function addReferenceAttachment(file) {
  if (!file || !file.type.startsWith("image/")) return showToast("请选择 PNG、JPG、WEBP 或 BMP 参考图");
  if (file.size > 50 * 1024 * 1024) return showToast("参考图不能超过 50MB");
  if (referenceAttachment?.preview && referenceAttachment.ownsPreview !== false) URL.revokeObjectURL(referenceAttachment.preview);
  referenceAttachment = { file, preview: URL.createObjectURL(file), uploadedFilename: null, ownsPreview: true, assetId: null };
  elements.referenceImage.src = referenceAttachment.preview;
  elements.referenceName.textContent = file.name;
  elements.referencePreview.classList.remove("hidden");
  elements.referencePreview.classList.remove("asset-bound");
  elements.referenceButton.classList.add("active");
  if (!["text_image", "flux_video"].includes(elements.mode.value)) setMode("text_image");
  if (elements.imageModel.value !== "realvis_xl") elements.imageModel.value = "realvis_xl";
  showToast("已加入虚构成年角色参考脸");
}

function clearReferenceAttachment() {
  if (referenceAttachment?.preview && referenceAttachment.ownsPreview !== false) URL.revokeObjectURL(referenceAttachment.preview);
  referenceAttachment = null;
  elements.referenceInput.value = "";
  elements.referenceImage.removeAttribute("src");
  elements.referencePreview.classList.add("hidden");
  elements.referencePreview.classList.remove("asset-bound");
  elements.referenceButton.classList.remove("active");
}

function revealMessages() {
  if (window.studioShell) { window.studioShell.setView("results"); return; }
  elements.welcome.style.display = "none";
  elements.messages.classList.add("visible");
}

function appendUserMessage(prompt, imageUrl) {
  revealMessages();
  const wrapper = document.createElement("div");
  wrapper.className = "message user";
  wrapper.innerHTML = `<div class="user-bubble">${imageUrl ? `<img src="${imageUrl}" alt="插入的图片">` : ""}${escapeHtml(prompt).replaceAll("\n", "<br>")}</div>`;
  elements.messages.appendChild(wrapper);
  scrollToBottom();
}

function appendProgressMessage(mode, quality, duration, professional) {
  const wrapper = document.createElement("div");
  wrapper.className = "message assistant";
  wrapper.innerHTML = `<div class="assistant-message"><div class="assistant-avatar">✦</div><div class="assistant-content">
    <p class="assistant-title">正在为你创作</p>
    <div class="progress-card"><div class="progress-top"><span class="progress-label">正在准备任务…</span><span class="progress-percent">0%</span></div>
    <div class="progress-track"><div class="progress-fill"></div></div>
    <div class="task-meta"><span>${escapeHtml(modeNames[mode])}</span><span>${escapeHtml(qualityNames[quality])}</span>${mode !== "text_image" ? `<span>${duration} 秒</span>` : ""}${professional ? `<span>专业分镜</span>` : ""}</div></div>
    ${professional ? `<p class="prompt-applied">✦ 已自动生成首帧描述、分镜、背景、动作与声音提示词</p>` : ""}
  </div></div>`;
  elements.messages.appendChild(wrapper);
  scrollToBottom();
  return wrapper;
}

function updateProgress(wrapper, job) {
  if (!wrapper?.isConnected) return;
  const progress = Math.max(0, Math.min(100, Number(job.progress) || 0));
  const label = wrapper.querySelector(".progress-label");
  const percent = wrapper.querySelector(".progress-percent");
  const fill = wrapper.querySelector(".progress-fill");
  if (label) label.textContent = job.message || "正在生成…";
  if (percent) percent.textContent = `${progress}%`;
  if (fill) fill.style.width = `${progress}%`;
}

function showError(wrapper, message) {
  if (!wrapper?.isConnected) return;
  wrapper.querySelector(".assistant-title").textContent = "这次没有生成成功";
  wrapper.querySelector(".assistant-content").insertAdjacentHTML("beforeend", `<div class="error-card">${escapeHtml(message)}</div>`);
  wrapper.querySelector(".progress-card")?.remove();
  scrollToBottom();
}

function openSaveAsset(output, prompt) {
  pendingAsset = { output, prompt };
  openModal(elements.saveAssetModal);
}

function showResults(wrapper, outputs, prompt) {
  if (!wrapper?.isConnected) return;
  wrapper.querySelector(".assistant-title").textContent = outputs.length ? "已经生成好了" : "任务已完成";
  wrapper.querySelector(".progress-card")?.remove();
  const content = wrapper.querySelector(".assistant-content");
  const grid = document.createElement("div");
  grid.className = "result-grid";
  if (!outputs.length) {
    grid.innerHTML = `<div class="error-card">任务已经结束，但没有找到输出文件。可以在 ComfyUI 的 output 文件夹中检查结果。</div>`;
  } else {
    outputs.forEach((output) => {
      const card = document.createElement("div");
      card.className = "result-card";
      const media = output.kind === "video" ? `<video src="${escapeHtml(output.url)}" controls playsinline preload="metadata"></video>` : `<img src="${escapeHtml(output.url)}" alt="生成结果">`;
      const post = output.kind === "video" ? `<div class="postprocess-actions"><button data-post="upscale2x">2倍清晰化</button><button data-post="interpolate2x">2倍补帧</button><button data-post="deflicker">轻度去闪烁</button><button data-post="vertical">竖屏 9:16</button><button data-post="square">方形 1:1</button><button class="open-output-folder">打开文件夹</button></div>` : "";
      card.innerHTML = `${media}<div class="result-footer"><span>${escapeHtml(output.filename)}</span><div><button class="save-library-button">存入素材库</button> <a class="download-button" href="${escapeHtml(output.url)}" download>保存到本机</a></div></div>${post}`;
      card.querySelector(".save-library-button").addEventListener("click", () => openSaveAsset(output, prompt));
      card.querySelectorAll("[data-post]").forEach((button) => button.addEventListener("click", () => startPostprocess(output, button.dataset.post)));
      card.querySelector(".open-output-folder")?.addEventListener("click", () => openOutputFolder(output));
      card.addEventListener("contextmenu", (event) => openContextMenu(event, { output, prompt }));
      grid.appendChild(card);
    });
  }
  content.appendChild(grid);
  scrollToBottom();
}

async function openOutputFolder(output = {}) {
  const response = await fetch("/api/open-folder", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(output) });
  if (!response.ok) showToast(await response.text());
}

async function startPostprocess(output, operation) {
  const response = await fetch("/api/postprocess", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ operation, ...output }) });
  if (!response.ok) return showToast(await response.text());
  const job = await response.json();
  tasks.set(job.id, { job, wrapper: null, prompt: output.filename, quality: "hd", duration: 0, professional: false });
  renderTaskCenter();
  pollJob(job.id).catch(() => {});
  openDrawer(elements.taskDrawer);
}

async function useOutputAsVideoInput(output) {
  const response = await fetch(output.url);
  if (!response.ok) return showToast("无法读取这张图片");
  const blob = await response.blob();
  addAttachment(new File([blob], output.filename, { type: blob.type || "image/png" }));
  elements.prompt.focus();
  showToast("已保留图片，只需修改动作提示词即可重做视频");
}

function openContextMenu(event, target) {
  event.preventDefault();
  contextTarget = target;
  elements.contextMenu.style.left = `${Math.min(event.clientX, window.innerWidth - 210)}px`;
  elements.contextMenu.style.top = `${Math.min(event.clientY, window.innerHeight - 145)}px`;
  elements.contextMenu.classList.add("open");
}

async function uploadAttachment() {
  if (!attachment) return null;
  if (attachment.uploadedFilename) return attachment.uploadedFilename;
  const form = new FormData();
  form.append("image", attachment.file, attachment.file.name);
  const response = await fetch("/api/upload", { method: "POST", body: form });
  if (!response.ok) throw new Error(await response.text());
  const result = await response.json();
  attachment.uploadedFilename = result.filename;
  return result.filename;
}

async function uploadReferenceAttachment() {
  if (!referenceAttachment) return null;
  if (referenceAttachment.uploadedFilename) return referenceAttachment.uploadedFilename;
  if (referenceAttachment.assetId) {
    const response = await fetch(`/api/library/${encodeURIComponent(referenceAttachment.assetId)}/prepare`, { method: "POST" });
    if (!response.ok) throw new Error(await response.text());
    const result = await response.json();
    referenceAttachment.uploadedFilename = result.filename;
    return result.filename;
  }
  const form = new FormData();
  form.append("image", referenceAttachment.file, referenceAttachment.file.name);
  const response = await fetch("/api/reference/upload", { method: "POST", body: form });
  if (!response.ok) throw new Error(await response.text());
  const result = await response.json();
  referenceAttachment.uploadedFilename = result.filename;
  return result.filename;
}

function assetDisplayName(asset) {
  const raw = String(asset?.display_name || asset?.name || "未命名资产").replace(/\.[^.]+$/, "");
  const numberedShortHair = raw.match(/虚构成年女性角色参考脸短波波.*_(\d{3})$/);
  if (numberedShortHair) return `短发角色 ${Number(numberedShortHair[1])}`;
  if (raw.includes("虚构成年女性角色参考脸短波波")) return "短发角色";
  if (raw.includes("23岁成年亚洲女性短波波头侧")) return "白西装短发角色";
  if (raw === "短发学生女") return "黑裙短发角色";
  return raw
    .replace(/^[0-9a-f]{8}_/i, "")
    .replace(/^(人物|背景|参考|作品)_/, "")
    .replace(/_\d{4}_\d{3}$/, "")
    .slice(0, 18) || "未命名资产";
}

function selectedAssetBindings() {
  return [...selectedAssets.values()].map((asset) => ({
    id: asset.id,
    category: asset.category,
    name: assetDisplayName(asset),
    prompt: asset.prompt || "",
    tags: asset.tags || [],
    url: asset.url,
  }));
}

const h3RoleLabels = {
  character: "人物身份", scene: "场景背景", wardrobe: "服装造型", prop: "道具物体",
  motion: "动作与运镜", style: "画面风格", storyboard: "构图分镜", voice: "声音音色", music: "音乐节奏",
};
const h3UsageLabels = { all: "全片使用", opening: "仅开场", middle: "仅中段", ending: "仅结尾" };

function h3MediaType(value = {}) {
  if (["image", "video", "audio"].includes(value.kind)) return value.kind;
  const mime = String(value.type || "").toLowerCase();
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  const name = String(value.name || value.filename || "").toLowerCase();
  if (/\.(png|jpe?g|webp|bmp)$/.test(name)) return "image";
  if (/\.(mp4|webm|mov|mkv)$/.test(name)) return "video";
  if (/\.(mp3|wav|flac|m4a|aac|ogg)$/.test(name)) return "audio";
  return null;
}

function defaultH3Role(type, asset = {}) {
  if (type === "video") return "motion";
  if (type === "audio") return "music";
  if (asset.category === "character") return "character";
  if (asset.category === "background") return "scene";
  return "style";
}

function h3ReferenceLabel(reference) {
  if (reference.type === "image") {
    return `<Picture ${h3References.filter((item) => item.type === "image").indexOf(reference) + 1}>`;
  }
  if (reference.type === "video") {
    return `<Video ${h3References.filter((item) => item.type === "video").indexOf(reference) + 1}>`;
  }
  const pairedAudio = h3References.filter((item) => item.type === "video" && item.includeAudio).length;
  return `<Audio ${pairedAudio + h3References.filter((item) => item.type === "audio").indexOf(reference) + 1}>`;
}

function renderH3References() {
  if (!elements.h3ReferenceGrid) return;
  const counts = {
    image: h3References.filter((item) => item.type === "image").length,
    video: h3References.filter((item) => item.type === "video").length,
    audio: h3References.filter((item) => item.type === "audio").length,
  };
  elements.h3ReferenceCount.textContent = h3References.length ? `${counts.image} 张图片 · ${counts.video} 个视频 · ${counts.audio} 个音频` : "尚未添加素材";
  if (!h3References.length) {
    elements.h3ReferenceGrid.innerHTML = `<button class="h3-reference-empty" id="h3ReferenceEmpty" type="button"><span>＋</span><b>添加第一个参考素材</b><small>可以一次选择多个图片、视频或音频</small></button>`;
    elements.h3ReferenceGrid.querySelector("#h3ReferenceEmpty").addEventListener("click", () => elements.h3ReferenceInput.click());
    return;
  }
  elements.h3ReferenceGrid.innerHTML = h3References.map((reference, index) => {
    const media = reference.type === "image"
      ? `<img src="${escapeHtml(reference.preview)}" alt="${escapeHtml(reference.name)}">`
      : reference.type === "video"
        ? `<video src="${escapeHtml(reference.preview)}" muted preload="metadata"></video>`
        : `<span class="h3-ref-audio-icon">♫</span>`;
    const roles = Object.entries(h3RoleLabels).map(([value, label]) => `<option value="${value}" ${reference.role === value ? "selected" : ""}>用途 · ${label}</option>`).join("");
    const usages = Object.entries(h3UsageLabels).map(([value, label]) => `<option value="${value}" ${reference.usage === value ? "selected" : ""}>范围 · ${label}</option>`).join("");
    return `<article class="h3-ref-card" data-h3-id="${escapeHtml(reference.id)}">
      <div class="h3-ref-media">${media}<span class="h3-ref-index">${escapeHtml(h3ReferenceLabel(reference))}</span></div>
      <div class="h3-ref-fields"><div class="h3-ref-title"><b title="${escapeHtml(reference.name)}">${escapeHtml(reference.name)}</b><div class="h3-ref-controls"><button data-move="-1" title="向前">↑</button><button data-move="1" title="向后">↓</button><button data-remove title="移除">×</button></div></div>
      <select data-role>${roles}</select><select data-usage>${usages}</select>
      <input data-description value="${escapeHtml(reference.description || "")}" placeholder="补充人物、场景或动作特征（可选）">
      ${reference.type === "video" ? `<label class="h3-ref-pair-audio"><input data-audio type="checkbox" ${reference.includeAudio ? "checked" : ""}>同时参考视频原声</label>` : ""}</div></article>`;
  }).join("");
  elements.h3ReferenceGrid.querySelectorAll(".h3-ref-card").forEach((card) => {
    const reference = h3References.find((item) => item.id === card.dataset.h3Id);
    card.querySelector("[data-role]").addEventListener("change", (event) => { reference.role = event.target.value; });
    card.querySelector("[data-usage]").addEventListener("change", (event) => { reference.usage = event.target.value; });
    card.querySelector("[data-description]").addEventListener("input", (event) => { reference.description = event.target.value; });
    card.querySelector("[data-audio]")?.addEventListener("change", (event) => { reference.includeAudio = event.target.checked; renderH3References(); });
    card.querySelector("[data-remove]").addEventListener("click", () => {
      if (reference.ownsPreview && reference.preview) URL.revokeObjectURL(reference.preview);
      h3References = h3References.filter((item) => item.id !== reference.id);
      renderH3References(); renderAssetDock();
    });
    card.querySelectorAll("[data-move]").forEach((button) => button.addEventListener("click", () => {
      const current = h3References.indexOf(reference);
      const target = Math.max(0, Math.min(h3References.length - 1, current + Number(button.dataset.move)));
      if (target === current) return;
      h3References.splice(current, 1); h3References.splice(target, 0, reference); renderH3References();
    }));
  });
}

function addH3ReferenceFiles(files) {
  [...files].forEach((file) => {
    const type = h3MediaType(file);
    if (!type) return showToast(`不支持的素材：${file.name}`);
    const limit = { image: 9, video: 3, audio: 3 }[type];
    if (h3References.filter((item) => item.type === type).length >= limit) return showToast(`${type === "image" ? "图片" : type === "video" ? "视频" : "音频"}最多添加 ${limit} 个`);
    const maxSize = type === "image" ? 50 * 1024 ** 2 : type === "audio" ? 512 * 1024 ** 2 : 2 * 1024 ** 3;
    if (file.size > maxSize) return showToast(`${file.name} 文件过大`);
    h3References.push({
      id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, type, name: file.name,
      role: defaultH3Role(type), usage: "all", description: "", includeAudio: false,
      file, preview: URL.createObjectURL(file), ownsPreview: true, uploadedFilename: null, assetId: null,
    });
  });
  renderH3References();
}

function addH3ReferenceAsset(asset) {
  const type = h3MediaType(asset);
  if (!type) return showToast("这个素材格式不能用于 H3 参考");
  if (h3References.some((item) => item.assetId === asset.id)) return showToast("这个素材已经添加过了");
  const limit = { image: 9, video: 3, audio: 3 }[type];
  if (h3References.filter((item) => item.type === type).length >= limit) return showToast(`${type === "image" ? "图片" : type === "video" ? "视频" : "音频"}最多添加 ${limit} 个`);
  h3References.push({
    id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`, type, name: assetDisplayName(asset),
    role: defaultH3Role(type, asset), usage: "all", description: asset.prompt || (asset.tags || []).join("、"), includeAudio: false,
    file: null, preview: asset.url, ownsPreview: false, uploadedFilename: null, assetId: asset.id,
  });
  renderH3References(); renderAssetDock();
  showToast(`已加入 H3 参考：${assetDisplayName(asset)}`);
}

async function prepareH3References() {
  const prepared = [];
  for (let index = 0; index < h3References.length; index += 1) {
    const reference = h3References[index];
    if (!reference.uploadedFilename) {
      if (reference.assetId) {
        const response = await fetch(`/api/library/${encodeURIComponent(reference.assetId)}/prepare`, { method: "POST" });
        if (!response.ok) throw new Error(await response.text());
        reference.uploadedFilename = (await response.json()).filename;
      } else {
        const form = new FormData(); form.append("file", reference.file, reference.file.name);
        const response = await fetch("/api/h3-reference/upload", { method: "POST", body: form });
        if (!response.ok) throw new Error(await response.text());
        reference.uploadedFilename = (await response.json()).filename;
      }
    }
    prepared.push({
      filename: reference.uploadedFilename, type: reference.type, name: reference.name, role: reference.role,
      usage: reference.usage, description: reference.description, include_audio: reference.includeAudio, asset_id: reference.assetId,
    });
  }
  return prepared;
}

function clearH3References() {
  h3References.forEach((reference) => { if (reference.ownsPreview && reference.preview) URL.revokeObjectURL(reference.preview); });
  h3References = []; renderH3References(); renderAssetDock();
}

function buildAssetInstruction() {
  const bindings = selectedAssetBindings();
  if (!bindings.length) return "";
  const labels = { character: "人物", background: "场景", reference: "参考", work: "作品参考" };
  const lines = bindings.map((asset) => `@${asset.name}（${labels[asset.category] || "资产"}）：${asset.prompt || asset.tags.join("、") || asset.name}`);
  const character = selectedAssets.get("character");
  if (character) {
    lines.push(`角色一致性：${elements.assetConsistency.value}%；${elements.lockFace.checked ? "锁定脸型、五官与发型" : "允许脸部轻微变化"}；${elements.lockOutfit.checked ? "锁定服装、配饰与颜色" : "服装可按场景变化"}。`);
  }
  return `\n\n资产引用（必须执行）：\n${lines.join("\n")}`;
}

function saveAssetSelection() {
  localStorage.setItem("agent-studio-assets", JSON.stringify({
    ids: [...selectedAssets.values()].map((asset) => asset.id),
    consistency: Number(elements.assetConsistency.value),
    lockFace: elements.lockFace.checked,
    lockOutfit: elements.lockOutfit.checked,
  }));
}

function updateAssetInspector() {
  const character = selectedAssets.get("character");
  elements.assetInspector.classList.toggle("empty", !character);
  if (!character) return;
  elements.inspectorImage.src = character.url;
  elements.inspectorName.textContent = assetDisplayName(character);
  elements.inspectorTags.textContent = (character.tags || []).slice(0, 4).join(" · ") || "人物资产";
}

function updateStudioHero() {
  const character = selectedAssets.get("character");
  const fallback = assetDockItems.find((asset) => asset.category === "character" && asset.kind === "image");
  const asset = character || fallback;
  const preview = elements.studioHeroImage.closest(".studio-preview");
  if (!asset) {
    preview.classList.remove("has-image");
    elements.studioHeroImage.removeAttribute("src");
    return;
  }
  elements.studioHeroImage.src = asset.url;
  preview.classList.add("has-image");
  elements.previewTitle.textContent = character ? `已引用角色 · ${assetDisplayName(character)}` : "从角色资产开始创作";
  elements.previewSubtitle.textContent = character ? "参考图、人物描述与一致性设置已绑定到当前任务" : "在右侧选择角色后，人物设定会自动进入生成流程";
}

function renderSelectedAssets() {
  const labels = { character: "主角", background: "场景", reference: "参考", work: "作品" };
  const cards = [...selectedAssets.values()].map((asset) => `
    <article class="selected-asset-chip" data-selected-id="${escapeHtml(asset.id)}">
      ${asset.kind === "video" ? `<video src="${escapeHtml(asset.url)}" muted></video>` : asset.kind === "audio" ? `<span class="dock-audio-icon">♫</span>` : `<img loading="lazy" decoding="async" src="${escapeHtml(asset.url)}" alt="${escapeHtml(assetDisplayName(asset))}">`}
      <span><b>${escapeHtml(assetDisplayName(asset))}</b><small>@${escapeHtml(assetDisplayName(asset))} · ${labels[asset.category] || "资产"}</small></span>
      <button aria-label="移除${escapeHtml(assetDisplayName(asset))}">×</button>
    </article>`).join("");
  elements.selectedAssetsStrip.innerHTML = `${cards}<button class="add-asset-card" id="addAssetCard">从资产库添加</button>`;
  elements.selectedAssetsStrip.querySelectorAll(".selected-asset-chip button").forEach((button) => button.addEventListener("click", () => {
    const id = button.closest(".selected-asset-chip").dataset.selectedId;
    const asset = [...selectedAssets.values()].find((item) => item.id === id);
    if (asset) removeSelectedAsset(asset.category);
  }));
  $("#addAssetCard").addEventListener("click", showAssetDock);
  updateAssetInspector();
  updateStudioHero();
  renderAssetDock();
  window.sceneWorkspace?.syncAssets();
}

function setReferenceFromAsset(asset) {
  if (referenceAttachment?.preview && referenceAttachment.ownsPreview !== false) URL.revokeObjectURL(referenceAttachment.preview);
  referenceAttachment = { file: null, preview: asset.url, uploadedFilename: null, ownsPreview: false, assetId: asset.id };
  elements.referenceImage.src = asset.url;
  elements.referenceName.textContent = assetDisplayName(asset);
  elements.referencePreview.classList.remove("hidden");
  elements.referencePreview.classList.add("asset-bound");
  elements.referenceButton.classList.add("active");
  if (["text_image", "flux_video"].includes(elements.mode.value) && elements.imageModel.value !== "realvis_xl") {
    elements.imageModel.value = "realvis_xl";
    showToast("已切换到 RealVisXL，以使用角色参考图保持外观");
  }
}

function selectAsset(asset) {
  if (elements.mode.value === "h3_reference") {
    addH3ReferenceAsset(asset);
    return;
  }
  if (selectedAssets.get(asset.category)?.id === asset.id) {
    if (window.sceneWorkspace) { window.sceneWorkspace.assetSelected(asset); return; }
    return removeSelectedAsset(asset.category);
  }
  selectedAssets.set(asset.category, asset);
  if (asset.category === "character") {
    lockedAsset = asset;
    setReferenceFromAsset(asset);
  }
  saveAssetSelection();
  renderSelectedAssets();
  window.sceneWorkspace?.assetSelected(asset);
  showToast(`已引用${categoryNames[asset.category] || "资产"}：${assetDisplayName(asset)}`);
}

function removeSelectedAsset(category) {
  const asset = selectedAssets.get(category);
  if (!asset) return;
  selectedAssets.delete(category);
  if (category === "character") {
    lockedAsset = null;
    clearReferenceAttachment();
  }
  saveAssetSelection();
  renderSelectedAssets();
}

function showAssetDock() {
  document.body.classList.remove("asset-dock-hidden");
  elements.assetDockSearch.focus();
  window.sceneWorkspace?.pickerOpened();
}

function renderAssetDock() {
  if (!elements.assetDockGrid) return;
  const query = elements.assetDockSearch.value.trim().toLowerCase();
  const items = assetDockItems.filter((asset) => asset.category === assetDockCategory && (!query || `${asset.name} ${asset.prompt || ""} ${(asset.tags || []).join(" ")}`.toLowerCase().includes(query)));
  elements.assetDockTabs.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.category === assetDockCategory));
  if (!items.length) {
    elements.assetDockGrid.innerHTML = `<div class="empty-state">这个分类还没有素材</div>`;
    return;
  }
  elements.assetDockGrid.innerHTML = items.map((asset) => `
    <button class="dock-asset ${asset.kind === "audio" ? "audio" : ""} ${(elements.mode.value === "h3_reference" ? h3References.some((reference) => reference.assetId === asset.id) : selectedAssets.get(asset.category)?.id === asset.id) ? "selected" : ""}" data-asset-id="${escapeHtml(asset.id)}" title="${escapeHtml(asset.prompt || asset.name)}">
      ${asset.kind === "video" ? `<video src="${escapeHtml(asset.url)}" muted preload="metadata"></video>` : asset.kind === "audio" ? `<span class="dock-audio-icon">♫</span>` : `<img loading="lazy" decoding="async" src="${escapeHtml(asset.url)}" alt="${escapeHtml(assetDisplayName(asset))}">`}
      <span>${escapeHtml(assetDisplayName(asset))}</span>
    </button>`).join("");
  elements.assetDockGrid.querySelectorAll(".dock-asset").forEach((button) => button.addEventListener("click", () => {
    const asset = assetDockItems.find((item) => item.id === button.dataset.assetId);
    if (asset) selectAsset(asset);
  }));
}

async function loadAssetDock() {
  const response = await fetch("/api/library?category=all", { cache: "no-store" });
  if (!response.ok) return;
  const data = await response.json();
  assetDockItems = data.items || [];
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem("agent-studio-assets") || "{}") || {}; } catch {}
  if (!selectedAssets.size && Array.isArray(saved.ids)) {
    saved.ids.forEach((id) => {
      const asset = assetDockItems.find((item) => item.id === id);
      if (asset) selectedAssets.set(asset.category, asset);
    });
    const character = selectedAssets.get("character");
    if (character) { lockedAsset = character; setReferenceFromAsset(character); }
    if (Number.isFinite(saved.consistency)) elements.assetConsistency.value = saved.consistency;
    if (typeof saved.lockFace === "boolean") elements.lockFace.checked = saved.lockFace;
    if (typeof saved.lockOutfit === "boolean") elements.lockOutfit.checked = saved.lockOutfit;
  }
  elements.assetConsistencyValue.textContent = `${elements.assetConsistency.value}%`;
  elements.referenceStrength.value = (Number(elements.assetConsistency.value) / 100).toFixed(2);
  elements.referenceStrengthValue.textContent = `${elements.assetConsistency.value}%`;
  renderSelectedAssets();
}

async function requestExpandedPrompts(brief, mode) {
  const response = await fetch("/api/prompt/expand", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ brief: brief + buildAssetInstruction(), mode, style: elements.directorStyle.value, shot_count: Number(elements.directorShots.value), duration: Number(elements.duration.value) }),
  });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

function statusLabel(status) {
  if (status === "complete") return "已完成";
  if (status === "error") return "失败";
  if (status === "queued") return "排队中";
  if (status === "paused") return "已暂停";
  if (status === "cancelled") return "已取消";
  if (status === "starting") return "启动中";
  return "生成中";
}

function renderTaskCenter() {
  window.studioShell?.tasksChanged([...tasks.values()]);
  const records = [...tasks.values()].sort((a, b) => (b.job.created_at || 0) - (a.job.created_at || 0));
  const running = records.filter((record) => !["complete", "error", "cancelled", "paused"].includes(record.job.status)).length;
  const completed = records.filter((record) => record.job.status === "complete").length;
  elements.taskCount.textContent = running;
  elements.sidebarTaskCount.textContent = running;
  elements.runningTaskCount.textContent = running;
  elements.completedTaskCount.textContent = completed;
  if (!records.length) {
    elements.taskList.innerHTML = `<div class="empty-state">还没有生成任务</div>`;
    return;
  }
  elements.taskList.innerHTML = records.map((record) => {
    const job = record.job;
    const terminal = ["complete", "error", "cancelled"].includes(job.status);
    const eta = job.eta_seconds ? ` · 约剩 ${Math.ceil(job.eta_seconds / 60)} 分钟` : "";
    const controls = terminal
      ? `<button data-command="retry">重新生成</button><button data-command="delete">删除</button>`
      : job.status === "paused"
        ? `<button data-command="resume">继续</button><button data-command="cancel">取消</button><button data-command="delete">删除</button>`
        : `<button data-command="pause">暂停</button><button data-command="priority">置顶</button><button data-command="cancel">取消</button>`;
    const batch = job.batch ? `<p class="task-prompt">已完成 ${job.batch.completed || 0}/${job.batch.total || 0} 镜${job.batch.current ? ` · 当前：${escapeHtml(job.batch.current.title)}` : ""}</p>` : "";
    return `<article class="task-item" data-job-id="${job.id}"><div class="task-item-top"><div><b>${escapeHtml(modeNames[job.mode] || job.mode)}</b><br><small>${new Date((job.created_at || 0) * 1000).toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}${eta}</small></div><span class="task-status ${job.status}">${statusLabel(job.status)}</span></div><p class="task-prompt">${escapeHtml(record.prompt || "生成任务")}</p>${batch}<div class="mini-progress"><span style="width:${job.progress || 0}%"></span></div><div class="task-controls">${controls}</div></article>`;
  }).join("");
  $$(".task-item").forEach((item) => item.addEventListener("click", () => focusTask(item.dataset.jobId)));
  $$(".task-controls button").forEach((button) => button.addEventListener("click", (event) => {
    event.stopPropagation();
    controlTask(button.closest(".task-item").dataset.jobId, button.dataset.command);
  }));
}

async function controlTask(jobId, command) {
  if (command === "delete") {
    const record = tasks.get(jobId);
    if (record && !confirm(`从任务列表删除“${record.prompt || "这个任务"}”吗？\n生成的图片和视频不会被删除。`)) return;
    const response = await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
    if (!response.ok) return showToast(await response.text());
    record?.wrapper?.remove();
    tasks.delete(jobId);
    renderTaskCenter();
    showToast("任务已从列表删除，作品文件仍然保留");
    return;
  }
  const response = await fetch(`/api/jobs/${jobId}/${command}`, { method: "POST" });
  if (!response.ok) return showToast(await response.text());
  const job = await response.json();
  if (command === "retry") {
    const old = tasks.get(jobId);
    tasks.set(job.id, { ...old, job, wrapper: null });
    pollJob(job.id).catch(() => {});
  } else {
    const record = tasks.get(jobId);
    if (record) record.job = job;
    if (["resume", "priority"].includes(command)) pollJob(jobId).catch(() => {});
  }
  renderTaskCenter();
}

function focusTask(jobId) {
  window.studioShell?.setView("results");
  const record = tasks.get(jobId);
  closeDrawers();
  if (!record) return;
  if (record.wrapper?.isConnected) {
    record.wrapper.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  revealMessages();
  const wrapper = appendProgressMessage(record.job.mode, record.quality || "hd", record.duration || 5, record.professional);
  record.wrapper = wrapper;
  if (record.job.status === "complete") showResults(wrapper, record.job.outputs || [], record.prompt);
  else if (["error", "cancelled"].includes(record.job.status)) showError(wrapper, record.job.error || statusLabel(record.job.status));
  else updateProgress(wrapper, record.job);
}

async function pollJob(jobId) {
  while (true) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    const response = await fetch(`/api/jobs/${jobId}`, { cache: "no-store" });
    if (!response.ok) throw new Error(await response.text());
    const job = await response.json();
    const record = tasks.get(jobId);
    if (!record) return;
    record.job = job;
    updateProgress(record.wrapper, job);
    renderTaskCenter();
    if (job.status === "complete") {
      showResults(record.wrapper, job.outputs || [], record.prompt);
      return;
    }
    if (["error", "cancelled"].includes(job.status)) throw new Error(job.error || statusLabel(job.status));
    if (job.status === "paused") return;
  }
}

async function generate() {
  if (submitting || sceneGenerationPreparing) return;
  if (window.studioShell?.applyLocalCommand()) return;
  sceneGenerationPreparing = true;
  try {
    if (window.sceneWorkspace && await window.sceneWorkspace.prepareForGeneration() === false) return;
  } catch (error) { showToast(error.message || "首帧准备失败"); return; }
  finally { sceneGenerationPreparing = false; }
  const brief = elements.prompt.value.trim();
  const mode = elements.mode.value;
  const turnaroundActive = mode === "text_image" && turnaroundEnabled;
  if (!brief) { elements.prompt.focus(); return showToast("先写下你想生成的内容"); }
  if (mode === "image_video" && !attachment) { showToast("图片生成视频需要先插入一张图片"); return elements.imageInput.click(); }
  if (mode === "h3_reference" && !h3References.length) { showToast("请先添加至少一个人物、场景、视频或音频素材"); return showAssetDock(); }
  let seed = null;
  if (elements.seedMode.value === "fixed") {
    seed = Number(elements.seedInput.value);
    if (!Number.isSafeInteger(seed) || seed < 1) return showToast("固定种子需要填写 1 以上的整数");
  }

  const quality = elements.quality.value;
  const imageModel = elements.imageModel.value;
  const imageModelOption = elements.imageModel.selectedOptions[0];
  const checkpointName = imageModelOption?.dataset.checkpoint || null;
  const duration = Number(elements.duration.value);
  appendUserMessage(brief, mode === "image_video" ? attachment?.preview : mode === "h3_reference" ? h3References.find((item) => item.type === "image")?.preview : referenceAttachment?.preview);
  const wrapper = appendProgressMessage(mode, quality, duration, autoDirector || Boolean(expandedPrompts));
  submitting = true;
  elements.generate.disabled = true;
  try {
    let image = null;
    if (mode === "image_video") {
      updateProgress(wrapper, { progress: 1, message: "正在读取插入的图片…" });
      image = await uploadAttachment();
    }
    let referenceImage = null;
    if (!turnaroundActive && referenceAttachment && ((["text_image", "flux_video"].includes(mode) && ["realvis_xl", "sdxl_local"].includes(imageModel)) || mode === "text_video")) {
      updateProgress(wrapper, { progress: 1, message: "正在读取虚构角色参考脸…" });
      referenceImage = await uploadReferenceAttachment();
    }
    let preparedH3References = [];
    if (mode === "h3_reference") {
      updateProgress(wrapper, { progress: 1, message: `正在准备 ${h3References.length} 个参考素材…` });
      preparedH3References = await prepareH3References();
    }
    let prompts = expandedPrompts && expandedPrompts.brief === brief ? expandedPrompts : null;
    if (!turnaroundActive && mode !== "h3_reference" && autoDirector && !prompts) {
      updateProgress(wrapper, { progress: 2, message: "提示词导演正在编写专业分镜…" });
      prompts = await requestExpandedPrompts(brief, mode);
    }
    const assetInstruction = buildAssetInstruction();
    const appendAssets = (value) => assetInstruction && !String(value).includes("资产引用（必须执行）") ? `${value}${assetInstruction}` : value;
    const imagePrompt = appendAssets(prompts?.image_prompt || brief);
    const videoPrompt = appendAssets(prompts?.video_prompt || brief);
    const response = await fetch("/api/generate", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode, quality, duration, prompt: brief, image, image_model: imageModel, checkpoint_name: checkpointName, seed,
        turnaround_sheet: turnaroundActive,
        reference_image: referenceImage,
        reference_strength: Number(elements.assetConsistency.value) / 100,
        prompt_mode: turnaroundActive ? "raw" : (autoDirector ? "director" : "raw"),
        preserve_first_frame_state: preserveFirstFrameState,
        image_prompt: imagePrompt,
        video_prompt: videoPrompt,
        asset_bindings: selectedAssetBindings(),
        asset_controls: { consistency: Number(elements.assetConsistency.value), lock_face: elements.lockFace.checked, lock_outfit: elements.lockOutfit.checked },
        h3_references: preparedH3References,
        h3_reference_options: mode === "h3_reference" ? {
          ref_image_size: elements.h3ReferenceQuality.value,
          steps: Number(elements.h3ReferenceSteps.value),
          shift_video: Number(elements.h3ShiftVideo.value),
          shift_audio: Number(elements.h3ShiftAudio.value),
        } : null,
      }),
    });
    if (!response.ok) throw new Error(await response.text());
    const job = await response.json();
    tasks.set(job.id, { job, wrapper, prompt: brief, quality, duration, professional: turnaroundActive || Boolean(prompts) });
    renderTaskCenter();
    updateProgress(wrapper, job);
    elements.prompt.value = "";
    expandedPrompts = null;
    autoGrow();
    pollJob(job.id).catch((error) => {
      const record = tasks.get(job.id);
      if (record) { record.job.status = "error"; record.job.error = error.message; showError(record.wrapper, error.message); renderTaskCenter(); }
    });
  } catch (error) {
    showError(wrapper, error.message || String(error));
  } finally {
    submitting = false;
    elements.generate.disabled = false;
  }
}

function autoGrow() {
  elements.prompt.style.height = "auto";
  elements.prompt.style.height = `${Math.min(elements.prompt.scrollHeight, 160)}px`;
}

function openDrawer(drawer) {
  closeDrawers();
  drawer.classList.add("open");
  elements.drawerScrim.classList.add("visible");
}
function closeDrawers() {
  $$(".drawer.open").forEach((drawer) => drawer.classList.remove("open"));
  elements.drawerScrim.classList.remove("visible");
}
function openModal(modal) { modal.classList.add("open"); }
function closeModal(modal) { modal.classList.remove("open"); }

async function loadLibrary(category = libraryCategory) {
  libraryCategory = category;
  elements.libraryTabs.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.category === category));
  const query = elements.librarySearch.value.trim();
  const response = await fetch(`/api/library?category=${encodeURIComponent(category)}&q=${encodeURIComponent(query)}`, { cache: "no-store" });
  const data = await response.json();
  if (!data.items.length) {
    elements.libraryGrid.innerHTML = `<div class="empty-state">这个分类还没有素材。生成结果后点击“存入素材库”即可保存。</div>`;
    return;
  }
  elements.libraryGrid.innerHTML = data.items.map((asset) => `<article class="asset-card" data-asset-id="${asset.id}"><div class="asset-media">${asset.kind === "video" ? `<video src="${asset.url}" muted preload="metadata"></video>` : asset.kind === "audio" ? `<div class="library-audio"><span>♫</span><audio src="${asset.url}" preload="metadata"></audio></div>` : `<img src="${asset.url}" alt="${escapeHtml(asset.name)}">`}<span class="asset-category">${categoryNames[asset.category]}${asset.favorite ? " · ★" : ""}</span></div><div class="asset-info"><b>${escapeHtml(asset.name)}</b><div class="asset-actions">${asset.kind === "image" ? `<button class="primary use-asset">调用素材</button><button class="lock-asset">锁定人物</button>` : `<button class="primary preview-asset">播放</button>`}<button class="edit-asset">编辑</button><button class="delete-asset">删除</button></div></div></article>`).join("");
  data.items.forEach((asset) => {
    const card = elements.libraryGrid.querySelector(`[data-asset-id="${asset.id}"]`);
    card.querySelector(".use-asset")?.addEventListener("click", () => useLibraryAsset(asset));
    card.querySelector(".lock-asset")?.addEventListener("click", () => lockLibraryAsset(asset));
    card.querySelector(".preview-asset")?.addEventListener("click", () => { const media = card.querySelector("video, audio"); media.controls = true; media.play(); });
    card.querySelector(".delete-asset").addEventListener("click", () => deleteLibraryAsset(asset));
    card.querySelector(".edit-asset").addEventListener("click", () => editLibraryAsset(asset));
    card.addEventListener("contextmenu", (event) => openContextMenu(event, { asset }));
  });
}

async function useLibraryAsset(asset) {
  const response = await fetch(asset.url);
  const blob = await response.blob();
  addAttachment(new File([blob], asset.name, { type: blob.type || "image/png" }));
  closeDrawers();
  elements.prompt.focus();
  showToast(`已调用素材：${asset.name}`);
}

async function lockLibraryAsset(asset) {
  selectAsset(asset);
  closeDrawers();
  showAssetDock();
}

async function editLibraryAsset(asset) {
  const name = prompt("素材名称", asset.name);
  if (name === null) return;
  const tagsText = prompt("标签（用逗号分隔）", (asset.tags || []).join(","));
  if (tagsText === null) return;
  const description = prompt("素材描述 / 人物特征", asset.prompt || "");
  if (description === null) return;
  const response = await fetch(`/api/library/${asset.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, tags: tagsText.split(/[,，]/), prompt: description, favorite: !asset.favorite }) });
  if (!response.ok) return showToast(await response.text());
  await Promise.all([loadLibrary(), loadAssetDock()]);
}

async function deleteLibraryAsset(asset) {
  if (!confirm(`删除“${asset.name}”吗？`)) return;
  const response = await fetch(`/api/library/${asset.id}`, { method: "DELETE" });
  if (!response.ok) return showToast(await response.text());
  if (selectedAssets.get(asset.category)?.id === asset.id) removeSelectedAsset(asset.category);
  await Promise.all([loadLibrary(), loadAssetDock()]);
}

async function savePendingAsset(category) {
  if (!pendingAsset) return;
  const output = pendingAsset.output;
  const response = await fetch("/api/library/save", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ category, filename: output.filename, subfolder: output.subfolder, type: output.type, prompt: pendingAsset.prompt }),
  });
  if (!response.ok) return showToast(await response.text());
  const asset = await response.json();
  closeModal(elements.saveAssetModal);
  pendingAsset = null;
  await loadAssetDock();
  showToast(`已自动命名并保存：${asset.name}`);
}

function formatFileSize(bytes) {
  if (bytes >= 1024 ** 3) return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  if (bytes >= 1024 ** 2) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function selectUploadFile(file) {
  if (!file) return;
  const isAudio = file.type.startsWith("audio/") || /\.(mp3|wav|flac|ogg|m4a|aac)$/i.test(file.name);
  const valid = file.type.startsWith("image/") || file.type.startsWith("video/") || isAudio || /\.(mkv|webm|mov|mp4)$/i.test(file.name);
  if (!valid) return showToast("请选择支持的图片、视频或音频文件");
  if (file.size > 2 * 1024 ** 3) return showToast("素材文件不能超过 2GB");
  if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
  uploadFile = file;
  uploadPreviewUrl = URL.createObjectURL(file);
  const isVideo = file.type.startsWith("video/") || /\.(mkv|webm|mov|mp4)$/i.test(file.name);
  elements.uploadThumb.innerHTML = isVideo ? `<video src="${uploadPreviewUrl}" muted></video>` : isAudio ? `<span class="upload-audio-icon">♫</span>` : `<img src="${uploadPreviewUrl}" alt="素材预览">`;
  elements.uploadFileName.textContent = file.name;
  elements.uploadFileMeta.textContent = `${isVideo ? "视频" : isAudio ? "音频" : "图片"} · ${formatFileSize(file.size)}`;
  elements.uploadFilePreview.classList.remove("hidden");
  elements.assetDropZone.style.display = "none";
}

function resetUploadForm() {
  if (uploadPreviewUrl) URL.revokeObjectURL(uploadPreviewUrl);
  uploadPreviewUrl = null;
  uploadFile = null;
  elements.assetFileInput.value = "";
  elements.uploadFilePreview.classList.add("hidden");
  elements.assetDropZone.style.display = "flex";
  elements.uploadThumb.innerHTML = "";
  elements.uploadAssetName.value = "";
  elements.uploadAssetTags.value = "";
  elements.uploadAssetDescription.value = "";
  elements.uploadProgress.classList.add("hidden");
  elements.uploadProgressFill.style.width = "0%";
  elements.uploadProgressPercent.textContent = "0%";
  elements.confirmAssetUpload.disabled = false;
}

function uploadAssetFile() {
  if (!uploadFile) return showToast("请先选择素材文件");
  const form = new FormData();
  form.append("file", uploadFile, uploadFile.name);
  form.append("category", elements.uploadCategory.value);
  form.append("name", elements.uploadAssetName.value.trim());
  form.append("tags", elements.uploadAssetTags.value.trim());
  form.append("description", elements.uploadAssetDescription.value.trim());
  elements.uploadProgress.classList.remove("hidden");
  elements.confirmAssetUpload.disabled = true;
  const xhr = new XMLHttpRequest();
  xhr.open("POST", "/api/library/upload");
  xhr.upload.addEventListener("progress", (event) => {
    if (!event.lengthComputable) return;
    const percent = Math.min(99, Math.round(event.loaded / event.total * 100));
    elements.uploadProgressPercent.textContent = `${percent}%`;
    elements.uploadProgressFill.style.width = `${percent}%`;
    elements.uploadProgressText.textContent = "正在复制到统一资料文件夹…";
  });
  xhr.addEventListener("load", () => {
    elements.confirmAssetUpload.disabled = false;
    if (xhr.status < 200 || xhr.status >= 300) return showToast(xhr.responseText || "上传失败");
    const asset = JSON.parse(xhr.responseText);
    elements.uploadProgressPercent.textContent = "100%";
    elements.uploadProgressFill.style.width = "100%";
    closeModal(elements.uploadAssetModal);
    resetUploadForm();
    loadLibrary(asset.category);
    loadAssetDock();
    showToast(`素材已上传：${asset.name}`);
  });
  xhr.addEventListener("error", () => { elements.confirmAssetUpload.disabled = false; showToast("上传失败，请重试"); });
  xhr.send(form);
}

async function loadProjects() {
  const response = await fetch("/api/projects", { cache: "no-store" });
  const data = await response.json();
  elements.projectCreate.style.display = "block";
  elements.projectList.style.display = "grid";
  elements.projectDetail.classList.add("hidden");
  elements.projectList.innerHTML = data.projects.length ? data.projects.map((project) => `<article class="project-card" data-project-id="${project.id}"><b>${escapeHtml(project.name)}</b><p>${escapeHtml(project.brief || "尚未填写故事梗概")}</p><small>${project.shot_count} 个镜头 · ${new Date(project.updated_at * 1000).toLocaleDateString()}</small></article>`).join("") : `<div class="empty-state">还没有项目。填写上方故事梗概即可自动建立时间线。</div>`;
  $$(".project-card").forEach((card) => card.addEventListener("click", () => openProject(card.dataset.projectId)));
}

async function createProject() {
  const brief = elements.projectBrief.value.trim();
  if (!brief) return showToast("先填写故事梗概");
  const response = await fetch("/api/projects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: elements.projectName.value.trim(), brief, shot_count: Number(elements.projectShotCount.value), quality: elements.quality.value }) });
  if (!response.ok) return showToast(await response.text());
  activeProject = await response.json();
  renderProjectDetail();
}

async function openProject(projectId) {
  const response = await fetch(`/api/projects/${projectId}`, { cache: "no-store" });
  if (!response.ok) return showToast(await response.text());
  activeProject = await response.json();
  renderProjectDetail();
}

function versionOutput(shot) {
  const versions = shot.versions || [];
  const version = versions.find((item) => item.id === shot.active_version) || versions.at(-1);
  return version?.outputs?.find((output) => output.kind === "video") || version?.outputs?.[0];
}

function renderProjectDetail() {
  elements.projectCreate.style.display = "none";
  elements.projectList.style.display = "none";
  elements.projectDetail.classList.remove("hidden");
  elements.activeProjectName.textContent = activeProject.name;
  const complete = activeProject.shots.filter((shot) => shot.status === "complete").length;
  const isTxt = activeProject.source_type === "txt";
  elements.activeProjectMeta.textContent = `${activeProject.shots.length} 个镜头 · ${complete} 个已完成 · ${isTxt ? "TXT 自动分镜，可编辑后分批生成" : "可单独重做任意镜头"}`;
  elements.startTxtBatch.classList.toggle("hidden", !isTxt);
  elements.startTxtBatch.textContent = complete ? "▶ 继续生成未完成镜头" : "▶ 分批生成全部镜头";
  let previousScene = null;
  elements.projectTimeline.innerHTML = activeProject.shots.sort((a,b) => a.order-b.order).map((shot, index) => {
    const output = versionOutput(shot);
    const preview = output ? (output.kind === "video" ? `<video src="${output.url}" muted preload="metadata"></video>` : `<img src="${output.url}">`) : "";
    const divider = isTxt && shot.scene_title && shot.scene_title !== previousScene ? `<div class="scene-divider">场景 ${Number(shot.scene_index || 0) + 1} · ${escapeHtml(shot.scene_title)}</div>` : "";
    previousScene = shot.scene_title || previousScene;
    return `${divider}<article class="shot-card" data-shot-id="${shot.id}"><div class="shot-top"><span class="shot-number">${index+1}</span><input class="shot-title" value="${escapeHtml(shot.title)}"><span class="shot-status">${escapeHtml(shot.status)}</span></div><textarea class="shot-prompt" rows="4">${escapeHtml(shot.prompt)}</textarea><div class="shot-options"><select class="shot-duration"><option value="3">3 秒</option><option value="5">5 秒</option><option value="8">8 秒</option><option value="10">10 秒</option><option value="15">15 秒</option></select><select class="shot-quality"><option value="fast">快速</option><option value="standard">标准</option><option value="hd">高清</option></select><label><input class="shot-chain" type="checkbox" ${shot.chain_previous ? "checked" : ""}> 自动承接上一镜头尾帧</label></div><div class="shot-actions"><button class="generate-shot">${shot.versions?.length ? "重做此镜头" : "生成此镜头"}</button><button class="save-shot">保存修改</button><button class="delete-shot">删除</button></div>${output ? `<div class="shot-version">${preview}<span>版本 ${shot.versions.length} · <select class="version-select">${shot.versions.map((version, vi) => `<option value="${version.id}" ${version.id === shot.active_version ? "selected" : ""}>版本 ${vi+1}</option>`).join("")}</select></span></div>` : ""}</article>`;
  }).join("");
  activeProject.shots.forEach((shot) => {
    const card = elements.projectTimeline.querySelector(`[data-shot-id="${shot.id}"]`);
    card.querySelector(".shot-duration").value = String(shot.duration);
    card.querySelector(".shot-quality").value = shot.quality;
    card.querySelector(".save-shot").addEventListener("click", () => saveShotFromCard(shot, card));
    card.querySelector(".generate-shot").addEventListener("click", () => generateProjectShot(shot, card));
    card.querySelector(".delete-shot").addEventListener("click", () => deleteProjectShot(shot));
    card.querySelector(".version-select")?.addEventListener("change", async (event) => { await updateShot(shot.id, { active_version: event.target.value }); await openProject(activeProject.id); });
  });
}

function shotPayload(card) {
  return { title: card.querySelector(".shot-title").value.trim(), prompt: card.querySelector(".shot-prompt").value.trim(), duration: Number(card.querySelector(".shot-duration").value), quality: card.querySelector(".shot-quality").value, chain_previous: card.querySelector(".shot-chain").checked };
}

async function updateShot(shotId, payload) {
  const response = await fetch(`/api/projects/${activeProject.id}/shots/${shotId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error(await response.text());
  return response.json();
}

async function saveShotFromCard(shot, card) {
  try { await updateShot(shot.id, shotPayload(card)); showToast("镜头修改已保存"); } catch (error) { showToast(error.message); }
}

async function generateProjectShot(shot, card) {
  const values = shotPayload(card);
  await updateShot(shot.id, values);
  const prompts = await requestExpandedPrompts(values.prompt, values.chain_previous ? "image_video" : "flux_video");
  const referenceImage = referenceAttachment && !values.chain_previous ? await uploadReferenceAttachment() : null;
  const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
    mode: values.chain_previous ? "image_video" : "flux_video",
    quality: values.quality, duration: values.duration, prompt: values.prompt,
    image_prompt: prompts.image_prompt, video_prompt: prompts.video_prompt,
    image_model: "realvis_xl", reference_image: referenceImage,
    reference_strength: Number(elements.assetConsistency.value) / 100,
    asset_bindings: selectedAssetBindings(),
    asset_controls: { consistency: Number(elements.assetConsistency.value), lock_face: elements.lockFace.checked, lock_outfit: elements.lockOutfit.checked },
    project_id: activeProject.id, shot_id: shot.id, chain_previous: values.chain_previous,
  }) });
  if (!response.ok) return showToast(await response.text());
  const job = await response.json();
  tasks.set(job.id, { job, wrapper: null, prompt: values.prompt, quality: values.quality, duration: values.duration, professional: true });
  renderTaskCenter();
  pollJob(job.id).then(() => openProject(activeProject.id)).catch(() => {});
  showToast("镜头已提交，可继续编辑其他镜头");
}

async function deleteProjectShot(shot) {
  if (!confirm(`删除“${shot.title}”吗？`)) return;
  await fetch(`/api/projects/${activeProject.id}/shots/${shot.id}`, { method: "DELETE" });
  openProject(activeProject.id);
}

async function addProjectShot() {
  const response = await fetch(`/api/projects/${activeProject.id}/shots`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: activeProject.brief, duration: 5, quality: "hd" }) });
  if (!response.ok) return showToast(await response.text());
  openProject(activeProject.id);
}

async function exportProject() {
  const response = await fetch(`/api/projects/${activeProject.id}/export`, { method: "POST" });
  if (!response.ok) return showToast(await response.text());
  const job = await response.json();
  tasks.set(job.id, { job, wrapper: null, prompt: activeProject.name, quality: "hd", duration: 0, professional: false });
  renderTaskCenter();
  pollJob(job.id).catch(() => {});
  openDrawer(elements.taskDrawer);
}

function selectTxtFile(file) {
  if (!file) return;
  if (!file.name.toLowerCase().endsWith(".txt")) return showToast("请选择 TXT 文本文件");
  if (file.size > 5 * 1024 * 1024) return showToast("TXT 文件不能超过 5MB");
  txtFile = file;
  elements.txtFileLabel.textContent = `${file.name} · ${(file.size / 1024).toFixed(1)} KB`;
  if (!elements.txtProjectName.value.trim()) elements.txtProjectName.value = file.name.replace(/\.txt$/i, "");
}

function openTxtProjectModal() {
  txtFile = null;
  elements.txtFileInput.value = "";
  elements.txtFileLabel.textContent = "选择 TXT 剧本";
  elements.txtProjectName.value = "";
  openModal(elements.txtProjectModal);
}

async function createTxtProject() {
  if (!txtFile) return showToast("请先选择一份 TXT 剧本");
  const form = new FormData();
  form.append("file", txtFile, txtFile.name);
  form.append("name", elements.txtProjectName.value.trim());
  form.append("duration", elements.txtTotalDuration.value);
  form.append("shot_duration", elements.txtShotDuration.value);
  form.append("quality", elements.txtQuality.value);
  form.append("pipeline", elements.txtPipeline.value);
  form.append("style", "cinematic");
  elements.createTxtProject.disabled = true;
  elements.createTxtProject.textContent = "正在分析场景、动作与前后逻辑…";
  try {
    const response = await fetch("/api/txt-projects", { method:"POST", body:form });
    if (!response.ok) throw new Error(await response.text());
    activeProject = await response.json();
    closeModal(elements.txtProjectModal);
    openDrawer(elements.projectDrawer);
    renderProjectDetail();
    showToast(`已拆分为 ${activeProject.shots.length} 个镜头，请检查后开始批量生成`);
  } catch (error) { showToast(error.message); }
  finally { elements.createTxtProject.disabled = false; elements.createTxtProject.innerHTML = "<span>✦</span>分析 TXT 并生成分镜计划"; }
}

async function startTxtBatch() {
  if (!activeProject || activeProject.source_type !== "txt") return;
  elements.startTxtBatch.disabled = true;
  try {
    const response = await fetch(`/api/projects/${activeProject.id}/txt-start`, { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({auto_merge:true}) });
    if (!response.ok) throw new Error(await response.text());
    const job = await response.json();
    tasks.set(job.id, { job, wrapper:null, prompt:activeProject.name, quality:activeProject.batch_options?.quality || "hd", duration:0, professional:true });
    renderTaskCenter();
    pollJob(job.id).then(() => openProject(activeProject.id)).catch(() => {});
    openDrawer(elements.taskDrawer);
    showToast("TXT 批量任务已开始；会按顺序生成并自动合成");
  } catch (error) { showToast(error.message); }
  finally { elements.startTxtBatch.disabled = false; }
}

async function checkHealth() {
  try {
    const response = await fetch("/api/health", { cache: "no-store" });
    const health = await response.json();
    if (health.ready) {
      elements.statusDot.className = "status-dot ready";
      elements.engineState.textContent = "本地模型已就绪";
      elements.engineDevice.textContent = health.device || "FLUX + MiniMax-H3";
      const realvisOption = elements.imageModel.querySelector('option[value="realvis_xl"]');
      if (realvisOption) {
        realvisOption.disabled = health.image_models?.realvis_xl === false;
        realvisOption.textContent = health.image_models?.realvis_xl === false ? "RealVisXL V5.0 · 正在安装" : "RealVisXL V5.0 · 写实人物";
        if (realvisOption.disabled && elements.imageModel.value === "realvis_xl") elements.imageModel.value = "flux";
      }
      return;
    }
    elements.statusDot.className = "status-dot starting";
    elements.engineState.textContent = "正在启动本地模型";
  } catch {
    elements.statusDot.className = "status-dot error";
    elements.engineState.textContent = "工作台连接异常";
  }
}

async function loadExistingTasks() {
  try {
    const response = await fetch("/api/jobs", { cache: "no-store" });
    const data = await response.json();
    data.jobs.forEach((job) => tasks.set(job.id, { job, wrapper: null, prompt: job.prompt || "之前提交的生成任务", quality: job.settings?.quality || "hd", duration: job.settings?.duration || 5, professional: true }));
    renderTaskCenter();
    data.jobs.filter((job) => !["complete", "error"].includes(job.status)).forEach((job) => pollJob(job.id).catch(() => {}));
  } catch { renderTaskCenter(); }
}

function historyStatusText(status) {
  return ({ complete: "已完成", error: "未成功", cancelled: "已取消", paused: "已暂停", running: "生成中", queued: "排队中", starting: "准备中", created: "已提交" })[status] || status;
}

function historyDate(timestamp) {
  return new Date((Number(timestamp) || 0) * 1000).toLocaleString("zh-CN", { month:"2-digit", day:"2-digit", hour:"2-digit", minute:"2-digit" });
}

function renderHistory() {
  elements.historyCount.textContent = historyItems.length;
  elements.historySummary.textContent = historyItems.length ? `共 ${historyItems.length} 条 · 保存于本机“历史记录”文件夹` : "每次点击生成后，提示词会立即保存在本机";
  if (!historyItems.length) {
    elements.historyList.innerHTML = `<div class="empty-state">暂时没有记录。点击“找回旧记录”，可以尝试从 ComfyUI 恢复以前的提示词。</div>`;
    return;
  }
  elements.historyList.innerHTML = historyItems.map((item) => {
    const settings = item.settings || {};
    const meta = `${modeNames[item.mode] || item.mode} · ${settings.turnaround_sheet ? "角色三视图 1792×1024" : (qualityNames[settings.quality] || settings.quality || "默认画质")}${item.mode !== "text_image" ? ` · ${settings.duration || 5} 秒` : ""}${settings.seed ? ` · 种子 ${settings.seed}` : ""}`;
    const outputs = item.outputs || [];
    const recovered = item.recovered ? `<span class="history-recovered">恢复记录</span>` : "";
    const professional = item.image_prompt || item.video_prompt;
    return `<article class="history-item" data-history-id="${escapeHtml(item.id)}">
      <div class="history-item-head"><div><b>${escapeHtml(item.title || "创作记录")}</b><small>${historyDate(item.created_at)} · ${escapeHtml(meta)}</small></div><span class="task-status ${escapeHtml(item.status)}">${historyStatusText(item.status)}</span></div>
      <p class="history-prompt">${escapeHtml(item.prompt || item.video_prompt || item.image_prompt || "未找到提示词")}</p>
      <div class="history-tags">${recovered}${item.professional ? `<span>专业提示词</span>` : ""}${outputs.length ? `<span>${outputs.length} 个结果</span>` : ""}</div>
      ${professional ? `<details><summary>查看专业提示词</summary>${item.image_prompt ? `<label>FLUX 首帧<textarea readonly>${escapeHtml(item.image_prompt)}</textarea></label>` : ""}${item.video_prompt ? `<label>MiniMax-H3 视频<textarea readonly>${escapeHtml(item.video_prompt)}</textarea></label>` : ""}</details>` : ""}
      <div class="history-actions"><button data-history-action="edit" class="primary">编辑并重做</button><button data-history-action="copy">复制提示词</button>${outputs.length ? `<button data-history-action="view">查看结果</button>` : ""}<button data-history-action="delete" class="danger">删除记录</button></div>
    </article>`;
  }).join("");
  elements.historyList.querySelectorAll("[data-history-action]").forEach((button) => button.addEventListener("click", (event) => {
    event.preventDefault();
    const item = historyItems.find((entry) => entry.id === button.closest(".history-item").dataset.historyId);
    if (item) handleHistoryAction(item, button.dataset.historyAction);
  }));
}

async function loadHistory() {
  const query = elements.historySearch.value.trim();
  const mode = elements.historyMode.value;
  try {
    const response = await fetch(`/api/history?q=${encodeURIComponent(query)}&mode=${encodeURIComponent(mode)}`, { cache:"no-store" });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    historyItems = data.items || [];
    renderHistory();
  } catch (error) {
    elements.historyList.innerHTML = `<div class="empty-state">历史记录读取失败：${escapeHtml(error.message)}</div>`;
  }
}

async function restoreHistoryForEditing(item) {
  elements.messages.innerHTML = "";
  elements.messages.classList.remove("visible");
  elements.welcome.style.display = "flex";
  clearAttachment();
  clearH3References();
  turnaroundEnabled = Boolean(item.settings?.turnaround_sheet);
  setMode(item.mode || "flux_video");
  elements.quality.value = item.settings?.quality || "hd";
  elements.imageModel.value = item.settings?.image_model === "juggernaut_xl" ? "realvis_xl" : (item.settings?.image_model || "realvis_xl");
  syncTurnaroundUi();
  preserveFirstFrameState = item.settings?.preserve_first_frame_state !== false;
  elements.stateLockState.textContent = preserveFirstFrameState ? "开启" : "关闭";
  elements.stateLockButton.classList.toggle("active", preserveFirstFrameState);
  elements.duration.value = String(item.settings?.duration || 5);
  if (item.mode === "h3_reference") {
    const options = item.h3_reference_options || item.settings?.h3_reference_options || {};
    if (options.ref_image_size) elements.h3ReferenceQuality.value = options.ref_image_size;
    if (options.steps) elements.h3ReferenceSteps.value = String(options.steps);
    if (options.shift_video) elements.h3ShiftVideo.value = String(options.shift_video);
    if (options.shift_audio) elements.h3ShiftAudio.value = String(options.shift_audio);
    h3References = (item.h3_references || []).map((reference, index) => {
      const asset = reference.asset_id ? assetDockItems.find((entry) => entry.id === reference.asset_id) : null;
      const filename = reference.filename || "";
      return {
        id: crypto.randomUUID?.() || `${Date.now()}-${index}`, type: reference.type || h3MediaType({name:filename}),
        name: reference.name || (asset ? assetDisplayName(asset) : filename), role: reference.role || defaultH3Role(reference.type),
        usage: reference.usage || "all", description: reference.description || "", includeAudio: Boolean(reference.include_audio),
        file: null, preview: asset?.url || `/api/media?filename=${encodeURIComponent(filename)}&type=input`, ownsPreview: false,
        uploadedFilename: filename, assetId: reference.asset_id || null,
      };
    }).filter((reference) => reference.type && reference.uploadedFilename);
    renderH3References();
  }
  if (item.settings?.seed) {
    elements.seedMode.value = "fixed";
    elements.seedInput.value = String(item.settings.seed);
  } else {
    elements.seedMode.value = "random";
  }
  updateSeedControl();
  elements.prompt.value = item.prompt || item.video_prompt || item.image_prompt || "";
  if (item.professional) expandedPrompts = { brief: elements.prompt.value.trim(), image_prompt: item.image_prompt || elements.prompt.value, video_prompt: item.video_prompt || elements.prompt.value };
  if (item.mode === "image_video" && item.input_image) {
    try {
      const response = await fetch(`/api/media?filename=${encodeURIComponent(item.input_image)}&type=input`);
      if (response.ok) addAttachment(new File([await response.blob()], item.input_image, { type: response.headers.get("content-type") || "image/png" }));
    } catch {}
  }
  autoGrow();
  closeDrawers();
  elements.prompt.focus();
  showToast("提示词和生成参数已放回输入框，可以修改后重做");
}

function viewHistoryResult(item) {
  elements.messages.innerHTML = "";
  appendUserMessage(item.prompt || item.title, null);
  const wrapper = appendProgressMessage(item.mode, item.settings?.quality || "hd", item.settings?.duration || 5, item.professional);
  showResults(wrapper, item.outputs || [], item.prompt || item.title);
  closeDrawers();
}

async function handleHistoryAction(item, action) {
  if (action === "edit") return restoreHistoryForEditing(item);
  if (action === "copy") {
    await navigator.clipboard.writeText(item.prompt || item.video_prompt || item.image_prompt || "");
    return showToast("提示词已复制");
  }
  if (action === "view") return viewHistoryResult(item);
  if (action === "delete") {
    if (!confirm("只删除这条创作历史吗？\n生成的图片和视频文件不会删除。")) return;
    const response = await fetch(`/api/history/${encodeURIComponent(item.id)}`, { method:"DELETE" });
    if (!response.ok) return showToast(await response.text());
    await loadHistory();
    showToast("历史记录已删除，作品文件仍保留");
  }
}

const canvasNodeDefinitions = {
  prompt: { title: "提示词", color: "prompt" }, character: { title: "人物资产", color: "character" },
  scene: { title: "场景资产", color: "scene" }, checkpoint: { title: "SDXL Checkpoint", color: "model" },
  inpaint: { title: "SDXL Inpaint", color: "inpaint" }, controlnet: { title: "ControlNet", color: "control" },
  ipadapter: { title: "IP-Adapter", color: "adapter" }, image_output: { title: "图片输出", color: "image" },
  video_output: { title: "视频输出", color: "video" },
};

function canvasSelectOptions(items, selected, emptyText = "尚未检测到模型") {
  if (!items?.length) return `<option value="">${escapeHtml(emptyText)}</option>`;
  return items.map((item) => `<option value="${escapeHtml(item.name)}" ${item.name === selected ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("");
}

function canvasAssetOptions(category, selected) {
  const items = assetDockItems.filter((asset) => asset.category === category && asset.kind === "image");
  if (!items.length) return `<option value="">素材库暂无${category === "character" ? "人物" : "场景"}</option>`;
  return items.map((asset) => `<option value="${escapeHtml(asset.id)}" ${asset.id === selected ? "selected" : ""}>${escapeHtml(assetDisplayName(asset))}</option>`).join("");
}

function canvasNodeBody(node) {
  const data = node.data || {};
  if (node.type === "prompt") return `<textarea data-field="prompt" placeholder="描述主体、场景、动作、镜头和声音…">${escapeHtml(data.prompt || "")}</textarea><div class="node-note">提示词会与人物、场景描述自动合并</div>`;
  if (["character", "scene"].includes(node.type)) {
    const category = node.type === "character" ? "character" : "background";
    const asset = assetDockItems.find((item) => item.id === data.asset_id);
    return `<select data-field="asset_id">${canvasAssetOptions(category, data.asset_id)}</select>${asset ? `<div class="node-preview"><img src="${escapeHtml(asset.url)}"><span><b>${escapeHtml(assetDisplayName(asset))}</b><br>${escapeHtml((asset.tags || []).slice(0,3).join(" · "))}</span></div>` : `<div class="node-note">先在右侧资产列表选择并加入画布</div>`}`;
  }
  if (node.type === "checkpoint") return `<select data-field="model_name">${canvasSelectOptions(localModels.checkpoints, data.model_name, "请把 SDXL checkpoint 放入 models/checkpoints")}</select><div class="node-note">负责生成首帧或最终图片</div>`;
  if (node.type === "inpaint") return `<select data-field="model_name">${canvasSelectOptions(localModels.inpaint, data.model_name, "尚未检测到文件名含 inpaint 的 checkpoint")}</select><label class="node-note"><input data-field="enabled" type="checkbox" ${data.enabled !== false ? "checked" : ""}> 启用中央区域局部重绘</label>`;
  if (node.type === "controlnet") return `<select data-field="model_name">${canvasSelectOptions(localModels.controlnet, data.model_name, "请把模型放入 models/controlnet")}</select><label class="node-note">结构强度 <input data-field="strength" type="range" min="0" max="1.5" step="0.05" value="${Number(data.strength ?? .75)}"></label>`;
  if (node.type === "ipadapter") return `<select data-field="model_name">${canvasSelectOptions(localModels.ipadapter, data.model_name, "请把模型放入 models/ipadapter")}</select><div class="node-note">自动使用人物资产维持脸部与造型</div>`;
  if (node.type === "image_output") return `<select data-field="quality"><option value="standard" ${data.quality === "standard" ? "selected" : ""}>标准</option><option value="hd" ${data.quality !== "standard" && data.quality !== "ultra" ? "selected" : ""}>高清</option><option value="ultra" ${data.quality === "ultra" ? "selected" : ""}>超清 1536×1024</option></select><div class="node-note">输出到作品文件夹并显示在任务中心</div>`;
  if (node.type === "video_output") return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><select data-field="quality"><option value="standard">标准</option><option value="hd" ${data.quality !== "standard" ? "selected" : ""}>最高画质</option></select><select data-field="duration">${[3,5,8,10,15].map((value) => `<option value="${value}" ${Number(data.duration || 5) === value ? "selected" : ""}>${value} 秒</option>`).join("")}</select></div><div class="node-note">SDXL 首帧 → MiniMax-H3 视频</div>`;
  return "";
}

function markCanvasDirty() {
  canvasDirty = true;
  elements.canvasSaveState.textContent = "有修改 · 尚未保存";
}

function defaultCanvasNode(type, overrides = {}) {
  const index = activeCanvas?.nodes?.length || 0;
  const defaults = {
    checkpoint: { model_name: localModels.checkpoints[0]?.name || "" },
    inpaint: { model_name: localModels.inpaint[0]?.name || "", enabled: true },
    controlnet: { model_name: localModels.controlnet[0]?.name || "", strength: .75 },
    ipadapter: { model_name: localModels.ipadapter[0]?.name || "" },
    image_output: { quality: "ultra" }, video_output: { quality: "hd", duration: 5 },
  };
  return { id: crypto.randomUUID?.() || `${Date.now()}-${index}`, type, x: 70 + (index % 3) * 275, y: 70 + Math.floor(index / 3) * 180, data: { ...(defaults[type] || {}), ...overrides } };
}

function addCanvasNode(type, data = {}) {
  if (!activeCanvas) newLocalCanvas();
  activeCanvas.nodes.push(defaultCanvasNode(type, data));
  markCanvasDirty();
  renderCanvas();
}

function removeCanvasNode(nodeId) {
  activeCanvas.nodes = activeCanvas.nodes.filter((node) => node.id !== nodeId);
  activeCanvas.links = activeCanvas.links.filter((link) => link.from !== nodeId && link.to !== nodeId);
  if (canvasLinkStart === nodeId) canvasLinkStart = null;
  markCanvasDirty();
  renderCanvas();
}

function handleCanvasPort(nodeId, direction) {
  if (direction === "output") {
    canvasLinkStart = canvasLinkStart === nodeId ? null : nodeId;
    renderCanvas();
    return;
  }
  if (!canvasLinkStart || canvasLinkStart === nodeId) return;
  activeCanvas.links = activeCanvas.links.filter((link) => !(link.from === canvasLinkStart && link.to === nodeId));
  activeCanvas.links.push({ id: crypto.randomUUID?.() || `${Date.now()}`, from: canvasLinkStart, to: nodeId });
  canvasLinkStart = null;
  markCanvasDirty();
  renderCanvas();
}

function renderCanvasLinks() {
  if (!activeCanvas) return;
  const paths = activeCanvas.links.map((link) => {
    const from = activeCanvas.nodes.find((node) => node.id === link.from);
    const to = activeCanvas.nodes.find((node) => node.id === link.to);
    if (!from || !to) return "";
    const x1 = from.x + 230, y1 = from.y + 56, x2 = to.x, y2 = to.y + 56;
    const bend = Math.max(55, Math.abs(x2 - x1) * .45);
    return `<path class="canvas-link" d="M${x1},${y1} C${x1+bend},${y1} ${x2-bend},${y2} ${x2},${y2}"/>`;
  }).join("");
  elements.canvasLinks.innerHTML = paths;
}

function bindCanvasNode(node, element) {
  element.querySelector(".flow-node-head").addEventListener("mousedown", (event) => {
    if (event.target.closest("button")) return;
    const startX = event.clientX, startY = event.clientY, originX = node.x, originY = node.y;
    const move = (moveEvent) => {
      node.x = Math.max(0, originX + (moveEvent.clientX - startX) / canvasZoom);
      node.y = Math.max(0, originY + (moveEvent.clientY - startY) / canvasZoom);
      element.style.left = `${node.x}px`; element.style.top = `${node.y}px`;
      renderCanvasLinks(); markCanvasDirty();
    };
    const up = () => { document.removeEventListener("mousemove", move); document.removeEventListener("mouseup", up); };
    document.addEventListener("mousemove", move); document.addEventListener("mouseup", up);
  });
  element.querySelector(".remove-flow-node").addEventListener("click", () => removeCanvasNode(node.id));
  element.querySelector(".flow-port.input").addEventListener("click", () => handleCanvasPort(node.id, "input"));
  element.querySelector(".flow-port.output").addEventListener("click", () => handleCanvasPort(node.id, "output"));
  element.querySelectorAll("[data-field]").forEach((control) => control.addEventListener("change", () => {
    node.data[control.dataset.field] = control.type === "checkbox" ? control.checked : control.type === "range" ? Number(control.value) : control.value;
    markCanvasDirty(); renderCanvas();
  }));
  element.querySelectorAll("textarea[data-field]").forEach((control) => control.addEventListener("input", () => { node.data[control.dataset.field] = control.value; markCanvasDirty(); }));
}

function renderCanvas() {
  if (!activeCanvas) return;
  elements.canvasName.value = activeCanvas.name || "未命名画布";
  elements.canvasEmpty.classList.toggle("hidden", activeCanvas.nodes.length > 0);
  elements.canvasNodeLayer.style.transform = `scale(${canvasZoom})`;
  elements.canvasLinks.style.transform = `scale(${canvasZoom})`;
  elements.canvasNodeLayer.style.transformOrigin = elements.canvasLinks.style.transformOrigin = "0 0";
  elements.canvasZoomLabel.textContent = `${Math.round(canvasZoom * 100)}%`;
  elements.canvasNodeLayer.innerHTML = activeCanvas.nodes.map((node) => {
    const def = canvasNodeDefinitions[node.type] || { title: node.type, color: "model" };
    return `<article class="flow-node" data-node-id="${escapeHtml(node.id)}" style="left:${node.x}px;top:${node.y}px"><button class="flow-port input" title="输入"></button><div class="flow-node-head"><i class="node-dot ${def.color}"></i><b>${escapeHtml(def.title)}</b><button class="remove-flow-node" title="删除">×</button></div><div class="flow-node-body">${canvasNodeBody(node)}</div><button class="flow-port output ${canvasLinkStart === node.id ? "active" : ""}" title="输出"></button></article>`;
  }).join("");
  activeCanvas.nodes.forEach((node) => bindCanvasNode(node, elements.canvasNodeLayer.querySelector(`[data-node-id="${CSS.escape(node.id)}"]`)));
  renderCanvasLinks();
}

function newLocalCanvas() {
  activeCanvas = { id: null, name: "新建视频画布", nodes: [], links: [], viewport: { x: 0, y: 0, zoom: 1 } };
  canvasZoom = 1; canvasLinkStart = null; canvasDirty = false;
  elements.canvasSaveState.textContent = "本地保存 · 新画布";
  renderCanvas();
}

function createStarterCanvas() {
  newLocalCanvas();
  activeCanvas.nodes = [
    { ...defaultCanvasNode("prompt", { prompt: "写下人物、场景、动作、镜头和氛围" }), x: 25, y: 90 },
    { ...defaultCanvasNode("character"), x: 275, y: 25 },
    { ...defaultCanvasNode("scene"), x: 275, y: 190 },
    { ...defaultCanvasNode("checkpoint"), x: 525, y: 90 },
    { ...defaultCanvasNode("video_output", { quality: "hd", duration: 10 }), x: 775, y: 90 },
  ];
  activeCanvas.links = [
    { id: crypto.randomUUID(), from: activeCanvas.nodes[0].id, to: activeCanvas.nodes[3].id },
    { id: crypto.randomUUID(), from: activeCanvas.nodes[1].id, to: activeCanvas.nodes[3].id },
    { id: crypto.randomUUID(), from: activeCanvas.nodes[2].id, to: activeCanvas.nodes[3].id },
    { id: crypto.randomUUID(), from: activeCanvas.nodes[3].id, to: activeCanvas.nodes[4].id },
  ];
  markCanvasDirty(); fitCanvas();
}

function fitCanvas() {
  if (!activeCanvas?.nodes?.length) { canvasZoom = 1; return renderCanvas(); }
  const maxX = Math.max(...activeCanvas.nodes.map((node) => node.x + 245));
  const maxY = Math.max(...activeCanvas.nodes.map((node) => node.y + 150));
  const width = Math.max(400, elements.canvasStageWrap.clientWidth - 30);
  const height = Math.max(320, elements.canvasStageWrap.clientHeight - 30);
  canvasZoom = Math.max(.55, Math.min(1.1, width / maxX, height / maxY));
  renderCanvas();
}

async function saveActiveCanvas() {
  if (!activeCanvas) return;
  activeCanvas.name = elements.canvasName.value.trim() || "未命名画布";
  activeCanvas.viewport = { x: 0, y: 0, zoom: canvasZoom };
  const url = activeCanvas.id ? `/api/canvases/${activeCanvas.id}` : "/api/canvases";
  const response = await fetch(url, { method: activeCanvas.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(activeCanvas) });
  if (!response.ok) return showToast(await response.text());
  activeCanvas = await response.json(); canvasDirty = false;
  elements.canvasSaveState.textContent = `已保存 · ${new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"})}`;
  await loadSavedCanvases(); showToast("画布已保存到本机");
}

async function loadSavedCanvases() {
  const response = await fetch("/api/canvases", { cache: "no-store" });
  const data = response.ok ? await response.json() : { canvases: [] };
  elements.savedCanvasList.innerHTML = data.canvases.length ? data.canvases.map((canvas) => `<button class="saved-canvas-item" data-canvas-id="${escapeHtml(canvas.id)}"><b>${escapeHtml(canvas.name)}</b><small>${canvas.node_count} 个节点 · ${new Date(canvas.updated_at * 1000).toLocaleString()}</small></button>`).join("") : `<div class="empty-state">还没有保存的画布</div>`;
  elements.savedCanvasList.querySelectorAll("[data-canvas-id]").forEach((button) => button.addEventListener("click", async () => {
    const item = await fetch(`/api/canvases/${button.dataset.canvasId}`, { cache: "no-store" });
    if (!item.ok) return showToast(await item.text());
    activeCanvas = await item.json(); canvasZoom = Number(activeCanvas.viewport?.zoom || 1); canvasDirty = false;
    elements.canvasSaveState.textContent = "已从本机打开"; renderCanvas();
  }));
}

async function loadLocalModels() {
  const response = await fetch("/api/models", { cache: "no-store" });
  if (!response.ok) return;
  localModels = await response.json();
  elements.imageModel.querySelectorAll("option[data-dynamic]").forEach((option) => option.remove());
  localModels.checkpoints.filter((item) => item.name !== "RealVisXL_V5.0_fp16.safetensors").forEach((item) => {
    const option = document.createElement("option"); option.value = "sdxl_local"; option.dataset.dynamic = "1"; option.dataset.checkpoint = item.name; option.textContent = `${item.name} · 本地 SDXL`; elements.imageModel.appendChild(option);
  });
  const groups = [["SDXL Checkpoint","checkpoints"],["SDXL Inpaint","inpaint"],["ControlNet","controlnet"],["IP-Adapter","ipadapter"]];
  elements.canvasModelSummary.innerHTML = groups.map(([label,key]) => `<div class="model-scan-card"><div><b>${label}</b><span>${localModels[key]?.length || 0} 个</span></div><small>${localModels[key]?.length ? localModels[key].map((item) => escapeHtml(item.name)).join("<br>") : "对应目录中暂无模型文件"}</small></div>`).join("");
  renderCanvas();
}

function renderCanvasAssets() {
  const query = elements.canvasAssetSearch.value.trim().toLowerCase();
  const items = assetDockItems.filter((asset) => ["character","background"].includes(asset.category) && asset.kind === "image" && (!query || `${asset.name} ${(asset.tags || []).join(" ")}`.toLowerCase().includes(query)));
  elements.canvasAssetList.innerHTML = items.length ? items.map((asset) => `<button class="canvas-asset-item" data-asset-id="${escapeHtml(asset.id)}"><img src="${escapeHtml(asset.url)}"><span><b>${escapeHtml(assetDisplayName(asset))}</b><small>${asset.category === "character" ? "人物" : "场景"}</small></span><i>＋</i></button>`).join("") : `<div class="empty-state">素材库中还没有人物或场景</div>`;
  elements.canvasAssetList.querySelectorAll("[data-asset-id]").forEach((button) => button.addEventListener("click", () => {
    const asset = assetDockItems.find((item) => item.id === button.dataset.assetId);
    if (asset) addCanvasNode(asset.category === "character" ? "character" : "scene", { asset_id: asset.id });
  }));
}

async function openCanvasWorkspace() {
  if (!activeCanvas) newLocalCanvas();
  await Promise.all([loadLocalModels(), loadSavedCanvases(), loadAssetDock()]);
  renderCanvasAssets(); renderCanvas(); openDrawer(elements.canvasDrawer);
}

function renderSdxlStudioModels() {
  const groups = [["SDXL Checkpoint","checkpoints"],["SDXL Inpaint","inpaint"],["ControlNet","controlnet"],["IP-Adapter","ipadapter"]];
  $("#sdxlStudioModelList").innerHTML = groups.map(([label,key]) => `<div class="sdxl-model-row"><span><b>${label}</b><small>${(localModels[key] || []).slice(0,3).map((item) => escapeHtml(item.name)).join(" · ") || "尚未检测到"}</small></span><i>${localModels[key]?.length || 0} 个</i></div>`).join("");
}

async function openSdxlStudio() {
  await loadLocalModels();
  renderSdxlStudioModels();
  openDrawer($("#sdxlStudioDrawer"));
}

async function openSdxlPreset(preset) {
  await openCanvasWorkspace();
  const pony = localModels.checkpoints.find((item) => item.name.toLowerCase().includes("pony"))?.name || localModels.checkpoints[0]?.name || "";
  const inpaint = localModels.inpaint.find((item) => item.name === pony)?.name || localModels.inpaint[0]?.name || pony;
  const control = localModels.controlnet[0]?.name || "";
  const adapter = localModels.ipadapter.find((item) => item.name.toLowerCase().includes("plus-face") && !item.name.toLowerCase().includes("faceid"))?.name || localModels.ipadapter[0]?.name || "";
  const names = { txt2img:"SDXL 文字生成图片", inpaint:"SDXL 局部重绘", controlnet:"SDXL ControlNet 姿态控制", ipadapter:"SDXL IP-Adapter 参考图" };
  newLocalCanvas();
  activeCanvas.name = names[preset] || "本地 SDXL 工作流";
  const promptNode = { ...defaultCanvasNode("prompt", { prompt:"描述明确的成年人物、场景、服装、姿态、镜头、光线与画面风格" }), x:25, y:95 };
  const outputNode = { ...defaultCanvasNode("image_output", { quality:"ultra" }), x:825, y:95 };
  let middle = [];
  if (preset === "txt2img") middle = [{ ...defaultCanvasNode("checkpoint", { model_name:pony }), x:425, y:95 }];
  if (preset === "inpaint") middle = [{ ...defaultCanvasNode("character"), x:270, y:15 },{ ...defaultCanvasNode("inpaint", { model_name:inpaint, enabled:true }), x:525, y:95 }];
  if (preset === "controlnet") middle = [{ ...defaultCanvasNode("checkpoint", { model_name:pony }), x:300, y:95 },{ ...defaultCanvasNode("controlnet", { model_name:control, strength:.75 }), x:555, y:95 }];
  if (preset === "ipadapter") middle = [{ ...defaultCanvasNode("character"), x:260, y:15 },{ ...defaultCanvasNode("checkpoint", { model_name:pony }), x:300, y:190 },{ ...defaultCanvasNode("ipadapter", { model_name:adapter }), x:560, y:95 }];
  activeCanvas.nodes = [promptNode, ...middle, outputNode];
  const chain = preset === "ipadapter" ? [promptNode, middle[2], outputNode] : preset === "inpaint" ? [promptNode, middle[1], outputNode] : [promptNode, ...middle, outputNode];
  activeCanvas.links = chain.slice(0,-1).map((node,index) => ({ id:crypto.randomUUID(), from:node.id, to:chain[index+1].id }));
  if (preset === "inpaint") activeCanvas.links.push({ id:crypto.randomUUID(), from:middle[0].id, to:middle[1].id });
  if (preset === "ipadapter") {
    activeCanvas.links.push({ id:crypto.randomUUID(), from:middle[0].id, to:middle[2].id });
    activeCanvas.links.push({ id:crypto.randomUUID(), from:middle[1].id, to:middle[2].id });
  }
  elements.canvasName.value = activeCanvas.name;
  markCanvasDirty();
  fitCanvas();
  showToast(`${activeCanvas.name} 已搭建，可直接填写提示词并生成`);
}

async function runCanvas() {
  if (!activeCanvas) return;
  const prompt = activeCanvas.nodes.filter((node) => node.type === "prompt").map((node) => node.data.prompt).filter(Boolean).join("\n").trim();
  if (!prompt) return showToast("画布中至少需要一个填写好的提示词节点");
  const output = activeCanvas.nodes.find((node) => node.type === "video_output") || activeCanvas.nodes.find((node) => node.type === "image_output");
  if (!output) return showToast("请添加图片输出或视频输出节点");
  const assetNodes = activeCanvas.nodes.filter((node) => ["character","scene"].includes(node.type));
  const assets = assetNodes.map((node) => assetDockItems.find((asset) => asset.id === node.data.asset_id)).filter(Boolean);
  const character = assets.find((asset) => asset.category === "character");
  const scene = assets.find((asset) => asset.category === "background");
  const checkpoint = activeCanvas.nodes.find((node) => node.type === "checkpoint")?.data.model_name;
  const inpaintNode = activeCanvas.nodes.find((node) => node.type === "inpaint" && node.data.enabled !== false);
  const controlNode = activeCanvas.nodes.find((node) => node.type === "controlnet");
  const adapterNode = activeCanvas.nodes.find((node) => node.type === "ipadapter");
  let referenceImage = null;
  if (character) {
    const response = await fetch(`/api/library/${encodeURIComponent(character.id)}/prepare`, { method: "POST" });
    if (response.ok) referenceImage = (await response.json()).filename;
  }
  const assetText = assets.map((asset) => `@${assetDisplayName(asset)}：${asset.prompt || (asset.tags || []).join("、")}`).join("\n");
  const finalPrompt = [prompt, assetText].filter(Boolean).join("\n\n资产引用：\n");
  const mode = output.type === "video_output" ? "flux_video" : "text_image";
  const quality = output.data.quality || "hd", duration = Number(output.data.duration || 5);
  appendUserMessage(finalPrompt, character?.url || scene?.url || null);
  const wrapper = appendProgressMessage(mode, quality, duration, true);
  const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
    mode, quality, duration, prompt: finalPrompt, image_prompt: finalPrompt, video_prompt: finalPrompt,
    image_model: checkpoint ? "sdxl_local" : "realvis_xl", checkpoint_name: checkpoint || "RealVisXL_V5.0_fp16.safetensors",
    inpaint_checkpoint: inpaintNode?.data.model_name || null, force_inpaint: Boolean(inpaintNode),
    controlnet_name: controlNode?.data.model_name || null, control_image: controlNode ? referenceImage : null,
    control_strength: Number(controlNode?.data.strength ?? .75), ipadapter_name: adapterNode?.data.model_name || null,
    reference_image: referenceImage, reference_strength: Number(elements.assetConsistency.value) / 100,
    preserve_first_frame_state: true, prompt_mode: "canvas", asset_bindings: assets.map((asset) => ({ id: asset.id, category: asset.category, name: assetDisplayName(asset), prompt: asset.prompt || "", tags: asset.tags || [] })),
    asset_controls: { consistency: Number(elements.assetConsistency.value), lock_face: true, lock_outfit: true },
  }) });
  if (!response.ok) { showError(wrapper, await response.text()); return; }
  const job = await response.json();
  tasks.set(job.id, { job, wrapper, prompt: finalPrompt, quality, duration, professional: true });
  renderTaskCenter(); updateProgress(wrapper, job); closeDrawers();
  pollJob(job.id).catch((error) => showError(wrapper, error.message));
}

elements.mode.addEventListener("change", () => setMode(elements.mode.value));
elements.attach.addEventListener("click", () => elements.imageInput.click());
elements.imageInput.addEventListener("change", () => addAttachment(elements.imageInput.files[0]));
elements.removeAttachment.addEventListener("click", clearAttachment);
elements.referenceButton.addEventListener("click", () => elements.referenceInput.click());
elements.referenceInput.addEventListener("change", () => addReferenceAttachment(elements.referenceInput.files[0]));
elements.removeReference.addEventListener("click", clearReferenceAttachment);
elements.h3AddFiles?.addEventListener("click", () => elements.h3ReferenceInput.click());
elements.h3ReferenceInput?.addEventListener("change", () => {
  addH3ReferenceFiles(elements.h3ReferenceInput.files);
  elements.h3ReferenceInput.value = "";
});
elements.h3AddFromLibrary?.addEventListener("click", showAssetDock);
elements.referenceStrength.addEventListener("input", () => { elements.referenceStrengthValue.textContent = `${Math.round(Number(elements.referenceStrength.value) * 100)}%`; });
elements.assetConsistency.addEventListener("input", () => {
  elements.assetConsistencyValue.textContent = `${elements.assetConsistency.value}%`;
  elements.referenceStrength.value = (Number(elements.assetConsistency.value) / 100).toFixed(2);
  elements.referenceStrengthValue.textContent = `${elements.assetConsistency.value}%`;
  saveAssetSelection();
});
elements.lockFace.addEventListener("change", saveAssetSelection);
elements.lockOutfit.addEventListener("change", saveAssetSelection);
elements.generate.addEventListener("click", generate);
elements.prompt.addEventListener("input", () => { autoGrow(); if (expandedPrompts?.brief !== elements.prompt.value.trim()) expandedPrompts = null; });
elements.prompt.addEventListener("keydown", (event) => { if (event.key === "Enter" && !event.shiftKey && !event.isComposing && event.keyCode !== 229) { event.preventDefault(); generate(); } });
elements.dropZone.addEventListener("dragover", (event) => { event.preventDefault(); elements.dropZone.classList.add("dragging"); });
elements.dropZone.addEventListener("dragleave", () => elements.dropZone.classList.remove("dragging"));
elements.dropZone.addEventListener("drop", (event) => { event.preventDefault(); elements.dropZone.classList.remove("dragging"); addAttachment(event.dataTransfer.files[0]); });

$$(".quick-mode").forEach((button) => button.addEventListener("click", () => {
  if (button.dataset.mode === "txt_project") { openTxtProjectModal(); elements.sidebar.classList.remove("open"); return; }
  if (!button.dataset.mode) { elements.sidebar.classList.remove("open"); return; }
  setMode(button.dataset.mode); elements.prompt.focus(); elements.sidebar.classList.remove("open");
}));
$$(".creation-mode-tab").forEach((button) => button.addEventListener("click", () => { setMode(button.dataset.mode); elements.prompt.focus(); }));
$$(".suggestion").forEach((button) => button.addEventListener("click", () => { setMode(button.dataset.mode); elements.prompt.value = button.dataset.prompt; autoGrow(); elements.prompt.focus(); }));

elements.directorButton.addEventListener("click", (event) => {
  if (event.target === elements.directorState) {
    autoDirector = !autoDirector;
    elements.directorState.textContent = autoDirector ? "自动" : "原样";
    elements.directorButton.classList.toggle("active", autoDirector);
    elements.directorButton.title = autoDirector ? "自动补全专业首帧、分镜、背景和声音" : "原样发送：不改写你的提示词，模型自身行为仍无法关闭";
    event.stopPropagation();
    showToast(autoDirector ? "已开启提示词导演自动扩写" : "已切换为原样发送，不再自动追加描述");
    return;
  }
  elements.directorBrief.value = elements.prompt.value.trim();
  elements.directorResults.classList.add("hidden");
  openModal(elements.directorModal);
});

elements.stateLockButton.addEventListener("click", () => {
  preserveFirstFrameState = !preserveFirstFrameState;
  elements.stateLockState.textContent = preserveFirstFrameState ? "开启" : "关闭";
  elements.stateLockButton.classList.toggle("active", preserveFirstFrameState);
  showToast(preserveFirstFrameState ? "已开启首帧状态锁定，建议使用 3–5 秒轻微动作" : "已关闭首帧状态锁定");
});

elements.turnaroundButton.addEventListener("click", () => setTurnaround(!turnaroundEnabled));
elements.seedMode.addEventListener("change", updateSeedControl);
elements.seedInput.addEventListener("change", updateSeedControl);
elements.randomizeSeed.addEventListener("click", () => {
  elements.seedInput.value = String(generateSeed());
  elements.seedMode.value = "fixed";
  updateSeedControl();
  showToast(`已固定新种子：${elements.seedInput.value}`);
});

elements.expandPrompt.addEventListener("click", async () => {
  const brief = elements.directorBrief.value.trim();
  if (!brief) return showToast("先写下你的故事或画面想法");
  elements.expandPrompt.disabled = true;
  elements.expandPrompt.textContent = "正在编写分镜…";
  try {
    const result = await requestExpandedPrompts(brief, elements.mode.value);
    elements.imagePromptResult.value = result.image_prompt;
    elements.videoPromptResult.value = result.video_prompt;
    elements.promptDiagnostics.innerHTML = result.warnings?.length ? `<b>提示词检查</b><br>${result.warnings.map((warning) => `• ${escapeHtml(warning)}`).join("<br>")}` : `<b>提示词检查通过</b><br>主体、背景、动作和连续性约束已准备。`;
    elements.directorResults.classList.remove("hidden");
  } catch (error) { showToast(error.message); }
  finally { elements.expandPrompt.disabled = false; elements.expandPrompt.innerHTML = "<span>✦</span>生成专业提示词"; }
});

elements.applyPrompts.addEventListener("click", () => {
  const brief = elements.directorBrief.value.trim();
  expandedPrompts = { brief, image_prompt: elements.imagePromptResult.value.trim(), video_prompt: elements.videoPromptResult.value.trim() };
  elements.prompt.value = brief;
  autoGrow();
  closeModal(elements.directorModal);
  showToast("专业首帧和分镜提示词已应用");
});

$("#canvasButton").addEventListener("click", openCanvasWorkspace);
$("#sdxlStudioButton").addEventListener("click", openSdxlStudio);
$("#sdxlRescanButton").addEventListener("click", async () => { await loadLocalModels(); renderSdxlStudioModels(); showToast("本地模型列表已更新"); });
$$('[data-sdxl-preset]').forEach((button) => button.addEventListener("click", () => openSdxlPreset(button.dataset.sdxlPreset)));
function closeCanvasMobilePanels() {
  elements.canvasPalette?.classList.remove("mobile-open");
  elements.canvasSidepanel?.classList.remove("mobile-open");
}
function toggleCanvasMobilePanel(panel) {
  const target = panel === "nodes" ? elements.canvasPalette : elements.canvasSidepanel;
  const other = panel === "nodes" ? elements.canvasSidepanel : elements.canvasPalette;
  other?.classList.remove("mobile-open");
  target?.classList.toggle("mobile-open");
}
$("#canvasMobileNodes").addEventListener("click", () => toggleCanvasMobilePanel("nodes"));
$("#canvasMobileModels").addEventListener("click", () => toggleCanvasMobilePanel("models"));
$$('[data-canvas-mobile-close]').forEach((button) => button.addEventListener("click", closeCanvasMobilePanels));
$$('[data-canvas-node]').forEach((button) => button.addEventListener("click", () => addCanvasNode(button.dataset.canvasNode)));
$("#canvasStarterButton").addEventListener("click", createStarterCanvas);
$("#newCanvasButton").addEventListener("click", () => { if (!canvasDirty || confirm("新建画布会放下当前未保存的修改，继续吗？")) newLocalCanvas(); });
$("#saveCanvasButton").addEventListener("click", saveActiveCanvas);
$("#runCanvasButton").addEventListener("click", runCanvas);
$("#deleteCanvasButton").addEventListener("click", async () => {
  if (!activeCanvas?.id) return newLocalCanvas();
  if (!confirm(`删除画布“${activeCanvas.name}”吗？生成过的作品不会删除。`)) return;
  const response = await fetch(`/api/canvases/${activeCanvas.id}`, { method:"DELETE" });
  if (!response.ok) return showToast(await response.text());
  newLocalCanvas(); await loadSavedCanvases(); showToast("画布已删除，作品仍保留");
});
elements.canvasName.addEventListener("input", () => { if (activeCanvas) { activeCanvas.name = elements.canvasName.value; markCanvasDirty(); } });
$("#canvasZoomOut").addEventListener("click", () => { canvasZoom = Math.max(.55, canvasZoom - .1); renderCanvas(); });
$("#canvasZoomIn").addEventListener("click", () => { canvasZoom = Math.min(1.5, canvasZoom + .1); renderCanvas(); });
$("#canvasFit").addEventListener("click", fitCanvas);
elements.canvasAssetSearch.addEventListener("input", renderCanvasAssets);
$("#canvasRescanModels").addEventListener("click", async () => { await loadLocalModels(); showToast("已重新扫描本地模型目录"); });
$$('[data-canvas-tab]').forEach((button) => button.addEventListener("click", () => {
  $$('[data-canvas-tab]').forEach((item) => item.classList.toggle("active", item === button));
  $("#canvasAssetsPanel").classList.toggle("hidden", button.dataset.canvasTab !== "assets");
  $("#canvasModelsPanel").classList.toggle("hidden", button.dataset.canvasTab !== "models");
  $("#canvasSavedPanel").classList.toggle("hidden", button.dataset.canvasTab !== "saved");
}));

$("#taskButton").addEventListener("click", () => openDrawer(elements.taskDrawer));
$("#headerTaskButton").addEventListener("click", () => openDrawer(elements.taskDrawer));
$("#historyButton").addEventListener("click", () => { openDrawer(elements.historyDrawer); loadHistory(); });
$("#headerHistoryButton").addEventListener("click", () => { openDrawer(elements.historyDrawer); loadHistory(); });
let historySearchTimer;
elements.historySearch.addEventListener("input", () => { clearTimeout(historySearchTimer); historySearchTimer = setTimeout(loadHistory, 250); });
elements.historyMode.addEventListener("change", loadHistory);
$("#recoverHistoryButton").addEventListener("click", async () => {
  const button = $("#recoverHistoryButton");
  button.disabled = true; button.textContent = "正在查找…";
  try {
    const response = await fetch("/api/history/recover", { method:"POST" });
    if (!response.ok) throw new Error(await response.text());
    const data = await response.json();
    await loadHistory();
    showToast(data.recovered ? `又找回 ${data.recovered} 条旧记录` : "没有发现新的旧记录");
  } catch (error) { showToast(error.message); }
  finally { button.disabled = false; button.textContent = "找回旧记录"; }
});
$("#libraryButton").addEventListener("click", () => { openDrawer(elements.libraryDrawer); loadLibrary(); });
$("#headerLibraryButton").addEventListener("click", () => { openDrawer(elements.libraryDrawer); loadLibrary(); });
elements.assetDockTabs.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => { assetDockCategory = button.dataset.category; renderAssetDock(); }));
elements.assetDockSearch.addEventListener("input", () => { clearTimeout(assetSearchTimer); assetSearchTimer = setTimeout(renderAssetDock, 180); });
$("#assetDockUpload").addEventListener("click", () => { resetUploadForm(); elements.uploadCategory.value = assetDockCategory; openModal(elements.uploadAssetModal); });
$("#assetDockCollapse").addEventListener("click", () => document.body.classList.add("asset-dock-hidden"));
$("#openFullLibrary").addEventListener("click", () => { openDrawer(elements.libraryDrawer); loadLibrary(assetDockCategory); });
$("#removeInspectorAsset").addEventListener("click", () => removeSelectedAsset("character"));
elements.clearSelectedAssets.addEventListener("click", () => {
  [...selectedAssets.keys()].forEach((category) => removeSelectedAsset(category));
  showToast("已清空当前创作的资产引用");
});
$("#addAssetCard")?.addEventListener("click", showAssetDock);
$("#uploadLibraryButton").addEventListener("click", () => { resetUploadForm(); openModal(elements.uploadAssetModal); });
elements.assetDropZone.addEventListener("click", () => elements.assetFileInput.click());
elements.assetFileInput.addEventListener("change", () => selectUploadFile(elements.assetFileInput.files[0]));
elements.assetDropZone.addEventListener("dragover", (event) => { event.preventDefault(); elements.assetDropZone.classList.add("dragging"); });
elements.assetDropZone.addEventListener("dragleave", () => elements.assetDropZone.classList.remove("dragging"));
elements.assetDropZone.addEventListener("drop", (event) => { event.preventDefault(); elements.assetDropZone.classList.remove("dragging"); selectUploadFile(event.dataTransfer.files[0]); });
$("#removeUploadFile").addEventListener("click", resetUploadForm);
elements.confirmAssetUpload.addEventListener("click", uploadAssetFile);
$("#projectButton").addEventListener("click", () => { openDrawer(elements.projectDrawer); loadProjects(); });
$("#headerProjectButton").addEventListener("click", () => { openDrawer(elements.projectDrawer); loadProjects(); });
$("#createProjectButton").addEventListener("click", createProject);
$("#backProjectsButton").addEventListener("click", loadProjects);
$("#addShotButton").addEventListener("click", addProjectShot);
$("#exportProjectButton").addEventListener("click", exportProject);
elements.startTxtBatch.addEventListener("click", startTxtBatch);
elements.txtDropZone.addEventListener("click", () => elements.txtFileInput.click());
elements.txtFileInput.addEventListener("change", () => selectTxtFile(elements.txtFileInput.files[0]));
elements.txtDropZone.addEventListener("dragover", (event) => { event.preventDefault(); elements.txtDropZone.classList.add("dragging"); });
elements.txtDropZone.addEventListener("dragleave", () => elements.txtDropZone.classList.remove("dragging"));
elements.txtDropZone.addEventListener("drop", (event) => { event.preventDefault(); elements.txtDropZone.classList.remove("dragging"); selectTxtFile(event.dataTransfer.files[0]); });
elements.createTxtProject.addEventListener("click", createTxtProject);
$("#openProjectFolder").addEventListener("click", () => fetch("/api/open-folder", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({relative_path:"项目"}) }));
$("#openDataFolderButton").addEventListener("click", () => fetch("/api/open-folder", { method:"POST", headers:{"Content-Type":"application/json"}, body:"{}" }));
$("#libraryOpenFolder").addEventListener("click", () => fetch("/api/open-folder", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({relative_path:"素材库"}) }));
let librarySearchTimer;
elements.librarySearch.addEventListener("input", () => { clearTimeout(librarySearchTimer); librarySearchTimer = setTimeout(() => loadLibrary(), 250); });
elements.drawerScrim.addEventListener("click", closeDrawers);
$$(".drawer-close").forEach((button) => button.addEventListener("click", () => {
  const target = document.getElementById(button.dataset.close);
  target?.classList.contains("drawer") ? closeDrawers() : closeModal(target);
}));
elements.libraryTabs.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => loadLibrary(button.dataset.category)));
$$(".save-categories button").forEach((button) => button.addEventListener("click", () => savePendingAsset(button.dataset.category)));
elements.contextMenu.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => {
  const action = button.dataset.action;
  elements.contextMenu.classList.remove("open");
  if (!contextTarget) return;
  if (action === "open-folder") {
    if (contextTarget.asset) fetch("/api/open-folder", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({asset_id:contextTarget.asset.id}) });
    else openOutputFolder(contextTarget.output);
  } else if (action === "save-library" && contextTarget.output) openSaveAsset(contextTarget.output, contextTarget.prompt);
  else if (action === "redo-video" && contextTarget.output?.kind === "image") { useOutputAsVideoInput(contextTarget.output); }
}));
document.addEventListener("click", (event) => { if (!elements.contextMenu.contains(event.target)) elements.contextMenu.classList.remove("open"); });

function startNewTask() {
  elements.messages.innerHTML = "";
  elements.messages.classList.remove("visible");
  elements.welcome.style.display = "flex";
  elements.prompt.value = "";
  clearAttachment();
  clearReferenceAttachment();
  clearH3References();
  const character = selectedAssets.get("character");
  if (character) setReferenceFromAsset(character);
  setMode("flux_video");
  elements.sidebar.classList.remove("open");
  closeDrawers();
  elements.prompt.focus();
  showToast("已新建创作，后台任务仍会继续运行");
}

$("#newChatButton").addEventListener("click", startNewTask);
$("#newTaskButton").addEventListener("click", startNewTask);
$("#clearFinishedTasks").addEventListener("click", async () => {
  const finished = [...tasks.values()].filter((record) => ["complete", "error", "cancelled"].includes(record.job.status));
  if (!finished.length) return showToast("没有可以清理的已完成任务");
  if (!confirm(`从任务列表清理 ${finished.length} 个已结束任务吗？\n生成的作品文件会保留。`)) return;
  const response = await fetch("/api/jobs/clear-finished", { method: "POST" });
  if (!response.ok) return showToast(await response.text());
  finished.forEach((record) => { record.wrapper?.remove(); tasks.delete(record.job.id); });
  renderTaskCenter();
  showToast("已清理任务列表，作品文件仍然保留");
});

elements.theme.addEventListener("click", () => {
  const dark = document.documentElement.dataset.theme === "dark";
  document.documentElement.dataset.theme = dark ? "light" : "dark";
  localStorage.setItem("agent-studio-theme", dark ? "light" : "dark");
});
elements.menu.addEventListener("click", () => elements.sidebar.classList.toggle("open"));

document.documentElement.dataset.theme = localStorage.getItem("agent-studio-theme") || "light";
elements.seedMode.value = localStorage.getItem("agent-studio-seed-mode") || "random";
elements.seedInput.value = localStorage.getItem("agent-studio-seed-value") || String(generateSeed());
turnaroundEnabled = localStorage.getItem("agent-studio-turnaround") === "1";
updateSeedControl();
setMode("flux_video");
renderH3References();
loadAssetDock();
loadLocalModels();
checkHealth();
loadExistingTasks();
// History is loaded on demand from the existing history buttons.
setInterval(checkHealth, 5000);
