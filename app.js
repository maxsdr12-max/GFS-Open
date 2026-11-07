const STORAGE_PREFIX = "gfs-studio:";
const TEMPLATE_STORAGE_KEY = `${STORAGE_PREFIX}template`;
const TRANSITION_STORAGE_PREFIX = `${STORAGE_PREFIX}transition:`;
const DYNAMIC_SLIDES_KEY = `${STORAGE_PREFIX}slides`;

const stage = document.querySelector("#stage");
const slides = Array.from(document.querySelectorAll("[data-slide]"));
const previousButton = document.querySelector("#previous-button");
const nextButton = document.querySelector("#next-button");
const pageCount = document.querySelector("#page-count");
const dotsContainer = document.querySelector("#slide-dots");
const editButton = document.querySelector("#edit-button");
const editLabel = document.querySelector("#edit-label");
const resetButton = document.querySelector("#reset-button");
const fullscreenButton = document.querySelector("#fullscreen-button");
const templateSelect = document.querySelector("#template-select");
const transitionSelect = document.querySelector("#transition-select");
const transitionLabel = document.querySelector("#transition-label");
const statusMessage = document.querySelector("#status-message");
const editableElements = Array.from(document.querySelectorAll("[data-editable]"));
const modelViewer = document.querySelector("#model-viewer");
const modelFileInput = document.querySelector("#model-file-input");
const modelUploadButton = document.querySelector("#model-upload-button");
const modelEmptyButton = document.querySelector("#model-empty-button");
const modelEmptyState = document.querySelector("#model-empty-state");
const modelDropZone = document.querySelector("#model-drop-zone");
const modelStatus = document.querySelector("#model-status");
const modelFileName = document.querySelector("#model-file-name");
const removeModelButton = document.querySelector("#remove-model-button");
const rotateButton = document.querySelector("#rotate-button");
const rotateState = document.querySelector("#rotate-state");
const resetCameraButton = document.querySelector("#reset-camera-button");
const exposureControl = document.querySelector("#exposure-control");
const exposureValue = document.querySelector("#exposure-value");
const shadowControl = document.querySelector("#shadow-control");
const shadowValue = document.querySelector("#shadow-value");
const modelControls = [rotateButton, resetCameraButton, exposureControl, shadowControl];
const MAX_MODEL_SIZE = 150 * 1024 * 1024;
const MAX_IMAGE_SIZE = 20 * 1024 * 1024;
const MAX_VIDEO_COUNT = 5;
const MAX_PROJECT_SIZE = 4 * 1024 * 1024;
const TEMPLATE_IDS = ["editorial", "ocean", "botanical", "terracotta", "cobalt", "lavender"];
const NIM_MODEL_DEFAULT = "nvidia/nemotron-3-ultra-550b-a55b";
const NIM_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";
const NIM_SETTINGS_KEY = `${STORAGE_PREFIX}nim:settings`;
const NIM_API_KEY_KEY = `${STORAGE_PREFIX}nim:api-key`;

let activeIndex = -1;
let editing = false;
let selectedElementId = null;
let modelObjectUrl = null;
let pendingModelUrl = null;
let modelLoadId = 0;

const elementPanel = document.querySelector("#element-panel");
const workspace = document.querySelector("#workspace");
const elementsToggle = document.querySelector("#elements-toggle");
const panelClose = document.querySelector("#panel-close");
const panelSlideNumber = document.querySelector("#panel-slide-number");
const elementList = document.querySelector("#element-list");
const elementProperties = document.querySelector("#element-properties");
const elementColor = document.querySelector("#element-color");
const elementShapeType = document.querySelector("#element-shape-type");
const shapeTypeRow = document.querySelector("#shape-type-row");
const elementFontSize = document.querySelector("#element-font-size");
const fontSizeRow = document.querySelector("#font-size-row");
const elementFontFamily = document.querySelector("#element-font-family");
const fontFamilyRow = document.querySelector("#font-family-row");
const elementTextAlign = document.querySelector("#element-text-align");
const textAlignRow = document.querySelector("#text-align-row");
const elementBoldButton = document.querySelector("#element-bold-button");
const boldRow = document.querySelector("#bold-row");
const elementWidth = document.querySelector("#element-width");
const deleteElementButton = document.querySelector("#delete-element-button");
const addTextButton = document.querySelector("#add-text-button");
const addShapeButton = document.querySelector("#add-shape-button");
const addImageButton = document.querySelector("#add-image-button");
const addVideoButton = document.querySelector("#add-video-button");
const imageFileInput = document.querySelector("#image-file-input");
const saveIndicator = document.querySelector("#save-indicator");
const exportProjectButton = document.querySelector("#export-project-button");
const importProjectButton = document.querySelector("#import-project-button");
const projectFileInput = document.querySelector("#project-file-input");
const exportFormatButtons = Array.from(document.querySelectorAll("[data-export-format]"));
const fileMenu = document.querySelector("#file-menu");
const exportSaveIndicator = document.querySelector("#export-save-indicator");
const presentButton = document.querySelector("#present-button");
const assistantPanel = document.querySelector("#assistant-panel");
const assistantToggle = document.querySelector("#assistant-toggle");
const assistantTabs = Array.from(document.querySelectorAll(".assistant-tab"));
const assistantViews = Array.from(document.querySelectorAll(".assistant-view"));
const chatForm = document.querySelector("#chat-form");
const chatInput = document.querySelector("#chat-input");
const chatSend = document.querySelector("#chat-send");
const chatMessages = document.querySelector("#chat-messages");
const chatClearButton = document.querySelector("#chat-clear-button");
const chatContext = document.querySelector("#chat-context");
const assistantToolsEnabled = document.querySelector("#assistant-tools-enabled");
const chatQuickPrompts = Array.from(document.querySelectorAll("[data-chat-prompt]"));
const aiCapabilityNote = document.querySelector("#ai-capability-note");
const checkSlideButton = document.querySelector("#check-slide-button");
const checkResults = document.querySelector("#check-results");
const layoutGallery = document.querySelector("#layout-gallery");
const deleteSlideButton = document.querySelector("#delete-slide-button");
const nimSettingsDialog = document.querySelector("#nim-settings-dialog");
const nimSettingsForm = document.querySelector("#nim-settings-form");
const nimSettingsToggle = document.querySelector("#nim-settings-toggle");
const nimInlineSettings = document.querySelector("#nim-inline-settings");
const nimSettingsClose = document.querySelector("#nim-settings-close");
const nimApiKeyInput = document.querySelector("#nim-api-key");
const nimModelInput = document.querySelector("#nim-model");
const nimTemperatureInput = document.querySelector("#nim-temperature");
const nimTemperatureValue = document.querySelector("#nim-temperature-value");
const nimRememberKeyInput = document.querySelector("#nim-remember-key");
const nimClearKeyButton = document.querySelector("#nim-clear-key");
const nimSettingsStatus = document.querySelector("#nim-settings-status");
let aiBusy = false;
let nimSettings = loadNimSettings();
let chatConversation = [];

const NIM_TOOLS = [
  {
    type: "function",
    function: {
      name: "get_presentation_outline",
      description: "Liefert eine kurze Übersicht aller Folien und ihrer Texte.",
      parameters: { type: "object", properties: {}, additionalProperties: false },
    },
  },
  {
    type: "function",
    function: {
      name: "add_slide",
      description: "Fügt eine einzelne Folie mit dem angegebenen Layout hinzu und wechselt zu ihr.",
      parameters: {
        type: "object",
        properties: { layout_id: { type: "string", enum: ["cover", "section", "columns", "quote", "image", "video", "conclusion"] } },
        required: ["layout_id"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "add_text_to_slide",
      description: "Fügt einen verschiebbaren Text auf der aktuellen Folie hinzu.",
      parameters: {
        type: "object",
        properties: {
          text: { type: "string", description: "Text mit höchstens 500 Zeichen" },
          color: { type: "string", description: "Hex-Farbe, zum Beispiel #171717" },
        },
        required: ["text"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_presentation_design",
      description: "Ändert das Farbschema der gesamten Präsentation.",
      parameters: {
        type: "object",
        properties: { design: { type: "string", enum: TEMPLATE_IDS } },
        required: ["design"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "set_current_slide_transition",
      description: "Stellt den Übergang für die aktuelle Folie ein.",
      parameters: {
        type: "object",
        properties: { transition: { type: "string", enum: ["cut", "wipe", "zoom", "flip", "drop", "glitch", "spin"] } },
        required: ["transition"],
        additionalProperties: false,
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_wikipedia",
      description: "Sucht öffentlich zugängliche Wikipedia-Artikel zu einem Thema und liefert Auszüge mit Links. Nutze dies für externe Hintergrundinformationen, nicht als abschließenden Faktenbeleg.",
      parameters: {
        type: "object",
        properties: { query: { type: "string", description: "Kurze Suchanfrage" } },
        required: ["query"],
        additionalProperties: false,
      },
    },
  },
];

const SLIDE_LAYOUTS = [
  { id: "cover", name: "Titelfolie", description: "Großer Titel und Unterzeile", title: "Dein Thema", subtitle: "Untertitel oder Leitfrage" },
  { id: "section", name: "Kapiteltrenner", description: "Neuer Abschnitt mit klarer Nummer", title: "Neues Kapitel", subtitle: "Worum geht es in diesem Abschnitt?" },
  { id: "columns", name: "Zwei Spalten", description: "Zwei Aspekte gegenüberstellen", title: "Zwei Seiten der Frage", first: "Aspekt eins", second: "Aspekt zwei" },
  { id: "quote", name: "Zitat", description: "Aussage und Quelle groß zeigen", title: "„Ein starkes Zitat bleibt im Kopf.“", subtitle: "Name · Quelle · Jahr" },
  { id: "image", name: "Bild & Text", description: "Bildfläche und verschiebbarer Titel", title: "Was zeigt dieses Bild?", subtitle: "Bild über das Elemente-Menü hinzufügen" },
  { id: "video", name: "Video", description: "YouTube- oder Vimeo-Video einbetten", title: "Ein Beispiel in Bewegung", subtitle: "Video über das Elemente-Menü hinzufügen" },
  { id: "conclusion", name: "Fazit", description: "Kernaussage und Merksatz", title: "Das Wichtigste?", subtitle: "Deine Antwort in einem klaren Satz." },
];
const STATIC_SLIDE_COUNT = slides.length;

function getSlideElements(index) {
  try {
    const stored = localStorage.getItem(`${STORAGE_PREFIX}elements:${index}`);
    const elements = stored ? JSON.parse(stored) : [];
    return Array.isArray(elements) ? elements.filter(isValidElement) : [];
  } catch (error) {
    console.error(`Elemente für Folie ${index + 1} konnten nicht geladen werden.`, error);
    return [];
  }
}

function isValidElement(element) {
  if (!element || typeof element !== "object") return false;
  if (typeof element.id !== "string" || element.id.length > 100 || !["text", "shape", "image", "video"].includes(element.type)) return false;
  if (![element.x, element.y, element.width].every(Number.isFinite)) return false;
  if (element.x < 0 || element.x > 100 || element.y < 0 || element.y > 100 || element.width < 5 || element.width > 95) return false;
  if (element.color && !/^#[0-9a-f]{6}$/i.test(element.color)) return false;
  if (element.size !== undefined && (!Number.isFinite(element.size) || element.size < 1.4 || element.size > 7)) return false;
  if (element.type === "text") {
    return typeof element.text === "string" &&
      element.text.length <= 4000 &&
      (element.family === undefined || ["Arial, Helvetica, sans-serif", "Georgia, serif", "monospace"].includes(element.family)) &&
      (element.align === undefined || ["left", "center", "right"].includes(element.align)) &&
      (element.bold === undefined || typeof element.bold === "boolean");
  }
  if (element.type === "shape") {
    return ["rectangle", "circle", "line"].includes(element.shape) &&
      (element.height === undefined || (Number.isFinite(element.height) && element.height >= 5 && element.height <= 90));
  }
  if (element.type === "video") {
    return typeof element.src === "string" &&
      /^https:\/\/(?:www\.youtube-nocookie\.com\/embed\/[\w-]+|player\.vimeo\.com\/video\/\d+)(?:\?[a-zA-Z0-9=&_-]*)?$/.test(element.src);
  }
  return typeof element.src === "string" &&
    /^data:image\/(?:png|jpeg|webp);base64,/.test(element.src) &&
    element.src.length <= 1_500_000 &&
    (element.alt === undefined || (typeof element.alt === "string" && element.alt.length <= 120));
}

function saveSlideElements(index, elements = getSlideElements(index)) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}elements:${index}`, JSON.stringify(elements));
    saveIndicator.textContent = "Automatisch gespeichert";
    saveIndicator.dataset.state = "saved";
    return true;
  } catch (error) {
    console.error(`Elemente für Folie ${index + 1} konnten nicht gespeichert werden.`, error);
    saveIndicator.textContent = "Speichern fehlgeschlagen · Projekt exportieren";
    saveIndicator.dataset.state = "error";
    showStatus("Speichern fehlgeschlagen. Exportiere dein Projekt als Sicherung.");
    return false;
  }
}

function getCustomLayer(slide) {
  let layer = slide.querySelector(".custom-layer");
  if (!layer) {
    layer = document.createElement("div");
    layer.className = "custom-layer";
    layer.setAttribute("aria-label", "Eigene Folienelemente");
    slide.append(layer);
  }
  return layer;
}

function renderSlideElements(index) {
  const slide = slides[index];
  if (!slide) return;
  const layer = getCustomLayer(slide);
  layer.replaceChildren();
  getSlideElements(index).forEach((item) => {
    const node = document.createElement(item.type === "image" ? "img" : item.type === "video" ? "iframe" : "div");
    node.className = `custom-element custom-element-${item.type}${item.id === selectedElementId && index === activeIndex ? " is-selected" : ""}`;
    node.dataset.elementId = item.id;
    node.style.left = `${item.x}%`;
    node.style.top = `${item.y}%`;
    node.style.width = `${item.width}%`;
    node.style.setProperty("--element-size", item.size || 3);
    node.style.setProperty("--element-color", item.color || "#ef3828");
    node.style.setProperty("--element-family", item.family || "Arial, Helvetica, sans-serif");
    node.style.setProperty("--element-align", item.align || "left");
    node.style.fontWeight = item.bold ? "800" : "400";

    if (item.type === "text") {
      node.textContent = item.text;
      node.setAttribute("role", "textbox");
      node.setAttribute("aria-label", "Eigenes Textelement; doppelklicken zum Bearbeiten");
      node.setAttribute("aria-multiline", "true");
      node.spellcheck = true;
      node.addEventListener("dblclick", () => {
        node.contentEditable = "true";
        node.focus();
      });
      node.addEventListener("input", () => {
        item.text = node.textContent.slice(0, 4000);
        saveSlideElements(index, getSlideElements(index).map((stored) => stored.id === item.id ? item : stored));
        renderElementList();
      });
      node.addEventListener("blur", () => {
        node.contentEditable = "false";
        item.text = node.textContent.slice(0, 4000);
        saveSlideElements(index, getSlideElements(index).map((stored) => stored.id === item.id ? item : stored));
      });
    } else if (item.type === "shape") {
      node.classList.add(`custom-element-${item.shape}`);
      node.style.height = `${item.height || 18}%`;
    } else if (item.type === "image") {
      node.src = item.src;
      node.alt = item.alt || "Eingefügtes Bild";
      node.draggable = false;
    } else {
      node.src = item.src;
      node.title = "Eingebettetes Video";
      node.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      node.allowFullscreen = true;
      node.referrerPolicy = "strict-origin-when-cross-origin";
    }

    node.addEventListener("pointerdown", (event) => {
      if (node.isContentEditable || event.button !== 0) return;
      event.preventDefault();
      selectElement(item.id);
      node.setPointerCapture(event.pointerId);
      const bounds = slide.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;
      const originX = item.x;
      const originY = item.y;
      const move = (moveEvent) => {
        item.x = Math.min(98, Math.max(2, originX + ((moveEvent.clientX - startX) / bounds.width) * 100));
        item.y = Math.min(96, Math.max(4, originY + ((moveEvent.clientY - startY) / bounds.height) * 100));
        node.style.left = `${item.x}%`;
        node.style.top = `${item.y}%`;
      };
      const finish = () => {
        node.removeEventListener("pointermove", move);
        node.removeEventListener("pointerup", finish);
        node.removeEventListener("pointercancel", finish);
        saveSlideElements(index, getSlideElements(index).map((stored) => stored.id === item.id ? item : stored));
      };
      node.addEventListener("pointermove", move);
      node.addEventListener("pointerup", finish, { once: true });
      node.addEventListener("pointercancel", finish, { once: true });
    });

    layer.append(node);
  });
  if (index === activeIndex) renderElementList();
}

function renderElementList() {
  const elements = getSlideElements(activeIndex);
  elementList.replaceChildren();
  if (elements.length === 0) {
    const empty = document.createElement("p");
    empty.className = "empty-element-list";
    empty.textContent = "Noch keine eigenen Elemente.";
    elementList.append(empty);
  } else {
    elements.forEach((item, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `element-list-item${item.id === selectedElementId ? " is-selected" : ""}`;
      button.textContent = `${String(index + 1).padStart(2, "0")}  ${item.type === "text" ? (item.text.slice(0, 24) || "Text") : item.type === "shape" ? "Form" : item.type === "video" ? "Video" : item.alt || "Bild"}`;
      button.addEventListener("click", () => selectElement(item.id));
      elementList.append(button);
    });
  }

  const selected = elements.find((item) => item.id === selectedElementId);
  elementProperties.hidden = !selected;
  if (selected) {
    elementColor.value = selected.color || "#ef3828";
    elementFontSize.value = String(selected.size || 3);
    elementWidth.value = String(selected.width);
    fontSizeRow.hidden = selected.type !== "text";
    shapeTypeRow.hidden = selected.type !== "shape";
    fontFamilyRow.hidden = selected.type !== "text";
    textAlignRow.hidden = selected.type !== "text";
    boldRow.hidden = selected.type !== "text";
    if (selected.type === "shape") elementShapeType.value = selected.shape;
    if (selected.type === "text") {
      elementFontFamily.value = selected.family || "Arial, Helvetica, sans-serif";
      elementTextAlign.value = selected.align || "left";
      elementBoldButton.setAttribute("aria-pressed", String(Boolean(selected.bold)));
    }
  }
}

function selectElement(id) {
  selectedElementId = id;
  slides[activeIndex].querySelectorAll(".custom-element").forEach((node) => {
    node.classList.toggle("is-selected", node.dataset.elementId === id);
  });
  renderElementList();
}

function addElement(type, details = {}) {
  const elements = getSlideElements(activeIndex);
  if (elements.length >= 50) {
    showStatus("Pro Folie sind maximal 50 eigene Elemente möglich.");
    return null;
  }
  if (type === "video" && elements.filter((element) => element.type === "video").length >= MAX_VIDEO_COUNT) {
    showStatus(`Pro Folie sind maximal ${MAX_VIDEO_COUNT} Video-Elemente möglich.`);
    return null;
  }
  const item = {
    id: crypto.randomUUID(),
    type,
    x: 50,
    y: 50,
    width: type === "text" ? 36 : 24,
    color: "#ef3828",
    ...details,
  };
  elements.push(item);
  try {
    localStorage.setItem(`${STORAGE_PREFIX}elements:${activeIndex}`, JSON.stringify(elements));
  } catch (error) {
    console.error("Das Element konnte nicht gespeichert werden.", error);
    showStatus("Speicher voll. Exportiere dein Projekt oder entferne ein Bild.");
    saveIndicator.textContent = "Speichern fehlgeschlagen · Projekt exportieren";
    saveIndicator.dataset.state = "error";
    return null;
  }
  saveIndicator.textContent = "Automatisch gespeichert";
  saveIndicator.dataset.state = "saved";
  selectedElementId = item.id;
  renderSlideElements(activeIndex);
  showStatus(`${type === "text" ? "Text" : type === "shape" ? "Form" : type === "video" ? "Video" : "Bild"} hinzugefügt. Ziehen zum Positionieren.`);
  return item;
}

function getEmbedUrl(value) {
  let url;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Bitte einen gültigen YouTube- oder Vimeo-Link einfügen.");
  }
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  let videoId = "";
  let embedUrl = "";
  if (host === "youtube.com" || host === "m.youtube.com" || host === "youtube-nocookie.com") {
    videoId = url.pathname === "/watch" ? url.searchParams.get("v") || "" : url.pathname.split("/").filter(Boolean).at(-1) || "";
    videoId = videoId.replace(/^(embed|shorts|live)\/?/, "");
    if (!/^[\w-]{11}$/.test(videoId)) throw new Error("YouTube-Link nicht erkannt. Bitte einen normalen Video-, Shorts- oder Embed-Link verwenden.");
    embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
  } else if (host === "youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] || "";
    if (!/^[\w-]{11}$/.test(videoId)) throw new Error("YouTube-Link nicht erkannt. Bitte einen gültigen youtu.be-Link einfügen.");
    embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
  } else if (host === "vimeo.com" || host === "player.vimeo.com") {
    videoId = url.pathname.split("/").filter(Boolean).at(-1) || "";
    if (!/^\d+$/.test(videoId)) throw new Error("Vimeo-Link nicht erkannt. Bitte einen normalen Vimeo-Video-Link verwenden.");
    embedUrl = `https://player.vimeo.com/video/${videoId}`;
  } else {
    throw new Error("Unterstützt werden YouTube und Vimeo.");
  }
  return embedUrl;
}

function updateSelectedElement(update) {
  const elements = getSlideElements(activeIndex);
  const selected = elements.find((item) => item.id === selectedElementId);
  if (!selected) return;
  Object.assign(selected, update);
  try {
    localStorage.setItem(`${STORAGE_PREFIX}elements:${activeIndex}`, JSON.stringify(elements));
    saveIndicator.textContent = "Automatisch gespeichert";
    saveIndicator.dataset.state = "saved";
  } catch (error) {
    console.error("Das Element konnte nicht gespeichert werden.", error);
    saveIndicator.textContent = "Speichern fehlgeschlagen · Projekt exportieren";
    saveIndicator.dataset.state = "error";
    showStatus("Speichern fehlgeschlagen. Exportiere dein Projekt als Sicherung.");
    return;
  }
  const node = slides[activeIndex].querySelector(`[data-element-id="${CSS.escape(selectedElementId)}"]`);
  if (node) {
    if (update.color) node.style.setProperty("--element-color", update.color);
    if (update.size) node.style.setProperty("--element-size", update.size);
    if (update.width) node.style.width = `${update.width}%`;
    if (update.shape) {
      node.classList.remove("custom-element-rectangle", "custom-element-circle", "custom-element-line");
      node.classList.add(`custom-element-${update.shape}`);
    }
    if (update.family) node.style.setProperty("--element-family", update.family);
    if (update.align) node.style.setProperty("--element-align", update.align);
    if (update.bold !== undefined) node.style.fontWeight = update.bold ? "800" : "400";
  }
  renderElementList();
}

function deleteSelectedElement() {
  const elements = getSlideElements(activeIndex).filter((item) => item.id !== selectedElementId);
  try {
    localStorage.setItem(`${STORAGE_PREFIX}elements:${activeIndex}`, JSON.stringify(elements));
  } catch (error) {
    console.error("Das Element konnte nicht gelöscht werden.", error);
    showStatus("Änderung konnte nicht gespeichert werden.");
    return;
  }
  selectedElementId = null;
  renderSlideElements(activeIndex);
}

function updateSlideNavigation() {
  const total = slides.length;
  slides.forEach((slide, index) => {
    slide.setAttribute("aria-label", `Folie ${index + 1} von ${total}`);
    slide.querySelector(".slide-number").innerHTML =
      `${String(index + 1).padStart(2, "0")} <i>/ ${String(total).padStart(2, "0")}</i>`;
  });
  pageCount.innerHTML = `${String(activeIndex + 1).padStart(2, "0")} <span>/ ${String(total).padStart(2, "0")}</span>`;
  previousButton.disabled = activeIndex <= 0;
  nextButton.disabled = activeIndex >= total - 1;
  panelSlideNumber.textContent = String(activeIndex + 1).padStart(2, "0");
  transitionLabel.textContent = `FOLIE ${String(activeIndex + 1).padStart(2, "0")} · ÜBERGANG`;
  deleteSlideButton.disabled = activeIndex < STATIC_SLIDE_COUNT;
}

function renderLayoutGallery() {
  layoutGallery.replaceChildren();
  SLIDE_LAYOUTS.forEach((layout) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "layout-card";
    const preview = document.createElement("span");
    preview.className = `layout-preview layout-preview-${layout.id}`;
    preview.setAttribute("aria-hidden", "true");
    const title = document.createElement("span");
    title.className = "layout-card-title";
    title.textContent = layout.name;
    const description = document.createElement("span");
    description.className = "layout-card-description";
    description.textContent = layout.description;
    button.append(preview, title, description);
    button.addEventListener("click", () => addSlideFromLayout(layout.id));
    layoutGallery.append(button);
  });
}

function addSlideFromLayout(layoutId) {
  const layout = SLIDE_LAYOUTS.find((item) => item.id === layoutId);
  if (!layout) return;
  if (slides.length >= STATIC_SLIDE_COUNT + 40) {
    showStatus("Maximal 40 zusätzliche Folien sind möglich.");
    return;
  }

  const slide = document.createElement("section");
  slide.className = `slide slide-layout slide-layout-${layout.id}`;
  slide.dataset.slide = "";
  slide.dataset.layoutId = layout.id;
  slide.hidden = true;
  const number = document.createElement("span");
  number.className = "slide-number";
  number.innerHTML = "00 <i>/ 00</i>";
  const decorations = document.createElement("div");
  decorations.className = "layout-decorations";
  decorations.setAttribute("aria-hidden", "true");
  const main = document.createElement("div");
  main.className = "layout-canvas";

  if (layout.id === "columns") {
    main.innerHTML = '<div class="layout-column layout-column-one"></div><div class="layout-column layout-column-two"></div>';
  } else if (layout.id === "image") {
    main.innerHTML = '<div class="layout-image-placeholder"><span>＋ BILD ÜBER „ELEMENTE“ EINFÜGEN</span></div>';
  } else if (layout.id === "video") {
    main.innerHTML = '<div class="layout-video-placeholder"><span>▶</span><p>VIDEO PER YOUTUBE- ODER VIMEO-LINK EINFÜGEN</p></div>';
  } else if (layout.id === "quote") {
    main.innerHTML = '<span class="layout-quote-mark">“</span>';
  } else if (layout.id === "section") {
    main.innerHTML = '<span class="layout-section-mark">NEUES KAPITEL</span>';
  } else {
    main.innerHTML = '<div class="layout-title-rule"></div>';
  }

  slide.append(decorations, main, number);
  stage.append(slide);
  slides.push(slide);
  const newIndex = slides.length - 1;
  const items = [];
  if (layout.id === "columns") {
    items.push(
      { id: crypto.randomUUID(), type: "text", text: layout.title, x: 50, y: 17, width: 76, size: 3.8, color: "#171717", bold: true },
      { id: crypto.randomUUID(), type: "text", text: layout.first, x: 26, y: 51, width: 34, size: 3.1, color: "#ef3828", bold: true },
      { id: crypto.randomUUID(), type: "text", text: layout.second, x: 70, y: 51, width: 34, size: 3.1, color: "#171717", bold: true },
    );
  } else if (layout.id === "quote") {
    items.push(
      { id: crypto.randomUUID(), type: "text", text: layout.title, x: 49, y: 48, width: 72, size: 4.7, color: "#171717", bold: true, family: "Georgia, serif", align: "center" },
      { id: crypto.randomUUID(), type: "text", text: layout.subtitle, x: 50, y: 75, width: 55, size: 1.8, color: "#ef3828", align: "center" },
    );
  } else {
    const titleY = layout.id === "cover" ? 43 : layout.id === "section" ? 47 : layout.id === "video" ? 18 : 37;
    items.push(
      { id: crypto.randomUUID(), type: "text", text: layout.title, x: 49, y: titleY, width: 76, size: layout.id === "cover" || layout.id === "section" ? 6.2 : 4.4, color: "#171717", bold: true, align: layout.id === "cover" || layout.id === "section" ? "center" : "left" },
      { id: crypto.randomUUID(), type: "text", text: layout.subtitle, x: layout.id === "cover" || layout.id === "section" ? 50 : 49, y: titleY + 13, width: 65, size: 2, color: "#57554f", align: layout.id === "cover" || layout.id === "section" ? "center" : "left" },
    );
  }

  try {
    localStorage.setItem(`${STORAGE_PREFIX}elements:${newIndex}`, JSON.stringify(items));
    const specs = JSON.parse(localStorage.getItem(DYNAMIC_SLIDES_KEY) || "[]");
    specs.push({ id: slide.id || crypto.randomUUID(), layoutId });
    slide.id = specs.at(-1).id;
    localStorage.setItem(DYNAMIC_SLIDES_KEY, JSON.stringify(specs));
  } catch (error) {
    slide.remove();
    slides.pop();
    console.error("Die neue Folie konnte nicht gespeichert werden.", error);
    showStatus("Neue Folie konnte nicht gespeichert werden. Prüfe den verfügbaren Browserspeicher.");
    return;
  }

  createSlideDot(newIndex);
  setSlide(newIndex);
  showStatus(`Folienvorlage „${layout.name}“ hinzugefügt. Texte sind frei verschiebbar.`);
}

function loadDynamicSlides() {
  let specs = [];
  try {
    specs = JSON.parse(localStorage.getItem(DYNAMIC_SLIDES_KEY) || "[]");
  } catch (error) {
    console.error("Zusätzliche Folien konnten nicht geladen werden.", error);
    showStatus("Zusätzliche Folien konnten nicht geladen werden.");
  }
  if (!Array.isArray(specs)) return;

  specs.slice(0, 40).forEach((spec) => {
    if (!spec || typeof spec.id !== "string" || !SLIDE_LAYOUTS.some((layout) => layout.id === spec.layoutId)) return;
    const slide = document.createElement("section");
    slide.className = `slide slide-layout slide-layout-${spec.layoutId}`;
    slide.dataset.slide = "";
    slide.dataset.layoutId = spec.layoutId;
    slide.id = spec.id;
    slide.hidden = true;
    const decorations = document.createElement("div");
    decorations.className = "layout-decorations";
    const main = document.createElement("div");
    main.className = "layout-canvas";
    if (spec.layoutId === "columns") main.innerHTML = '<div class="layout-column layout-column-one"></div><div class="layout-column layout-column-two"></div>';
    else if (spec.layoutId === "image") main.innerHTML = '<div class="layout-image-placeholder"><span>＋ BILD ÜBER „ELEMENTE“ EINFÜGEN</span></div>';
    else if (spec.layoutId === "video") main.innerHTML = '<div class="layout-video-placeholder"><span>▶</span><p>VIDEO PER YOUTUBE- ODER VIMEO-LINK EINFÜGEN</p></div>';
    else if (spec.layoutId === "quote") main.innerHTML = '<span class="layout-quote-mark">“</span>';
    else if (spec.layoutId === "section") main.innerHTML = '<span class="layout-section-mark">NEUES KAPITEL</span>';
    else main.innerHTML = '<div class="layout-title-rule"></div>';
    const number = document.createElement("span");
    number.className = "slide-number";
    number.innerHTML = "00 <i>/ 00</i>";
    slide.append(decorations, main, number);
    stage.append(slide);
    slides.push(slide);
  });
}

function createSlideDot(index) {
  const dot = document.createElement("button");
  dot.className = "slide-dot";
  dot.type = "button";
  dot.setAttribute("aria-label", `Zu Folie ${index + 1}`);
  dot.addEventListener("click", () => setSlide(index));
  dotsContainer.append(dot);
}

function setAssistantPanelOpen(open) {
  assistantPanel.hidden = !open;
  workspace.classList.toggle("is-assistant-open", open);
  assistantToggle.setAttribute("aria-pressed", String(open));
}

function setAssistantTab(activeTab) {
  assistantTabs.forEach((tab, index) => {
    const active = tab === activeTab;
    tab.classList.toggle("is-active", active);
    tab.setAttribute("aria-selected", String(active));
    assistantViews[index].hidden = !active;
  });
}

function getCurrentSlideText() {
  return getCurrentSlideTextFor(activeIndex).slice(0, 6000);
}

function appendChatMessage(role, text) {
  const message = document.createElement("article");
  message.className = `chat-message chat-message-${role}`;
  const label = document.createElement("span");
  label.className = "chat-message-label";
  label.textContent = role === "user" ? "DU" : role === "tool" ? "WERKZEUG" : "KI-COPILOT";
  const content = document.createElement("p");
  const urlPattern = /(https:\/\/[^\s<]+)/g;
  let cursor = 0;
  for (const match of text.matchAll(urlPattern)) {
    const url = match[0].replace(/[),.;!?]+$/, "");
    const start = match.index;
    content.append(document.createTextNode(text.slice(cursor, start)));
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = url;
    content.append(link, document.createTextNode(match[0].slice(url.length)));
    cursor = start + match[0].length;
  }
  content.append(document.createTextNode(text.slice(cursor)));
  message.append(label, content);
  chatMessages.append(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return message;
}

function getStoredNimApiKey() {
  try {
    return localStorage.getItem(NIM_API_KEY_KEY) || sessionStorage.getItem(NIM_API_KEY_KEY) || "";
  } catch (error) {
    console.error("Der NVIDIA API-Schlüssel konnte nicht aus dem Browserspeicher gelesen werden.", error);
    return "";
  }
}

function loadNimSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem(NIM_SETTINGS_KEY) || "{}");
    const model = typeof stored.model === "string" && stored.model.trim() ? stored.model.trim() : NIM_MODEL_DEFAULT;
    const temperature = Number.isFinite(stored.temperature) ? Math.min(1, Math.max(0, stored.temperature)) : 0.4;
    const rememberKey = stored.rememberKey !== false;
    return { model, temperature, rememberKey };
  } catch (error) {
    console.error("Die NVIDIA-Einstellungen konnten nicht geladen werden.", error);
    return { model: NIM_MODEL_DEFAULT, temperature: 0.4, rememberKey: true };
  }
}

function updateNimAssistantState() {
  const configured = Boolean(getStoredNimApiKey());
  nimRememberKeyInput.checked = nimSettings.rememberKey;
  chatInput.disabled = !configured || aiBusy;
  chatSend.disabled = !configured || aiBusy;
  aiCapabilityNote.textContent = configured
    ? `NVIDIA NIM bereit · ${nimSettings.model}`
    : "NVIDIA NIM ist noch nicht eingerichtet. Trage deinen API-Schlüssel in den KI-Einstellungen ein.";
  nimApiKeyInput.value = getStoredNimApiKey();
  nimModelInput.value = nimSettings.model;
  nimTemperatureInput.value = nimSettings.temperature.toFixed(1);
  nimTemperatureValue.value = nimSettings.temperature.toFixed(1);
}

function openNimSettings() {
  nimSettingsStatus.textContent = "";
  updateNimAssistantState();
  if (!nimSettingsDialog.open) nimSettingsDialog.showModal();
  nimApiKeyInput.focus();
}

async function requestNim(messages, includeTools) {
  const apiKey = getStoredNimApiKey();
  if (!apiKey) throw new Error("NVIDIA NIM ist nicht eingerichtet. Öffne die KI-Einstellungen und trage deinen API-Schlüssel ein.");
  let response;
  try {
    response = await fetch(NIM_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: nimSettings.model,
        messages,
        ...(includeTools ? { tools: NIM_TOOLS, tool_choice: "auto" } : {}),
        temperature: nimSettings.temperature,
        max_tokens: 1200,
        stream: false,
      }),
      signal: AbortSignal.timeout(90000),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new Error("Die NVIDIA-Anfrage hat zu lange gedauert. Versuche es erneut.");
    }
    throw new Error("NVIDIA NIM ist nicht erreichbar. Prüfe Internetverbindung und Browser-CORS-Einstellungen.");
  }

  if (!response.ok) {
    const responseText = await response.text();
    let detail = "";
    try {
      const errorData = JSON.parse(responseText);
      detail = errorData?.error?.message || errorData?.message || "";
    } catch {
      detail = "";
    }
    if (response.status === 401 || response.status === 403) {
      throw new Error("NVIDIA hat den API-Schlüssel abgelehnt. Prüfe den Schlüssel in den KI-Einstellungen.");
    }
    if (response.status === 404) {
      throw new Error(`Das Modell „${nimSettings.model}“ wurde nicht gefunden. Prüfe die Modellkennung in den KI-Einstellungen.`);
    }
    throw new Error(detail || `NVIDIA NIM antwortete mit HTTP ${response.status}.`);
  }

  const data = await response.json();
  const message = data?.choices?.[0]?.message;
  const hasToolCalls = Array.isArray(message?.tool_calls) && message.tool_calls.length > 0;
  if (!message || (!hasToolCalls && (typeof message.content !== "string" || !message.content.trim()))) {
    throw new Error("NVIDIA NIM hat keine lesbare Antwort zurückgegeben.");
  }
  return message;
}

function saveNimSettings(event) {
  event.preventDefault();
  const apiKey = nimApiKeyInput.value.trim();
  const model = nimModelInput.value.trim();
  if (!apiKey) {
    nimSettingsStatus.textContent = "Bitte einen NVIDIA API-Schlüssel eintragen.";
    nimApiKeyInput.focus();
    return;
  }
  if (/[\r\n]/.test(apiKey)) {
    nimSettingsStatus.textContent = "Der API-Schlüssel enthält ungültige Zeilenumbrüche.";
    nimApiKeyInput.focus();
    return;
  }
  if (!/^[\w./:-]{1,160}$/.test(model)) {
    nimSettingsStatus.textContent = "Die Modellkennung darf nur Buchstaben, Zahlen und / . _ : - enthalten.";
    nimModelInput.focus();
    return;
  }

  const nextSettings = {
    model,
    temperature: Number(nimTemperatureInput.value),
    rememberKey: nimRememberKeyInput.checked,
  };
  try {
    localStorage.setItem(NIM_SETTINGS_KEY, JSON.stringify(nextSettings));
    if (nimRememberKeyInput.checked) {
      localStorage.setItem(NIM_API_KEY_KEY, apiKey);
      sessionStorage.removeItem(NIM_API_KEY_KEY);
    } else {
      sessionStorage.setItem(NIM_API_KEY_KEY, apiKey);
      localStorage.removeItem(NIM_API_KEY_KEY);
    }
    nimSettings = nextSettings;
    nimSettingsDialog.close();
    updateNimAssistantState();
    showStatus("NVIDIA NIM eingerichtet. API-Schlüssel wird nur bei einer KI-Anfrage an NVIDIA gesendet.");
  } catch (error) {
    console.error("Die NVIDIA-Einstellungen konnten nicht gespeichert werden.", error);
    nimSettingsStatus.textContent = "Speichern im Browser nicht möglich. Prüfe die Speichereinstellungen.";
  }
}

function clearNimApiKey() {
  try {
    localStorage.removeItem(NIM_API_KEY_KEY);
    sessionStorage.removeItem(NIM_API_KEY_KEY);
    nimApiKeyInput.value = "";
    nimSettingsStatus.textContent = "API-Schlüssel entfernt.";
    updateNimAssistantState();
  } catch (error) {
    console.error("Der NVIDIA API-Schlüssel konnte nicht entfernt werden.", error);
    nimSettingsStatus.textContent = "Der Schlüssel konnte nicht entfernt werden.";
  }
}

function initializeAiAssistant() {
  updateNimAssistantState();
  if (!getStoredNimApiKey()) openNimSettings();
}

async function sendAiMessage(text) {
  if (!text || aiBusy) return;
  if (!getStoredNimApiKey()) {
    openNimSettings();
    return;
  }
  aiBusy = true;
  chatInput.disabled = true;
  chatSend.disabled = true;
  chatClearButton.disabled = true;
  chatQuickPrompts.forEach((button) => { button.disabled = true; });
  appendChatMessage("user", text);
  chatConversation.push({ role: "user", content: text });
  let thinkingMessage;
  try {
    thinkingMessage = appendChatMessage("assistant", "Ich prüfe den Folienkontext und bereite eine Antwort vor …");
    thinkingMessage.classList.add("chat-message-thinking");
    const slideText = getCurrentSlideText();
    const systemPrompt = `Du bist ein hilfreicher deutscher Präsentations-Coach für GFS-Schülerinnen und -Schüler. Antworte verständlich, knapp und altersgerecht. Erfinde keine Fakten oder Quellen. Wenn Informationen unsicher oder nicht überprüfbar sind, sage das deutlich. Der Chat ist zuerst zum Beraten da: Füge niemals von dir aus Folien oder Texte hinzu. Rufe add_slide oder add_text_to_slide ausschließlich auf, wenn die aktuelle Nutzernachricht ausdrücklich darum bittet, etwas zur Präsentation hinzuzufügen oder einzufügen. Bei Fragen, Feedback- oder Verbesserungsvorschlägen ohne ausdrückliche Einfüge-Bitte antwortest du nur im Chat. Beschreibe nach Werkzeugaktionen kurz und ehrlich, was du geändert hast. Suche bei Bedarf externe Hintergrundinformationen mit search_wikipedia und kennzeichne Wikipedia als Orientierung, nicht als abschließenden Beleg.\n\nAktueller Kontext: Folie ${activeIndex + 1} von ${slides.length}.\n${slideText || "(Die Folie enthält noch keinen Text.)"}`;
    const includeTools = assistantToolsEnabled.checked;
    const additionsAllowed = explicitlyRequestsPresentationAddition(text);
    let responseText = "";
    let toolRounds = 0;
    let toolsExecuted = 0;
    while (toolRounds < 4) {
      const requestMessages = [
        { role: "system", content: systemPrompt },
        ...chatConversation,
      ];
      const message = await requestNim(requestMessages, includeTools);
      const toolCalls = Array.isArray(message.tool_calls) ? message.tool_calls : [];
      if (!toolCalls.length) {
        responseText = typeof message.content === "string" ? message.content.trim() : "";
        if (responseText) chatConversation.push({ role: "assistant", content: responseText });
        break;
      }

      chatConversation.push({
        role: "assistant",
        content: typeof message.content === "string" ? message.content : null,
        tool_calls: toolCalls,
      });
      for (const call of toolCalls) {
        const name = call?.function?.name;
        const callId = call?.id;
        if (!callId || typeof callId !== "string" || typeof name !== "string") {
          throw new Error("NVIDIA hat einen unvollständigen Werkzeugaufruf zurückgegeben.");
        }
        let result;
        try {
          const args = JSON.parse(call.function.arguments || "{}");
          if (toolsExecuted >= 8) throw new Error("Höchstens acht Werkzeugaktionen sind pro Anfrage möglich.");
          toolsExecuted += 1;
          result = await runAssistantTool(name, args, includeTools, additionsAllowed);
          appendChatMessage("tool", `${name}: ${result}`);
        } catch (error) {
          result = error instanceof Error ? error.message : "Werkzeugaufruf fehlgeschlagen.";
          appendChatMessage("tool", `${name || "Unbekanntes Werkzeug"}: ${result}`);
        }
        chatConversation.push({ role: "tool", tool_call_id: callId, content: result });
      }
      toolRounds += 1;
    }
    if (!responseText && toolRounds >= 4) {
      responseText = "Die Werkzeugkette wurde nach vier Schritten beendet. Bitte stelle eine gezieltere Anschlussfrage.";
      chatConversation.push({ role: "assistant", content: responseText });
    }
    thinkingMessage.remove();
    thinkingMessage = null;
    if (responseText) appendChatMessage("assistant", responseText);
    trimChatConversation();
  } catch (error) {
    thinkingMessage?.remove();
    console.error("Der KI-Chat konnte nicht antworten.", error);
    appendChatMessage("assistant", error instanceof Error ? error.message : "Die NVIDIA-Anfrage konnte nicht abgeschlossen werden.");
  } finally {
    thinkingMessage?.remove();
    aiBusy = false;
    chatClearButton.disabled = false;
    chatQuickPrompts.forEach((button) => { button.disabled = false; });
    updateNimAssistantState();
    chatInput.focus();
  }
}

function trimChatConversation() {
  const userTurnIndexes = chatConversation
    .map((message, index) => message.role === "user" ? index : -1)
    .filter((index) => index >= 0);
  if (userTurnIndexes.length > 8) {
    chatConversation = chatConversation.slice(userTurnIndexes.at(-8));
  }
}

function explicitlyRequestsPresentationAddition(text) {
  const request = text.normalize("NFC").toLocaleLowerCase("de");
  if (/\b(?:nicht|kein(?:e|en|em|er)?|niemals)\b/u.test(request)) return false;

  const directRequest = /\b(?:füg(?:e)?|fügen wir|erstell(?:e|st|t|en)?|ergänz(?:e|t|en)?|mach(?:e|st|t)?|bau(?:e|st|t)?|schreib(?:e|st|t)?|pack(?:e|st|t)?)\b[\s\S]{0,80}\b(?:hinzu|ein|folie(?:n)?|text|titel|element)\b/u;
  const politeRequest = /\b(?:kannst du|könntest du|können sie|könnt ihr)\b[\s\S]{0,80}\b(?:folie(?:n)?|text|titel|element)\b[\s\S]{0,40}\b(?:hinzufügen|einfügen|erstellen|ergänzen|schreiben|packen)\b/u;
  return directRequest.test(request) || politeRequest.test(request);
}

async function runAssistantTool(name, args, toolsEnabled, additionsAllowed) {
  if (!toolsEnabled) throw new Error("Werkzeuge sind in den Chat-Einstellungen deaktiviert.");
  if (!args || typeof args !== "object" || Array.isArray(args)) throw new Error("Ungültige Werkzeugparameter.");
  if (["add_slide", "add_text_to_slide"].includes(name) && !additionsAllowed) {
    throw new Error("Ich füge nur auf ausdrückliche Bitte etwas zur Präsentation hinzu.");
  }

  if (name === "get_presentation_outline") {
    const overview = slides.map((slide, index) => {
      const title = getSlideElements(index).find((element) => element.type === "text")?.text
        || slide.querySelector("[data-editable]")?.textContent?.trim()
        || `Folie ${index + 1}`;
      const detail = getCurrentSlideTextFor(index).slice(0, 90).replace(/\s+/g, " ");
      return `${index + 1}. ${title.slice(0, 90)}${detail && detail !== title ? ` — ${detail}` : ""}`;
    });
    return overview.join("\n").slice(0, 8000) || "Keine Folien vorhanden.";
  }
  if (name === "add_slide") {
    if (typeof args.layout_id !== "string" || !SLIDE_LAYOUTS.some((layout) => layout.id === args.layout_id)) {
      throw new Error("Dieses Folienlayout ist nicht verfügbar.");
    }
    const previousCount = slides.length;
    addSlideFromLayout(args.layout_id);
    if (slides.length === previousCount) throw new Error("Die Folie konnte nicht angelegt werden.");
    return `Folie „${SLIDE_LAYOUTS.find((layout) => layout.id === args.layout_id).name}“ hinzugefügt.`;
  }
  if (name === "add_text_to_slide") {
    if (typeof args.text !== "string" || !args.text.trim() || args.text.length > 500) {
      throw new Error("Text muss 1 bis 500 Zeichen lang sein.");
    }
    const color = args.color === undefined ? "#171717" : args.color;
    if (typeof color !== "string" || !/^#[0-9a-f]{6}$/i.test(color)) throw new Error("Die Textfarbe muss ein gültiger Hex-Farbwert sein.");
    const item = addElement("text", { text: args.text.trim(), color, size: 2.8, width: 55 });
    if (!item) throw new Error("Der Text konnte nicht hinzugefügt werden.");
    return `Text auf Folie ${activeIndex + 1} eingefügt und ausgewählt.`;
  }
  if (name === "set_presentation_design") {
    if (typeof args.design !== "string" || !TEMPLATE_IDS.includes(args.design)) throw new Error("Dieses Design ist nicht verfügbar.");
    if (!applyPresentationDesign(args.design)) throw new Error("Das Design konnte nicht gespeichert werden.");
    return `Design „${templateSelect.selectedOptions[0].textContent}“ angewendet.`;
  }
  if (name === "set_current_slide_transition") {
    if (typeof args.transition !== "string" || !Array.from(transitionSelect.options).some((option) => option.value === args.transition)) {
      throw new Error("Dieser Folienübergang ist nicht verfügbar.");
    }
    if (!applySlideTransition(args.transition)) throw new Error("Der Übergang konnte nicht gespeichert werden.");
    return `Übergang „${transitionSelect.selectedOptions[0].textContent}“ für Folie ${activeIndex + 1} gesetzt.`;
  }
  if (name === "search_wikipedia") {
    if (typeof args.query !== "string" || !args.query.trim() || args.query.length > 120) {
      throw new Error("Die Suchanfrage muss 1 bis 120 Zeichen lang sein.");
    }
    const url = new URL("https://de.wikipedia.org/w/api.php");
    url.search = new URLSearchParams({
      action: "query",
      list: "search",
      srsearch: args.query.trim(),
      format: "json",
      origin: "*",
      utf8: "1",
      srlimit: "4",
    });
    let response;
    try {
      response = await fetch(url, { signal: AbortSignal.timeout(12000) });
    } catch {
      throw new Error("Wikipedia ist derzeit nicht erreichbar.");
    }
    if (!response.ok) throw new Error(`Wikipedia antwortete mit HTTP ${response.status}.`);
    const data = await response.json();
    const results = data?.query?.search;
    if (!Array.isArray(results) || !results.length) return "Keine passenden Wikipedia-Artikel gefunden.";
    return results.map((item) => {
      const summary = String(item.snippet || "").replace(/<[^>]*>/g, "").replace(/&quot;/g, "\"").replace(/&#039;/g, "'").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
      return `${item.title}: ${summary.slice(0, 280)}\nhttps://de.wikipedia.org/?curid=${encodeURIComponent(item.pageid)}`;
    }).join("\n\n").slice(0, 2200);
  }
  throw new Error("Dieses Werkzeug ist nicht freigegeben.");
}

function getCurrentSlideTextFor(index) {
  const slide = slides[index];
  const templateText = slide.querySelector(".slide-content")?.textContent?.replace(/\s+/g, " ").trim() || "";
  const customText = getSlideElements(index)
    .filter((item) => item.type === "text")
    .map((item) => item.text)
    .join("\n");
  return `${templateText}\n${customText}`.trim();
}

function applyPresentationDesign(template) {
  if (!TEMPLATE_IDS.includes(template)) return false;
  stage.dataset.template = template;
  templateSelect.value = template;
  try {
    localStorage.setItem(TEMPLATE_STORAGE_KEY, template);
    showStatus(`Design gewählt: ${templateSelect.selectedOptions[0].textContent}.`);
    return true;
  } catch (error) {
    console.error("Das Präsentationsdesign konnte nicht gespeichert werden.", error);
    showStatus("Das Design wurde gewählt, kann aber nicht gespeichert werden.");
    return false;
  }
}

function applySlideTransition(transition) {
  if (!Array.from(transitionSelect.options).some((option) => option.value === transition)) return false;
  slides[activeIndex].dataset.transition = transition;
  transitionSelect.value = transition;
  try {
    localStorage.setItem(`${TRANSITION_STORAGE_PREFIX}${activeIndex}`, transition);
    showStatus(`Übergang für Folie ${activeIndex + 1} gewählt: ${transitionSelect.selectedOptions[0].textContent}.`);
    return true;
  } catch (error) {
    console.error(`Der Übergang von Folie ${activeIndex + 1} konnte nicht gespeichert werden.`, error);
    showStatus("Der Übergang wurde gewählt, kann aber nicht gespeichert werden.");
    return false;
  }
}

function clearChat() {
  if (aiBusy) return;
  chatConversation = [];
  chatMessages.replaceChildren();
  const welcome = document.createElement("p");
  welcome.className = "chat-welcome";
  welcome.textContent = "Neuer Chat. Frag nach Ideen, Feedback oder lass dir mit den Werkzeugen beim Aufbau helfen.";
  chatMessages.append(welcome);
  chatInput.value = "";
  chatInput.focus();
}

function getSourceReview(text) {
  const lines = text.split(/\n+/).map((line) => line.trim()).filter(Boolean);
  const claims = lines.filter((line) => /\d{2,}|%|immer|nie|alle|kein|größte|erste|führte|verursacht|steigt|sinkt/i.test(line));
  const links = text.match(/https?:\/\/\S+/gi) || [];
  const sourceLines = lines.filter((line) => /quelle|quellen|literatur|autor|studie|https?:\/\//i.test(line));
  const warnings = [];
  if (claims.length > sourceLines.length) {
    warnings.push(`${claims.length} mögliche Zahlen- oder Tatsachenbehauptung(en), aber nur ${sourceLines.length} sichtbare Quellenangabe(n). Prüfe jede Behauptung einzeln.`);
  }
  if (links.length === 0 && sourceLines.length === 0) {
    warnings.push("Keine Quellenangabe erkannt. Ergänze Autor oder Institution, Titel, Jahr und einen funktionierenden Link.");
  }
  if (claims.some((line) => /\b(immer|nie|alle|kein|größte|erste)\b/i.test(line))) {
    warnings.push("Absolute Formulierungen gefunden. Prüfe, ob sie wirklich ohne Ausnahmen stimmen, oder grenze sie ein.");
  }
  if (lines.length < 3) warnings.push("Auf der Folie steht wenig überprüfbarer Inhalt. Ergänze deine zentrale Aussage und Belege.");
  if (warnings.length === 0) warnings.push("Keine offensichtliche Quellenlücke erkannt. Das ist keine Bestätigung der sachlichen Richtigkeit.");
  return warnings;
}

async function checkCurrentSlide() {
  const text = getCurrentSlideText();
  const warnings = getSourceReview(text);
  checkResults.replaceChildren();
  if (getStoredNimApiKey()) {
    checkResults.textContent = "NVIDIA NIM prüft Aussagen und Quellenhinweise …";
    try {
      const prompt = `Prüfe den folgenden Präsentationsfolientext auf überprüfbare Tatsachenbehauptungen, Zahlen, absolute Aussagen und fehlende Quellen. Du hast keinen Webzugriff: behaupte niemals, eine Aussage verifiziert zu haben. Liste konkrete Aussagen, die geprüft werden sollten, schlage passende Quellentypen vor und unterscheide klar zwischen Belegqualität und Wahrheit.\n\n${text || "(kein Text auf der Folie)"}`;
      const response = await requestNim([
        { role: "system", content: "Du bist ein sorgfältiger Recherche-Coach. Du hast keinen Webzugriff und darfst keine Aussage als verifiziert darstellen. Antworte auf Deutsch und benenne Unsicherheiten ausdrücklich." },
        { role: "user", content: prompt },
      ], false);
      if (typeof response.content !== "string" || !response.content.trim()) {
        throw new Error("NVIDIA NIM hat keine lesbare Antwort zurückgegeben.");
      }
      checkResults.replaceChildren();
      addCheckResult("NVIDIA Nemotron · kein Web-Faktencheck", response.content.trim());
    } catch (error) {
      console.error("Die NVIDIA-Informationsprüfung konnte nicht abgeschlossen werden.", error);
      checkResults.replaceChildren();
      addCheckResult("NVIDIA NIM nicht verfügbar", error instanceof Error ? error.message : "Nutze die Hinweise zum Quellen-Check.");
    }
  } else {
    addCheckResult("Quellen-Check · ohne KI", "Trage deinen NVIDIA API-Schlüssel in den KI-Einstellungen ein, um diesen Check mit Nemotron auszuführen. Ohne KI prüft das Ergebnis nur Quellenlücken und Formulierungen – nicht die Wahrheit der Aussagen.");
  }
  warnings.forEach((warning) => addCheckResult("Hinweis", warning));
}

function addCheckResult(label, text) {
  const article = document.createElement("article");
  article.className = "check-result";
  const heading = document.createElement("strong");
  heading.textContent = label;
  const body = document.createElement("p");
  body.textContent = text;
  article.append(heading, body);
  checkResults.append(article);
}

function setElementPanelOpen(open) {
  elementPanel.hidden = !open;
  workspace.classList.toggle("is-editor-open", open);
  elementsToggle.setAttribute("aria-pressed", String(open));
  if (open) {
    renderSlideElements(activeIndex);
    showStatus("Elemente-Menü geöffnet. Elemente ziehen, doppelklicken zum Schreiben.");
  }
}

async function imageToDataUrl(file) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
    throw new Error("Bitte ein PNG-, JPG- oder WebP-Bild auswählen.");
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("Bilder dürfen maximal 20 MB groß sein.");
  }

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new Error("Das Bild konnte nicht verarbeitet werden.");
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const dataUrl = canvas.toDataURL("image/webp", 0.72);
  if (!dataUrl.startsWith("data:image/webp,") && !dataUrl.startsWith("data:image/webp;base64,")) {
    throw new Error("Dein Browser unterstützt die Bildkomprimierung nicht.");
  }
  if (dataUrl.length > 1_500_000) {
    throw new Error("Das Bild ist nach der Komprimierung noch zu groß. Bitte ein kleineres Bild verwenden.");
  }
  return dataUrl;
}

function exportProject() {
  try {
    const data = Object.keys(localStorage)
      .filter((key) => key.startsWith(STORAGE_PREFIX) && !key.startsWith(`${STORAGE_PREFIX}nim:`))
      .map((key) => ({ key, value: localStorage.getItem(key) }));
    const project = {
      app: "gfs-studio",
      version: 1,
      exportedAt: new Date().toISOString(),
      data,
    };
    const contents = JSON.stringify(project, null, 2);
    if (contents.length > MAX_PROJECT_SIZE) throw new Error("Projekt ist größer als 4 MB. Entferne einige Bilder und versuche es erneut.");
    const blob = new Blob([contents], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "meine-gfs-praesentation.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    saveIndicator.textContent = "Projektdatei heruntergeladen";
    saveIndicator.dataset.state = "saved";
  } catch (error) {
    console.error("Die Projektdatei konnte nicht erstellt werden.", error);
    showStatus("Die Projektdatei konnte nicht erstellt werden.");
  }
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;",
  })[character]);
}

function colorToHex(color, fallback = "#171717") {
  const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!match) return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
  return `#${match.slice(1, 4).map((part) => Number(part).toString(16).padStart(2, "0")).join("")}`;
}

function getExportSlideData(slide, index, exportStage) {
  const bounds = exportStage.getBoundingClientRect();
  const background = colorToHex(getComputedStyle(slide).backgroundColor, "#eeece5");
  const items = [];
  slide.querySelectorAll(".shape, .layout-column, .layout-image-placeholder, .layout-video-placeholder, .custom-element-shape").forEach((node) => {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    const fill = colorToHex(style.backgroundColor, "");
    if (!fill || fill === "#000000" && style.backgroundColor === "rgba(0, 0, 0, 0)") return;
    if (rect.width < 2 || rect.height < 2) return;
    items.push({
      type: "shape",
      x: (rect.left - bounds.left) / bounds.width,
      y: (rect.top - bounds.top) / bounds.height,
      width: rect.width / bounds.width,
      height: rect.height / bounds.height,
      fill,
    });
  });

  const walker = document.createTreeWalker(slide, NodeFilter.SHOW_TEXT);
  while (walker.nextNode()) {
    const textNode = walker.currentNode;
    const text = textNode.textContent.replace(/\s+/g, " ").trim();
    const parent = textNode.parentElement;
    if (!text || !parent || parent.closest("[aria-hidden='true'], [hidden], script, style")) continue;
    const range = document.createRange();
    range.selectNodeContents(textNode);
    const rect = range.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) continue;
    const parentRect = parent.getBoundingClientRect();
    const style = getComputedStyle(parent);
    const left = Math.max(bounds.left, rect.left);
    items.push({
      type: "text",
      text,
      x: (left - bounds.left) / bounds.width,
      y: (Math.max(bounds.top, parentRect.top) - bounds.top) / bounds.height,
      width: Math.max(rect.width, parentRect.right - left) / bounds.width,
      height: Math.max(rect.height, parentRect.height) / bounds.height,
      color: colorToHex(style.color),
      fontSize: Math.max(8, parseFloat(style.fontSize) || 16) * 0.75,
      fontFamily: style.fontFamily.split(",")[0].replace(/["']/g, "").trim() || "Arial",
      bold: Number.parseInt(style.fontWeight, 10) >= 600 || style.fontWeight === "bold",
      align: style.textAlign === "center" ? "ctr" : style.textAlign === "right" ? "r" : "l",
    });
  }

  slide.querySelectorAll("img[alt], iframe, model-viewer:not([hidden])").forEach((node) => {
    const rect = node.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const description = node instanceof HTMLImageElement
      ? `Bild: ${node.alt || "Eingefügtes Bild"}`
      : node instanceof HTMLIFrameElement
        ? `Video: ${node.title || "Eingebettetes Video"} (Video-Link in der exportierten Präsentation erneut einfügen)`
        : "3D-Modell: in der exportierten Präsentation als Bild neu einfügen";
    items.push({
      type: "text",
      text: description,
      x: (rect.left - bounds.left) / bounds.width,
      y: (rect.top - bounds.top) / bounds.height,
      width: rect.width / bounds.width,
      height: Math.max(0.06, rect.height / bounds.height),
      color: "#57554f",
      fontSize: 13,
      fontFamily: "Arial",
      bold: false,
      align: "ctr",
    });
  });

  return {
    title: `Folie ${String(index + 1).padStart(2, "0")}`,
    background,
    items: items.sort((a, b) => (a.type === "shape" ? -1 : 1) - (b.type === "shape" ? -1 : 1)),
  };
}

function getExportData() {
  const bounds = stage.getBoundingClientRect();
  const exportStage = stage.cloneNode(true);
  exportStage.style.position = "fixed";
  exportStage.style.left = "-20000px";
  exportStage.style.top = "0";
  exportStage.style.width = `${bounds.width}px`;
  exportStage.style.height = `${bounds.height}px`;
  exportStage.style.maxWidth = "none";
  exportStage.querySelectorAll("[data-slide]").forEach((slide) => {
    slide.hidden = false;
    slide.classList.remove("is-entering");
  });
  document.body.append(exportStage);
  try {
    return Array.from(exportStage.querySelectorAll("[data-slide]"), (slide, index) =>
      getExportSlideData(slide, index, exportStage));
  } finally {
    exportStage.remove();
  }
}

function zipU16(value) {
  return Uint8Array.of(value & 255, (value >>> 8) & 255);
}

function zipU32(value) {
  return Uint8Array.of(value & 255, (value >>> 8) & 255, (value >>> 16) & 255, (value >>> 24) & 255);
}

function joinBytes(parts) {
  const result = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  parts.forEach((part) => {
    result.set(part, offset);
    offset += part.length;
  });
  return result;
}

const crc32Table = Uint32Array.from({ length: 256 }, (_, value) => {
  let crc = value;
  for (let bit = 0; bit < 8; bit += 1) crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
  return crc >>> 0;
});

function crc32(bytes) {
  let crc = 0xffffffff;
  bytes.forEach((byte) => {
    crc = crc32Table[(crc ^ byte) & 255] ^ (crc >>> 8);
  });
  return (crc ^ 0xffffffff) >>> 0;
}

function createZip(entries) {
  const encoder = new TextEncoder();
  const localParts = [];
  const directoryParts = [];
  let localOffset = 0;
  entries.forEach(({ name, contents }) => {
    const nameBytes = encoder.encode(name);
    const data = typeof contents === "string" ? encoder.encode(contents) : contents;
    const checksum = crc32(data);
    const header = joinBytes([
      zipU32(0x04034b50), zipU16(20), zipU16(0x0800), zipU16(0), zipU16(0), zipU16(0),
      zipU32(checksum), zipU32(data.length), zipU32(data.length), zipU16(nameBytes.length), zipU16(0), nameBytes, data,
    ]);
    localParts.push(header);
    directoryParts.push(joinBytes([
      zipU32(0x02014b50), zipU16(20), zipU16(20), zipU16(0x0800), zipU16(0), zipU16(0), zipU16(0),
      zipU32(checksum), zipU32(data.length), zipU32(data.length), zipU16(nameBytes.length), zipU16(0), zipU16(0),
      zipU16(0), zipU16(0), zipU32(0), zipU32(localOffset), nameBytes,
    ]));
    localOffset += header.length;
  });
  const directory = joinBytes(directoryParts);
  const end = joinBytes([
    zipU32(0x06054b50), zipU16(0), zipU16(0), zipU16(entries.length), zipU16(entries.length),
    zipU32(directory.length), zipU32(localOffset), zipU16(0),
  ]);
  return joinBytes([...localParts, directory, end]);
}

function slideShapeId(index) {
  return index + 2;
}

function pptxTextShape(item, shapeId) {
  const x = Math.round(item.x * 12192000);
  const y = Math.round(item.y * 6858000);
  const cx = Math.max(1, Math.round(item.width * 12192000));
  const cy = Math.max(1, Math.round(item.height * 6858000));
  const paragraphs = item.type === "shape"
    ? ""
    : item.text.split("\n").map((line) => `<a:p><a:pPr algn="${item.align}"/><a:r><a:rPr lang="de-DE" sz="${Math.round(item.fontSize * 100)}"${item.bold ? ' b="1"' : ""}><a:solidFill><a:srgbClr val="${item.color.slice(1)}"/></a:solidFill><a:latin typeface="${escapeXml(item.fontFamily)}"/></a:rPr><a:t xml:space="preserve">${escapeXml(line)}</a:t></a:r><a:endParaRPr lang="de-DE"/></a:p>`).join("");
  const fill = item.type === "shape"
    ? `<a:solidFill><a:srgbClr val="${item.fill.slice(1)}"/></a:solidFill>`
    : "<a:noFill/>";
  return `<p:sp><p:nvSpPr><p:cNvPr id="${shapeId}" name="${item.type === "shape" ? "Form" : `Text ${shapeId}`}"/><p:cNvSpPr txBox="${item.type === "text" ? 1 : 0}"/><p:nvPr/></p:nvSpPr><p:spPr><a:xfrm><a:off x="${x}" y="${y}"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom>${fill}<a:ln><a:noFill/></a:ln></p:spPr>${item.type === "text" ? `<p:txBody><a:bodyPr wrap="square" lIns="0" rIns="0" tIns="0" bIns="0" anchor="t"/><a:lstStyle/>${paragraphs}</p:txBody>` : ""}</p:sp>`;
}

function createPptx(slideData) {
  const slideIds = slideData.map((_, index) => `<p:sldId id="${256 + index}" r:id="rId${index + 2}"/>`).join("");
  const rels = slideData.map((_, index) => `<Relationship Id="rId${index + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${index + 1}.xml"/>`).join("");
  const slideXml = slideData.map((slide, index) => {
    const shapes = slide.items.map((item, itemIndex) => pptxTextShape(item, slideShapeId(itemIndex))).join("");
    return {
      name: `ppt/slides/slide${index + 1}.xml`,
      contents: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:bg><p:bgPr><a:solidFill><a:srgbClr val="${slide.background.slice(1)}"/></a:solidFill><a:effectLst/></p:bgPr></p:bg><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>${shapes}</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`,
    };
  });
  const types = `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/><Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/><Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/><Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>${slideData.map((_, index) => `<Override PartName="/ppt/slides/slide${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join("")}</Types>`;
  const theme = `<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="GFS Studio"><a:themeElements><a:clrScheme name="GFS"><a:dk1><a:srgbClr val="171717"/></a:dk1><a:lt1><a:srgbClr val="FFFFFF"/></a:lt1><a:dk2><a:srgbClr val="57554F"/></a:dk2><a:lt2><a:srgbClr val="EEECE5"/></a:lt2><a:accent1><a:srgbClr val="EF3828"/></a:accent1><a:accent2><a:srgbClr val="4D86A2"/></a:accent2><a:accent3><a:srgbClr val="64815C"/></a:accent3><a:accent4><a:srgbClr val="D7D4CA"/></a:accent4><a:accent5><a:srgbClr val="85837D"/></a:accent5><a:accent6><a:srgbClr val="C3C0B9"/></a:accent6><a:hlink><a:srgbClr val="0563C1"/></a:hlink><a:folHlink><a:srgbClr val="954F72"/></a:folHlink></a:clrScheme><a:fontScheme name="GFS"><a:majorFont><a:latin typeface="Arial"/></a:majorFont><a:minorFont><a:latin typeface="Arial"/></a:minorFont></a:fontScheme><a:fmtScheme name="GFS"><a:fillStyleLst><a:solidFill><a:schemeClr val="accent1"/></a:solidFill></a:fillStyleLst><a:lnStyleLst><a:ln w="6350"><a:solidFill><a:schemeClr val="accent1"/></a:solidFill></a:ln></a:lnStyleLst><a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst><a:bgFillStyleLst><a:solidFill><a:schemeClr val="lt1"/></a:solidFill></a:bgFillStyleLst></a:fmtScheme></a:themeElements></a:theme>`;
  return createZip([
    { name: "[Content_Types].xml", contents: types },
    { name: "_rels/.rels", contents: '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/></Relationships>' },
    { name: "ppt/presentation.xml", contents: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst><p:sldIdLst>${slideIds}</p:sldIdLst><p:sldSz cx="12192000" cy="6858000" type="screen16x9"/><p:notesSz cx="6858000" cy="9144000"/><p:defaultTextStyle/></p:presentation>` },
    { name: "ppt/_rels/presentation.xml.rels", contents: `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>${rels}</Relationships>` },
    { name: "ppt/slideMasters/slideMaster1.xml", contents: '<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main"><p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMap accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" bg1="lt1" bg2="lt2" folHlink="folHlink" hlink="hlink" tx1="dk1" tx2="dk2"/><p:sldLayoutIdLst><p:sldLayoutId id="1" r:id="rId1"/></p:sldLayoutIdLst><p:txStyles><p:titleStyle/><p:bodyStyle/><p:otherStyle/></p:txStyles></p:sldMaster>' },
    { name: "ppt/slideMasters/_rels/slideMaster1.xml.rels", contents: '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/></Relationships>' },
    { name: "ppt/slideLayouts/slideLayout1.xml", contents: '<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" type="blank" preserve="1"><p:cSld name="Blank"><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>' },
    { name: "ppt/slideLayouts/_rels/slideLayout1.xml.rels", contents: '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/></Relationships>' },
    { name: "ppt/theme/theme1.xml", contents: theme },
    ...slideXml,
  ]);
}

function odpTextFrame(item, pageIndex, itemIndex) {
  const x = (item.x * 33.867).toFixed(3);
  const y = (item.y * 19.05).toFixed(3);
  const width = Math.max(0.1, item.width * 33.867).toFixed(3);
  const height = Math.max(0.1, item.height * 19.05).toFixed(3);
  if (item.type === "shape") {
    return `<draw:rect draw:style-name="shape${item.fill.slice(1)}" svg:x="${x}cm" svg:y="${y}cm" svg:width="${width}cm" svg:height="${height}cm"/>`;
  }
  const styleName = `t${pageIndex}_${itemIndex}`;
  const paragraphs = item.text.split("\n").map((line) => `<text:p text:style-name="p${styleName}"><text:span text:style-name="${styleName}">${escapeXml(line)}</text:span></text:p>`).join("");
  return `<draw:frame draw:style-name="textFrame" svg:x="${x}cm" svg:y="${y}cm" svg:width="${width}cm" svg:height="${height}cm"><draw:text-box>${paragraphs}</draw:text-box></draw:frame>`;
}

function createOdp(slideData, template) {
  const pageStyles = slideData.map((slide, index) => `<style:style style:name="dp${index + 1}" style:family="drawing-page"><style:drawing-page-properties draw:fill="solid" draw:fill-color="${slide.background}"/></style:style>`).join("");
  const textStyles = slideData.flatMap((slide, pageIndex) => slide.items.flatMap((item, itemIndex) => {
    if (item.type !== "text") return [];
    const name = `t${pageIndex}_${itemIndex}`;
    const align = item.align === "ctr" ? "center" : item.align === "r" ? "end" : "start";
    return [
      `<style:style style:name="p${name}" style:family="paragraph"><style:paragraph-properties fo:text-align="${align}"/></style:style>`,
      `<style:style style:name="${name}" style:family="text"><style:text-properties fo:font-family="${escapeXml(item.fontFamily)}" fo:font-size="${item.fontSize.toFixed(2)}pt" fo:font-weight="${item.bold ? "bold" : "normal"}" fo:color="${item.color}"/></style:style>`,
    ];
  })).join("");
  const shapeStyles = Array.from(new Set(slideData.flatMap((slide) => slide.items.filter((item) => item.type === "shape").map((item) => item.fill))))
    .map((fill) => `<style:style style:name="shape${fill.slice(1)}" style:family="graphic"><style:graphic-properties draw:fill="solid" draw:fill-color="${fill}" draw:stroke="none"/></style:style>`).join("");
  const graphicStyles = `${shapeStyles}<style:style style:name="textFrame" style:family="graphic"><style:graphic-properties draw:fill="none" draw:stroke="none"/></style:style>`;
  const pages = slideData.map((slide, index) => {
    const pageItems = slide.items.map((item, itemIndex) => odpTextFrame(item, index, itemIndex)).join("");
    return `<draw:page draw:name="${escapeXml(slide.title)}" draw:style-name="dp${index + 1}" draw:master-page-name="Default">${pageItems}</draw:page>`;
  }).join("");
  const content = `<?xml version="1.0" encoding="UTF-8"?><office:document-content xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" xmlns:presentation="urn:oasis:names:tc:opendocument:xmlns:presentation:1.0" office:version="1.3"><office:automatic-styles>${pageStyles}${textStyles}${graphicStyles}</office:automatic-styles><office:body><office:presentation>${pages}</office:presentation></office:body></office:document-content>`;
  const styles = '<?xml version="1.0" encoding="UTF-8"?><office:document-styles xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:presentation="urn:oasis:names:tc:opendocument:xmlns:presentation:1.0" office:version="1.3"><office:styles/><office:automatic-styles><style:page-layout style:name="PM1"><style:page-layout-properties fo:page-width="33.867cm" fo:page-height="19.05cm" style:print-orientation="landscape" presentation:display-header="false" presentation:display-footer="false" presentation:display-page-number="false" presentation:display-date-time="false"/></style:page-layout></office:automatic-styles><office:master-styles><style:master-page style:name="Default" style:page-layout-name="PM1"/></office:master-styles></office:document-styles>';
  const meta = `<?xml version="1.0" encoding="UTF-8"?><office:document-meta xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:dc="http://purl.org/dc/elements/1.1/" office:version="1.3"><office:meta><dc:title>GFS Studio Präsentation</dc:title><dc:language>de-DE</dc:language></office:meta></office:document-meta>`;
  const manifest = `<?xml version="1.0" encoding="UTF-8"?><manifest:manifest xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0" manifest:version="1.3"><manifest:file-entry manifest:full-path="/" manifest:media-type="${template ? "application/vnd.oasis.opendocument.presentation-template" : "application/vnd.oasis.opendocument.presentation"}" manifest:version="1.3"/><manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/><manifest:file-entry manifest:full-path="styles.xml" manifest:media-type="text/xml"/><manifest:file-entry manifest:full-path="meta.xml" manifest:media-type="text/xml"/></manifest:manifest>`;
  const mimetype = template ? "application/vnd.oasis.opendocument.presentation-template" : "application/vnd.oasis.opendocument.presentation";
  return createZip([
    { name: "mimetype", contents: mimetype },
    { name: "content.xml", contents: content },
    { name: "styles.xml", contents: styles },
    { name: "meta.xml", contents: meta },
    { name: "META-INF/manifest.xml", contents: manifest },
  ]);
}

function triggerDownload(bytes, filename, mimeType) {
  const url = URL.createObjectURL(new Blob([bytes], { type: mimeType }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function exportPresentation(format) {
  if (format === "pdf") {
    fileMenu.open = false;
    showStatus("Im Druckdialog „Als PDF speichern“ wählen. Alle Folien werden ausgegeben.");
    window.print();
    return;
  }

  try {
    const data = getExportData();
    const isTemplate = format === "otp";
    const bytes = format === "pptx" ? createPptx(data) : createOdp(data, isTemplate);
    const extension = isTemplate ? "otp" : format;
    const mimeType = format === "pptx"
      ? "application/vnd.openxmlformats-officedocument.presentationml.presentation"
      : isTemplate
        ? "application/vnd.oasis.opendocument.presentation-template"
        : "application/vnd.oasis.opendocument.presentation";
    triggerDownload(bytes, `gfs-praesentation.${extension}`, mimeType);
    fileMenu.open = false;
    exportSaveIndicator.textContent = `${extension.toUpperCase()} heruntergeladen`;
    exportSaveIndicator.dataset.state = "saved";
    showStatus(`${extension.toUpperCase()} exportiert · Texte und Grundformen bleiben editierbar.`);
  } catch (error) {
    console.error(`Die Präsentation konnte nicht als ${format.toUpperCase()} exportiert werden.`, error);
    exportSaveIndicator.textContent = "Export fehlgeschlagen";
    exportSaveIndicator.dataset.state = "error";
    showStatus(`Export fehlgeschlagen: ${error instanceof Error ? error.message : "Datei konnte nicht erstellt werden."}`);
  }
}

function validateProject(project) {
  if (!project || project.app !== "gfs-studio" || project.version !== 1 || !Array.isArray(project.data)) {
    throw new Error("Die Datei ist kein gültiges GFS-Studio-Projekt.");
  }
  if (project.data.length > 300) throw new Error("Das Projekt enthält zu viele Einträge.");
  const textKeys = new Set(editableElements.map((element) => `${STORAGE_PREFIX}${element.dataset.editable}`));
  const validTransitionValues = new Set(Array.from(transitionSelect.options, (option) => option.value));
  const dynamicSlidesEntry = project.data.find((entry) => entry?.key === DYNAMIC_SLIDES_KEY);
  let dynamicSlideCount = 0;
  if (dynamicSlidesEntry) {
    const specs = JSON.parse(dynamicSlidesEntry.value);
    if (!Array.isArray(specs) || specs.length > 40 ||
      !specs.every((spec) => spec && typeof spec.id === "string" && spec.id.length <= 100 && SLIDE_LAYOUTS.some((layout) => layout.id === spec.layoutId))) {
      throw new Error("Das Projekt enthält ungültige Folienvorlagen.");
    }
    dynamicSlideCount = specs.length;
  }

  for (const entry of project.data) {
    if (!entry || typeof entry.key !== "string" || typeof entry.value !== "string") {
      throw new Error("Das Projekt enthält einen ungültigen Eintrag.");
    }
    if (entry.key.startsWith(`${STORAGE_PREFIX}nim:`)) {
      throw new Error("NVIDIA-Zugangsdaten und KI-Einstellungen dürfen nicht aus Projektdateien importiert werden.");
    }
    const transitionMatch = entry.key.match(/^gfs-studio:transition:(\d+)$/);
    const elementMatch = entry.key.match(/^gfs-studio:elements:(\d+)$/);
    if (entry.key === TEMPLATE_STORAGE_KEY) {
      if (!TEMPLATE_IDS.includes(entry.value)) throw new Error("Das Projekt enthält ein unbekanntes Design.");
    } else if (entry.key === DYNAMIC_SLIDES_KEY) {
      JSON.parse(entry.value);
    } else if (textKeys.has(entry.key)) {
      if (entry.value.length > 10000) throw new Error("Ein gespeicherter Text ist zu lang.");
    } else if (transitionMatch) {
      if (Number(transitionMatch[1]) >= STATIC_SLIDE_COUNT + dynamicSlideCount || !validTransitionValues.has(entry.value)) {
        throw new Error("Das Projekt enthält einen ungültigen Folienübergang.");
      }
    } else if (elementMatch) {
      if (Number(elementMatch[1]) >= STATIC_SLIDE_COUNT + dynamicSlideCount) throw new Error("Das Projekt enthält eine unbekannte Folie.");
      const elements = JSON.parse(entry.value);
      if (!Array.isArray(elements) || elements.length > 50 || !elements.every(isValidElement) ||
        new Set(elements.map((element) => element.id)).size !== elements.length) {
        throw new Error("Das Projekt enthält ungültige Folienelemente.");
      }
    } else {
      throw new Error("Das Projekt enthält nicht unterstützte Daten.");
    }
  }
}

async function importProject(file) {
  try {
    if (file.size > MAX_PROJECT_SIZE) throw new Error("Projektdateien dürfen maximal 4 MB groß sein.");
    const project = JSON.parse(await file.text());
    validateProject(project);
    const previousData = Object.keys(localStorage)
      .filter((key) => key.startsWith(STORAGE_PREFIX))
      .map((key) => [key, localStorage.getItem(key)]);
    try {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith(STORAGE_PREFIX)) localStorage.removeItem(key);
      }
      project.data.forEach(({ key, value }) => localStorage.setItem(key, value));
    } catch (error) {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith(STORAGE_PREFIX)) localStorage.removeItem(key);
      }
      previousData.forEach(([key, value]) => localStorage.setItem(key, value));
      throw error;
    }
    location.reload();
  } catch (error) {
    console.error("Das Projekt konnte nicht geladen werden.", error);
    showStatus(error instanceof Error ? error.message : "Das Projekt konnte nicht geladen werden.");
  } finally {
    projectFileInput.value = "";
  }
}

async function togglePresentationMode() {
  if (document.body.classList.contains("is-presenting")) {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      document.body.classList.remove("is-presenting");
    }
    return;
  }

  if (editing) setEditing(false);
  if (!elementPanel.hidden) setElementPanelOpen(false);
  document.body.classList.add("is-presenting");
  try {
    if (stage.requestFullscreen) await stage.requestFullscreen();
    showStatus("Präsentationsmodus · ← → navigieren · Esc zum Beenden");
  } catch (error) {
    console.error("Vollbild konnte nicht gestartet werden; Präsentationsmodus bleibt aktiv.", error);
    showStatus("Präsentationsmodus · ← → navigieren · Esc zum Beenden");
  }
}

function setModelControlsEnabled(enabled) {
  modelControls.forEach((control) => {
    control.disabled = !enabled;
  });
  removeModelButton.disabled = !enabled;
}

function initializeModelViewer() {
  setModelControlsEnabled(false);
  const isSupported = customElements.get("model-viewer");
  modelUploadButton.disabled = !isSupported;
  modelEmptyButton.disabled = !isSupported;
  if (!isSupported) {
    modelStatus.textContent = "3D-Ansicht konnte nicht geladen werden. Prüfe deine Internetverbindung.";
    showStatus("Die 3D-Bibliothek ist nicht verfügbar.");
    return;
  }
  modelStatus.textContent = "";
}

function openModelPicker() {
  if (!modelUploadButton.disabled) modelFileInput.click();
}

async function validateGlb(file) {
  if (!file.name.toLowerCase().endsWith(".glb")) {
    throw new Error("Bitte eine GLB-Datei auswählen. GLB ist das kompakte Binärformat von glTF.");
  }
  if (file.size < 20) {
    throw new Error("Die Datei ist zu klein, um ein gültiges GLB-Modell zu sein.");
  }
  if (file.size > MAX_MODEL_SIZE) {
    throw new Error("Das Modell ist größer als 150 MB. Bitte wähle eine kleinere GLB-Datei.");
  }

  const header = await file.slice(0, 12).arrayBuffer();
  const view = new DataView(header);
  if (view.getUint32(0, true) !== 0x46546c67 || view.getUint32(4, true) !== 2) {
    throw new Error("Die Datei hat keinen gültigen GLB-Header (glTF 2.0).");
  }
  if (view.getUint32(8, true) !== file.size) {
    throw new Error("Die Dateilänge stimmt nicht mit dem GLB-Header überein.");
  }
}

async function importModel(file) {
  try {
    await validateGlb(file);
  } catch (error) {
    modelStatus.textContent = error.message;
    showStatus(error.message);
    modelFileInput.value = "";
    return;
  }

  if (pendingModelUrl) URL.revokeObjectURL(pendingModelUrl);
  const loadId = ++modelLoadId;
  const nextUrl = URL.createObjectURL(file);
  const previousUrl = modelObjectUrl;
  const previousFileName = modelFileName.textContent;
  pendingModelUrl = nextUrl;
  const hasPreviousModel = Boolean(previousUrl);

  modelEmptyState.hidden = hasPreviousModel;
  modelViewer.hidden = false;
  modelStatus.textContent = `Lade ${file.name} …`;
  modelFileName.textContent = file.name;
  modelUploadButton.disabled = true;
  modelEmptyButton.disabled = true;
  setModelControlsEnabled(false);

  const finishLoading = () => {
    modelViewer.removeEventListener("load", onLoad);
    modelViewer.removeEventListener("error", onError);
  };
  const onLoad = () => {
    finishLoading();
    if (loadId !== modelLoadId) {
      URL.revokeObjectURL(nextUrl);
      return;
    }
    modelObjectUrl = nextUrl;
    pendingModelUrl = null;
    if (previousUrl) URL.revokeObjectURL(previousUrl);
    modelViewer.hidden = false;
    modelEmptyState.hidden = true;
    modelStatus.textContent = `Modell geladen · ${file.name}`;
    removeModelButton.hidden = false;
    modelUploadButton.disabled = false;
    modelEmptyButton.disabled = false;
    setModelControlsEnabled(true);
    showStatus(`3D-Modell geladen: ${file.name}.`);
  };
  const onError = () => {
    finishLoading();
    if (loadId !== modelLoadId) {
      URL.revokeObjectURL(nextUrl);
      return;
    }
    URL.revokeObjectURL(nextUrl);
    pendingModelUrl = null;
    modelViewer.src = previousUrl || "";
    modelViewer.hidden = !hasPreviousModel;
    modelEmptyState.hidden = hasPreviousModel;
    modelFileName.textContent = hasPreviousModel ? previousFileName : "Noch kein Modell geladen";
    modelStatus.textContent = `Modell konnte nicht gelesen werden: ${file.name}`;
    modelUploadButton.disabled = false;
    modelEmptyButton.disabled = false;
    setModelControlsEnabled(hasPreviousModel);
    showStatus("Das GLB-Modell konnte nicht gelesen werden.");
  };

  modelViewer.addEventListener("load", onLoad);
  modelViewer.addEventListener("error", onError);
  modelViewer.src = nextUrl;
  modelFileInput.value = "";
}

function removeModel() {
  modelLoadId += 1;
  if (pendingModelUrl) URL.revokeObjectURL(pendingModelUrl);
  if (modelObjectUrl) URL.revokeObjectURL(modelObjectUrl);
  pendingModelUrl = null;
  modelObjectUrl = null;
  modelViewer.src = "";
  modelViewer.hidden = true;
  modelEmptyState.hidden = false;
  modelFileName.textContent = "Noch kein Modell geladen";
  modelStatus.textContent = "";
  removeModelButton.hidden = true;
  setModelControlsEnabled(false);
  showStatus("3D-Modell entfernt.");
}

function showStatus(message) {
  statusMessage.textContent = message;
}

function setSlide(index) {
  if (index < 0 || index >= slides.length || index === activeIndex) return;

  if (activeIndex >= 0) {
    slides[activeIndex].hidden = true;
    slides[activeIndex].classList.remove("is-entering");
    selectedElementId = null;
  }
  activeIndex = index;
  chatContext.textContent = `KONTEXT · FOLIE ${String(activeIndex + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
  const activeSlide = slides[activeIndex];
  activeSlide.hidden = false;
  activeSlide.dataset.transition = getSlideTransition(activeIndex);
  transitionSelect.value = activeSlide.dataset.transition;
  void activeSlide.offsetWidth;
  activeSlide.classList.add("is-entering");
  renderSlideElements(activeIndex);

  updateSlideNavigation();
  dotsContainer.querySelectorAll(".slide-dot").forEach((dot, dotIndex) => {
    if (dotIndex === activeIndex) {
      dot.setAttribute("aria-current", "true");
    } else {
      dot.removeAttribute("aria-current");
    }
  });
}

function createSlideDots() {
  slides.forEach((_, index) => createSlideDot(index));
}

function loadSavedText() {
  try {
    editableElements.forEach((element) => {
      const savedText = localStorage.getItem(`${STORAGE_PREFIX}${element.dataset.editable}`);
      if (savedText !== null) element.textContent = savedText;
    });
  } catch (error) {
    console.error("Gespeicherte Präsentationstexte konnten nicht geladen werden.", error);
    showStatus("Gespeicherte Texte konnten nicht geladen werden.");
  }
}

function getSlideTransition(index) {
  try {
    const savedTransition = localStorage.getItem(`${TRANSITION_STORAGE_PREFIX}${index}`);
    const isAvailable = Array.from(transitionSelect.options).some((option) => option.value === savedTransition);
    return isAvailable ? savedTransition : "cut";
  } catch (error) {
    console.error(`Der Übergang von Folie ${index + 1} konnte nicht geladen werden.`, error);
    return "cut";
  }
}

function getDynamicSlideSpecs() {
  try {
    const specs = JSON.parse(localStorage.getItem(DYNAMIC_SLIDES_KEY) || "[]");
    return Array.isArray(specs) ? specs : [];
  } catch (error) {
    console.error("Folienvorlagen konnten nicht geladen werden.", error);
    return [];
  }
}

function loadSavedSettings() {
  try {
    const savedTemplate = localStorage.getItem(TEMPLATE_STORAGE_KEY);
    const isAvailable = Array.from(templateSelect.options).some((option) => option.value === savedTemplate);
    if (isAvailable) {
      templateSelect.value = savedTemplate;
      stage.dataset.template = savedTemplate;
    }
  } catch (error) {
    console.error("Das gespeicherte Präsentationsdesign konnte nicht geladen werden.", error);
    showStatus("Das gespeicherte Präsentationsdesign konnte nicht geladen werden.");
  }
}

function setEditing(enabled) {
  editing = enabled;
  editButton.setAttribute("aria-pressed", String(enabled));
  editLabel.textContent = enabled ? "Bearbeiten beenden" : "Texte bearbeiten";
  editableElements.forEach((element) => {
    element.contentEditable = String(enabled);
    element.spellcheck = enabled;
  });
  document.body.classList.toggle("is-editing", enabled);
  showStatus(enabled ? "Texte direkt anklicken und überschreiben. Änderungen werden lokal gespeichert." : "Bearbeitung beendet.");
  if (enabled) {
    const firstVisibleEditable = slides[activeIndex].querySelector("[data-editable]");
    firstVisibleEditable?.focus();
  }
}

function saveText(element) {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${element.dataset.editable}`, element.textContent);
    saveIndicator.textContent = "Automatisch gespeichert";
    saveIndicator.dataset.state = "saved";
    showStatus("Änderung gespeichert.");
  } catch (error) {
    console.error("Die Präsentationstexte konnten nicht gespeichert werden.", error);
    saveIndicator.textContent = "Speichern fehlgeschlagen · Projekt exportieren";
    saveIndicator.dataset.state = "error";
    showStatus("Speichern nicht möglich. Prüfe die Speichereinstellungen deines Browsers.");
  }
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    if (!stage.requestFullscreen) {
      showStatus("Vollbild wird von diesem Browser nicht unterstützt.");
      return;
    }
    await stage.requestFullscreen();
  } catch (error) {
    console.error("Der Vollbildmodus konnte nicht geändert werden.", error);
    showStatus("Vollbild konnte nicht gestartet werden.");
  }
}

loadDynamicSlides();
createSlideDots();
renderLayoutGallery();
editableElements.forEach((element) => {
  element.dataset.defaultText = element.textContent;
});
loadSavedText();
loadSavedSettings();
initializeModelViewer();
slides.forEach((slide, index) => renderSlideElements(index));
setSlide(0);
initializeAiAssistant();

previousButton.addEventListener("click", () => setSlide(activeIndex - 1));
nextButton.addEventListener("click", () => setSlide(activeIndex + 1));
editButton.addEventListener("click", () => setEditing(!editing));
elementsToggle.addEventListener("click", () => setElementPanelOpen(elementPanel.hidden));
panelClose.addEventListener("click", () => setElementPanelOpen(false));
nimSettingsToggle.addEventListener("click", openNimSettings);
nimInlineSettings.addEventListener("click", openNimSettings);
nimSettingsClose.addEventListener("click", () => nimSettingsDialog.close());
nimSettingsForm.addEventListener("submit", saveNimSettings);
nimClearKeyButton.addEventListener("click", clearNimApiKey);
nimTemperatureInput.addEventListener("input", () => {
  nimTemperatureValue.value = Number(nimTemperatureInput.value).toFixed(1);
});
exportFormatButtons.forEach((button) => {
  button.addEventListener("click", () => exportPresentation(button.dataset.exportFormat));
});
assistantToggle.addEventListener("click", () => setAssistantPanelOpen(assistantPanel.hidden));
assistantTabs.forEach((tab) => tab.addEventListener("click", () => setAssistantTab(tab)));
chatForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  chatInput.value = "";
  void sendAiMessage(text);
});
chatClearButton.addEventListener("click", clearChat);
chatQuickPrompts.forEach((button) => {
  button.addEventListener("click", () => void sendAiMessage(button.dataset.chatPrompt));
});
chatInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    chatForm.requestSubmit();
  }
});
checkSlideButton.addEventListener("click", () => void checkCurrentSlide());
deleteSlideButton.addEventListener("click", () => {
  if (activeIndex < STATIC_SLIDE_COUNT) return;
  const deletedIndex = activeIndex;
  const specs = getDynamicSlideSpecs();
  const dynamicIndex = deletedIndex - STATIC_SLIDE_COUNT;
  if (!specs[dynamicIndex]) return;
  specs.splice(dynamicIndex, 1);
  try {
    const lastIndex = slides.length - 1;
    for (let index = deletedIndex + 1; index <= lastIndex; index += 1) {
      const elements = localStorage.getItem(`${STORAGE_PREFIX}elements:${index}`);
      const transition = localStorage.getItem(`${TRANSITION_STORAGE_PREFIX}${index}`);
      if (elements !== null) localStorage.setItem(`${STORAGE_PREFIX}elements:${index - 1}`, elements);
      else localStorage.removeItem(`${STORAGE_PREFIX}elements:${index - 1}`);
      if (transition !== null) localStorage.setItem(`${TRANSITION_STORAGE_PREFIX}${index - 1}`, transition);
      else localStorage.removeItem(`${TRANSITION_STORAGE_PREFIX}${index - 1}`);
    }
    localStorage.removeItem(`${STORAGE_PREFIX}elements:${lastIndex}`);
    localStorage.removeItem(`${TRANSITION_STORAGE_PREFIX}${lastIndex}`);
    localStorage.setItem(DYNAMIC_SLIDES_KEY, JSON.stringify(specs));
    slides[deletedIndex].remove();
    slides.splice(deletedIndex, 1);
    slides.forEach((slide, index) => {
      const dot = dotsContainer.children[index];
      if (dot) dot.setAttribute("aria-label", `Zu Folie ${index + 1}`);
    });
    dotsContainer.replaceChildren();
    createSlideDots();
    selectedElementId = null;
    activeIndex = -1;
    setSlide(Math.min(deletedIndex, slides.length - 1));
    showStatus("Zusatzfolie gelöscht.");
  } catch (error) {
    console.error("Die Zusatzfolie konnte nicht gelöscht werden.", error);
    showStatus("Die Zusatzfolie konnte nicht gelöscht werden.");
  }
});
addVideoButton.addEventListener("click", () => {
  const url = window.prompt("YouTube- oder Vimeo-Link einfügen:");
  if (!url) return;
  try {
    addElement("video", { src: getEmbedUrl(url), width: 52 });
  } catch (error) {
    showStatus(error instanceof Error ? error.message : "Der Video-Link ist ungültig.");
  }
});
addTextButton.addEventListener("click", () => addElement("text", { text: "Doppelklicken zum Bearbeiten", size: 3 }));
addShapeButton.addEventListener("click", () => addElement("shape", { shape: "rectangle", height: 18 }));
addImageButton.addEventListener("click", () => imageFileInput.click());
imageFileInput.addEventListener("change", async () => {
  const [file] = imageFileInput.files;
  if (!file) return;
  try {
    const src = await imageToDataUrl(file);
    addElement("image", { src, alt: file.name.slice(0, 120), width: 32 });
  } catch (error) {
    console.error("Das Bild konnte nicht eingefügt werden.", error);
    showStatus(error instanceof Error ? error.message : "Das Bild konnte nicht eingefügt werden.");
  } finally {
    imageFileInput.value = "";
  }
});
elementColor.addEventListener("input", () => updateSelectedElement({ color: elementColor.value }));
elementShapeType.addEventListener("change", () => updateSelectedElement({ shape: elementShapeType.value }));
elementFontSize.addEventListener("input", () => updateSelectedElement({ size: Number(elementFontSize.value) }));
elementFontFamily.addEventListener("change", () => updateSelectedElement({ family: elementFontFamily.value }));
elementTextAlign.addEventListener("change", () => updateSelectedElement({ align: elementTextAlign.value }));
elementBoldButton.addEventListener("click", () => {
  const selected = getSlideElements(activeIndex).find((item) => item.id === selectedElementId);
  if (selected?.type === "text") updateSelectedElement({ bold: !selected.bold });
});
elementWidth.addEventListener("input", () => updateSelectedElement({ width: Number(elementWidth.value) }));
deleteElementButton.addEventListener("click", deleteSelectedElement);
exportProjectButton.addEventListener("click", exportProject);
importProjectButton.addEventListener("click", () => projectFileInput.click());
projectFileInput.addEventListener("change", () => {
  const [file] = projectFileInput.files;
  if (file) void importProject(file);
});
presentButton.addEventListener("click", () => void togglePresentationMode());
resetButton.addEventListener("click", () => {
  if (!window.confirm("Texte, eigene Elemente, Vorlagen und alle Einstellungen zurücksetzen?")) return;
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(STORAGE_PREFIX))
      .forEach((key) => localStorage.removeItem(key));
    sessionStorage.removeItem(NIM_API_KEY_KEY);
    location.reload();
  } catch (error) {
    console.error("Die Vorlage konnte nicht zurückgesetzt werden.", error);
    showStatus("Die Vorlage konnte nicht zurückgesetzt werden.");
  }
});
fullscreenButton.addEventListener("click", toggleFullscreen);
modelUploadButton.addEventListener("click", openModelPicker);
modelEmptyButton.addEventListener("click", openModelPicker);
modelFileInput.addEventListener("change", () => {
  const [file] = modelFileInput.files;
  if (file) void importModel(file);
});
removeModelButton.addEventListener("click", removeModel);
rotateButton.addEventListener("click", () => {
  const shouldRotate = !modelViewer.hasAttribute("auto-rotate");
  modelViewer.toggleAttribute("auto-rotate", shouldRotate);
  rotateButton.setAttribute("aria-pressed", String(shouldRotate));
  rotateState.textContent = shouldRotate ? "AN" : "AUS";
});
resetCameraButton.addEventListener("click", () => {
  modelViewer.cameraOrbit = "0deg 75deg auto";
  modelViewer.cameraTarget = "auto";
  modelViewer.fieldOfView = "auto";
  modelViewer.jumpCameraToGoal();
});
exposureControl.addEventListener("input", () => {
  const exposure = Number(exposureControl.value);
  modelViewer.exposure = exposure;
  exposureValue.value = exposure.toFixed(1);
});
shadowControl.addEventListener("input", () => {
  const intensity = Number(shadowControl.value);
  modelViewer.shadowIntensity = intensity;
  shadowValue.value = intensity.toFixed(1);
});
modelDropZone.addEventListener("dragover", (event) => {
  event.preventDefault();
  modelDropZone.classList.add("is-dragging");
});
modelDropZone.addEventListener("dragleave", (event) => {
  if (!modelDropZone.contains(event.relatedTarget)) {
    modelDropZone.classList.remove("is-dragging");
  }
});
modelDropZone.addEventListener("drop", (event) => {
  event.preventDefault();
  modelDropZone.classList.remove("is-dragging");
  const [file] = event.dataTransfer.files;
  if (file) void importModel(file);
});
transitionSelect.addEventListener("change", () => {
  applySlideTransition(transitionSelect.value);
});
templateSelect.addEventListener("change", () => {
  applyPresentationDesign(templateSelect.value);
});

editableElements.forEach((element) => {
  element.addEventListener("input", () => saveText(element));
  element.addEventListener("keydown", (event) => {
    if (event.key === "Enter") event.preventDefault();
  });
});

document.addEventListener("fullscreenchange", () => {
  const isFullscreen = document.fullscreenElement === stage;
  fullscreenButton.setAttribute("aria-label", isFullscreen ? "Vollbild beenden" : "Vollbild starten");
  if (!isFullscreen && document.body.classList.contains("is-presenting")) {
    document.body.classList.remove("is-presenting");
  }
});

window.addEventListener("pagehide", () => {
  if (pendingModelUrl) URL.revokeObjectURL(pendingModelUrl);
  if (modelObjectUrl) URL.revokeObjectURL(modelObjectUrl);
});

document.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === "Escape" && document.body.classList.contains("is-presenting")) {
    if (document.fullscreenElement === stage) void document.exitFullscreen();
    else document.body.classList.remove("is-presenting");
    return;
  }
  if (event.target instanceof Element && event.target.closest("model-viewer")) return;
  if (event.target instanceof HTMLElement && (event.target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName))) {
    return;
  }

  if (event.key.toLowerCase() === "p") {
    void togglePresentationMode();
    return;
  }
  if (event.key === "Delete" && selectedElementId && !elementPanel.hidden) {
    deleteSelectedElement();
    return;
  }

  if (event.key === "ArrowRight" || event.key === "PageDown" || event.key === " ") {
    event.preventDefault();
    setSlide(activeIndex + 1);
  } else if (event.key === "ArrowLeft" || event.key === "PageUp") {
    event.preventDefault();
    setSlide(activeIndex - 1);
  } else if (event.key === "Home") {
    setSlide(0);
  } else if (event.key === "End") {
    setSlide(slides.length - 1);
  } else if (event.key.toLowerCase() === "f") {
    void toggleFullscreen();
  } else if (event.key === "Escape" && editing) {
    setEditing(false);
  }
});
