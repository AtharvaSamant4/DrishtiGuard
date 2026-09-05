"use strict";

const SESSION_TTL_MS = 2 * 60 * 1000;
const MAX_SESSIONS = 8;
const sessions = new Map();

const PII_PATTERNS = [
  { type: "EMAIL", regex: /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi },
  { type: "PAN", regex: /\b[A-Z]{5}[0-9]{4}[A-Z]\b/gi },
  { type: "AADHAAR", regex: /\b[2-9][0-9]{3}[\s-]?[0-9]{4}[\s-]?[0-9]{4}\b/g },
  { type: "IFSC", regex: /\b[A-Z]{4}0[A-Z0-9]{6}\b/gi },
  { type: "PHONE", regex: /\b(?:\+?91[\s-]?)?[6-9][0-9]{9}\b/g },
  { type: "ACCOUNT_OR_CARD", regex: /\b(?:[0-9][\s-]?){13,19}\b/g },
  { type: "DOB", regex: /\b(?:0?[1-9]|[12][0-9]|3[01])[\/-](?:0?[1-9]|1[0-2])[\/-](?:19|20)[0-9]{2}\b/g }
];

const SENSITIVE_METADATA = /(full[\s_\-]*name|(?:user|employee|claimant|passenger)?[\s_\-]*name|claimant|identity|avatar|face|portrait|profile[\s_\-]*photo|employee[\s_\-]*(?:id|code)|pan(?:[\s_\-]*number)?|aadhaar|aadhar|address|e-?mail|phone|mobile|bank|account|ifsc|card|passport|date[\s_\-]*of[\s_\-]*birth|dob|tax[\s_\-]*id|beneficiary)/i;
const PROMPT_INJECTION = /ignore\s+(?:all\s+)?(?:previous|prior|system|developer)\s+instructions|reveal\s+(?:the\s+)?(?:system\s+)?prompt|act\s+as\s+(?:an?\s+)?(?:unrestricted|different)|bypass\s+(?:the\s+)?(?:privacy|safety|policy)|send\s+(?:all\s+)?(?:private|sensitive|secret)\s+(?:data|information)/i;
const FORBIDDEN_KEYS = new Set([
  "authorization", "canary", "cookie", "dataurl", "documenttext", "href",
  "html", "imagedata", "innerhtml", "outerhtml", "raw", "rawtext",
  "screenshot", "secret", "selector", "src", "url", "value"
]);

chrome.runtime.onInstalled.addListener(() => {
  if (chrome.sidePanel && chrome.sidePanel.setPanelBehavior) {
    void chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch(() => undefined);
  }
});

chrome.action.onClicked.addListener((tab) => {
  if (!tab || typeof tab.id !== "number" || !chrome.sidePanel || !chrome.sidePanel.open) {
    return;
  }
  void chrome.sidePanel.open({ tabId: tab.id }).catch(() => undefined);
});

chrome.tabs.onRemoved.addListener((tabId) => {
  for (const [sessionId, session] of sessions.entries()) {
    if (session.tabId === tabId) {
      sessions.delete(sessionId);
    }
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!sender || sender.id !== chrome.runtime.id) {
    sendResponse({ ok: false, error: publicFailure("UNTRUSTED_SENDER") });
    return false;
  }

  handleMessage(message)
    .then((result) => sendResponse({ ok: true, ...result }))
    .catch((error) => sendResponse({ ok: false, error: publicFailure(error && error.code) }));
  return true;
});

async function handleMessage(message) {
  pruneSessions();
  if (!message || typeof message.type !== "string") {
    throw failure("INVALID_REQUEST");
  }

  if (message.type === "SCAN_ACTIVE_TAB") {
    return scanActiveTab();
  }
  if (message.type === "EXECUTE_ACTION") {
    return executeAction(message);
  }
  if (message.type === "DISCARD_SESSION") {
    if (typeof message.sessionId === "string") {
      sessions.delete(message.sessionId);
    }
    return { discarded: true };
  }
  throw failure("UNSUPPORTED_REQUEST");
}

async function scanActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || typeof tab.id !== "number" || typeof tab.windowId !== "number") {
    throw failure("NO_ACTIVE_TAB");
  }
  if (!isSupportedPage(tab.url)) {
    throw failure("UNSUPPORTED_PAGE");
  }

  const taskNonce = randomToken(18);
  let injectionResults;
  try {
    injectionResults = await chrome.scripting.executeScript({
      target: { tabId: tab.id, frameIds: [0] },
      func: collectPageSnapshot,
      args: [taskNonce]
    });
  } catch (_error) {
    throw failure("PAGE_ACCESS_DENIED");
  }

  const snapshot = injectionResults && injectionResults[0] && injectionResults[0].result;
  if (!snapshot || !Array.isArray(snapshot.nodes) || !snapshot.viewport) {
    throw failure("CAPTURE_FAILED");
  }

  let originalScreenshot;
  try {
    originalScreenshot = await chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" });
  } catch (_error) {
    throw failure("SCREENSHOT_FAILED");
  }
  if (typeof originalScreenshot !== "string" || !originalScreenshot.startsWith("data:image/png;base64,")) {
    throw failure("SCREENSHOT_FAILED");
  }

  const analysis = analyzeSnapshot(snapshot, taskNonce);
  const serializedPayload = stableStringify(analysis.outboundPayload);
  const verification = verifySerializedPayload(
    serializedPayload,
    analysis.canaries,
    analysis.coverageGaps,
    snapshot.truncated
  );
  const payloadDigest = await sha256Hex(serializedPayload);
  const sessionId = `task_${taskNonce}`;
  const promptInjectionDetected = PROMPT_INJECTION.test(snapshot.documentText || "");

  let action = null;
  let decision = "READY";
  if (snapshot.truncated) {
    decision = "BLOCKED_TRUNCATED_CAPTURE";
  } else if (analysis.coverageGaps.length > 0) {
    decision = "BLOCKED_COVERAGE_GAP";
  } else if (!verification.passed) {
    decision = "BLOCKED_PRIVACY_VERIFICATION";
  } else if (promptInjectionDetected) {
    decision = "BLOCKED_PROMPT_INJECTION";
  } else if (analysis.preferredTarget) {
    action = {
      operation: "CLICK",
      target: analysis.preferredTarget.opaqueId,
      label: analysis.preferredTarget.safeLabel || "Submit claim",
      risk: analysis.preferredTarget.submitLike ? "SUBMISSION" : "NAVIGATION",
      requiresConfirmation: Boolean(analysis.preferredTarget.submitLike)
    };
  } else {
    decision = "NO_SAFE_ACTION";
  }

  const localTargets = new Map();
  for (const node of analysis.localNodes) {
    localTargets.set(node.opaqueId, {
      selector: node.selector,
      tag: node.tag,
      inputType: node.inputType,
      identityText: node.identityText,
      bounds: node.bounds,
      submitLike: node.submitLike
    });
  }

  sessions.set(sessionId, {
    createdAt: Date.now(),
    tabId: tab.id,
    expectedUrl: snapshot.url,
    navigationTimeOrigin: snapshot.navigationTimeOrigin,
    pageFingerprint: snapshot.pageFingerprint,
    payloadDigest,
    action,
    localTargets,
    used: false
  });
  trimSessions();

  return {
    sessionId,
    decision,
    capturedAt: new Date().toISOString(),
    screenshotDataUrl: originalScreenshot,
    maskBoxes: analysis.maskBoxes,
    viewport: snapshot.viewport,
    serializedPayload,
    payloadDigest,
    verification,
    action,
    metrics: {
      visibleNodes: snapshot.nodes.length,
      sensitiveRegions: analysis.sensitiveRegionCount,
      visualMediaRegions: analysis.mediaRegionCount,
      outboundNodes: analysis.outboundPayload.sceneGraph.nodes.length,
      outboundBytes: new TextEncoder().encode(serializedPayload).byteLength,
      unknownCoverage: analysis.coverageGaps.length,
      promptInjectionDetected
    }
  };
}

async function executeAction(message) {
  if (
    typeof message.sessionId !== "string" ||
    typeof message.payloadDigest !== "string" ||
    !message.action ||
    message.action.operation !== "CLICK" ||
    typeof message.action.target !== "string"
  ) {
    throw failure("INVALID_ACTION");
  }

  const session = sessions.get(message.sessionId);
  if (!session || Date.now() - session.createdAt > SESSION_TTL_MS) {
    sessions.delete(message.sessionId);
    throw failure("SESSION_EXPIRED");
  }
  if (session.used) {
    throw failure("ACTION_REPLAYED");
  }
  if (!session.action || session.action.operation !== "CLICK") {
    throw failure("NO_APPROVED_ACTION");
  }
  if (
    message.payloadDigest !== session.payloadDigest ||
    message.action.target !== session.action.target ||
    message.action.risk !== session.action.risk
  ) {
    throw failure("ACTION_BINDING_MISMATCH");
  }

  const expectedTarget = session.localTargets.get(message.action.target);
  if (!expectedTarget) {
    throw failure("TARGET_NOT_FOUND");
  }
  if (expectedTarget.submitLike && message.userConfirmed !== true) {
    throw failure("CONFIRMATION_REQUIRED");
  }

  const tab = await chrome.tabs.get(session.tabId);
  if (!tab || tab.active !== true || tab.url !== session.expectedUrl) {
    sessions.delete(message.sessionId);
    throw failure("PAGE_CHANGED");
  }

  session.used = true;
  let results;
  try {
    results = await chrome.scripting.executeScript({
      target: { tabId: session.tabId, frameIds: [0] },
      func: revalidateAndClick,
      args: [{
        url: session.expectedUrl,
        navigationTimeOrigin: session.navigationTimeOrigin,
        pageFingerprint: session.pageFingerprint,
        target: expectedTarget
      }]
    });
  } catch (_error) {
    sessions.delete(message.sessionId);
    throw failure("EXECUTION_FAILED");
  }

  sessions.delete(message.sessionId);
  const result = results && results[0] && results[0].result;
  if (!result || result.ok !== true) {
    const allowedCodes = new Set([
      "PAGE_CHANGED", "TARGET_MISSING", "TARGET_CHANGED", "TARGET_DISABLED", "TARGET_NOT_VISIBLE"
    ]);
    throw failure(allowedCodes.has(result && result.code) ? result.code : "EXECUTION_FAILED");
  }
  return { executed: true, operation: "CLICK" };
}

function analyzeSnapshot(snapshot, taskNonce) {
  const canaries = new Set();
  const maskBoxes = [];
  const maskedKeys = new Set();
  const localNodes = [];
  const outboundNodes = [];
  const coveredCanaries = new Set();
  let sensitiveRegionCount = 0;
  let mediaRegionCount = 0;

  const documentMatches = extractMatches(snapshot.documentText || "");
  for (const match of documentMatches) {
    canaries.add(match.value);
  }

  for (const node of snapshot.nodes) {
    const combined = [
      node.text, node.accessibleName, node.value, node.metadata, node.autocomplete
    ].filter(Boolean).join(" ");
    const matches = extractMatches(combined);
    const sensitiveMetadata = SENSITIVE_METADATA.test(`${node.metadata || ""} ${node.accessibleName || ""}`);
    const sensitiveType = ["email", "tel", "password"].includes(node.inputType);
    const explicitlySensitive = node.explicitlySensitive === true;
    const isSensitive = matches.length > 0 || sensitiveMetadata || sensitiveType || explicitlySensitive;
    const isMedia = Boolean(node.mediaKind);

    for (const match of matches) {
      canaries.add(match.value);
      coveredCanaries.add(normalizeCanary(match.value));
    }
    if (isSensitive && typeof node.value === "string" && node.value.trim().length >= 3) {
      canaries.add(node.value.trim());
      coveredCanaries.add(normalizeCanary(node.value.trim()));
    }

    if (isSensitive) {
      sensitiveRegionCount += 1;
      addMask(maskBoxes, maskedKeys, node.bounds, "SENSITIVE");
    }
    if (isMedia) {
      mediaRegionCount += 1;
      addMask(maskBoxes, maskedKeys, node.bounds, "VISUAL_MEDIA");
    }

    if (!node.interactive || isMedia) {
      continue;
    }

    const opaqueId = `el_${randomToken(12)}`;
    const safeLabel = safeInteractiveLabel(node, isSensitive);
    const role = normalizeRole(node.role, node.tag, node.inputType);
    const localNode = {
      opaqueId,
      selector: node.selector,
      tag: node.tag,
      inputType: node.inputType,
      identityText: normalizeIdentity(node.accessibleName || node.text || ""),
      bounds: node.bounds,
      submitLike: Boolean(node.submitLike),
      safeLabel,
      disabled: Boolean(node.disabled),
      isSensitive
    };
    localNodes.push(localNode);
    outboundNodes.push({
      opaqueId,
      role,
      label: safeLabel,
      disabled: Boolean(node.disabled),
      bounds: normalizeBounds(node.bounds, snapshot.viewport),
      allowedOperations: node.disabled || isSensitive ? [] : ["CLICK"]
    });
  }

  const coverageGaps = documentMatches
    .filter((match) => !coveredCanaries.has(normalizeCanary(match.value)))
    .map((match) => match.type);

  const preferredTarget = localNodes.find((node) =>
    !node.disabled && !node.isSensitive && node.submitLike && /submit|send|confirm|file claim/i.test(node.safeLabel)
  ) || localNodes.find((node) =>
    !node.disabled && !node.isSensitive && /review|continue|next|run privacy pipeline/i.test(node.safeLabel)
  ) || null;

  const outboundPayload = {
    schemaVersion: "1.0",
    task: {
      purpose: "review_and_submit_travel_claim",
      nonce: taskNonce
    },
    sourceDescriptor: {
      scheme: snapshot.scheme,
      pathDepth: snapshot.pathDepth,
      viewportClass: viewportClass(snapshot.viewport.width)
    },
    privacyManifest: {
      policy: "DOM_PATTERN_UNION_MEDIA_MASK_V1",
      sensitiveRegionsMasked: sensitiveRegionCount,
      visualMediaRegionsMasked: mediaRegionCount,
      unknownCoverage: coverageGaps.length,
      bitmapTransmission: "OMITTED_LOCAL_PREVIEW_ONLY"
    },
    page: {
      title: "OMITTED_BY_POLICY",
      language: sanitizeLanguage(snapshot.language)
    },
    sceneGraph: {
      nodes: outboundNodes.slice(0, 120)
    },
    allowedOperations: ["CLICK"]
  };

  return {
    outboundPayload,
    canaries: Array.from(canaries),
    coverageGaps,
    maskBoxes,
    localNodes,
    preferredTarget,
    sensitiveRegionCount,
    mediaRegionCount
  };
}

function safeInteractiveLabel(node, isSensitive) {
  if (isSensitive) {
    return "[REDACTED_FIELD]";
  }
  const candidate = sanitizeText(node.accessibleName || node.text || "");
  if (node.submitLike) {
    return /file\s+claim/i.test(candidate) ? "File claim" : "Submit claim";
  }
  const safeLabels = new Map([
    ["back", "Back"],
    ["cancel", "Cancel"],
    ["close", "Close"],
    ["confirm", "Confirm"],
    ["continue", "Continue"],
    ["edit", "Edit"],
    ["next", "Next"],
    ["review", "Review"],
    ["review claim", "Review claim"],
    ["run privacy pipeline", "Run privacy pipeline"],
    ["save draft", "Save draft"]
  ]);
  return safeLabels.get(candidate.toLowerCase()) || "[LABEL_OMITTED]";
}

function extractMatches(input) {
  const text = typeof input === "string" ? input : "";
  const matches = [];
  for (const pattern of PII_PATTERNS) {
    const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
    for (const match of text.matchAll(regex)) {
      const value = String(match[0] || "").trim();
      if (value.length >= 4) {
        matches.push({ type: pattern.type, value });
      }
    }
  }
  return matches;
}

function sanitizeText(input) {
  let output = String(input || "").replace(/[\u0000-\u001F\u007F]/g, " ");
  for (const pattern of PII_PATTERNS) {
    output = output.replace(new RegExp(pattern.regex.source, pattern.regex.flags), `[REDACTED_${pattern.type}]`);
  }
  output = output.replace(PROMPT_INJECTION, "[UNTRUSTED_INSTRUCTION_REMOVED]");
  output = output.replace(/\s+/g, " ").trim();
  return output.slice(0, 120);
}

function verifySerializedPayload(serialized, canaries, coverageGaps, truncated) {
  const reasons = [];
  let parsed;
  try {
    parsed = JSON.parse(serialized);
  } catch (_error) {
    return { passed: false, reasons: ["INVALID_JSON"] };
  }

  walkKeys(parsed, (key) => {
    if (FORBIDDEN_KEYS.has(key.toLowerCase())) {
      reasons.push(`FORBIDDEN_KEY:${key}`);
    }
  });

  const residualMatches = extractMatches(serialized);
  for (const match of residualMatches) {
    reasons.push(`RESIDUAL_PATTERN:${match.type}`);
  }

  const lowerSerialized = serialized.toLowerCase();
  for (const canary of canaries) {
    const normalized = String(canary || "").trim().toLowerCase();
    if (normalized.length >= 4 && lowerSerialized.includes(normalized)) {
      reasons.push("RESIDUAL_CANARY");
      break;
    }
    const digits = normalized.replace(/\D/g, "");
    if (digits.length >= 8 && lowerSerialized.replace(/\D/g, "").includes(digits)) {
      reasons.push("RESIDUAL_NUMERIC_CANARY");
      break;
    }
  }

  if (coverageGaps.length > 0) {
    reasons.push("UNKNOWN_COVERAGE");
  }
  if (truncated) {
    reasons.push("TRUNCATED_CAPTURE");
  }

  return { passed: reasons.length === 0, reasons: Array.from(new Set(reasons)) };
}

function walkKeys(value, visitor) {
  if (Array.isArray(value)) {
    value.forEach((item) => walkKeys(item, visitor));
    return;
  }
  if (!value || typeof value !== "object") {
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    visitor(key);
    walkKeys(child, visitor);
  }
}

function addMask(boxes, keys, bounds, reason) {
  if (!bounds || bounds.width <= 0 || bounds.height <= 0) {
    return;
  }
  const key = [
    Math.round(bounds.x), Math.round(bounds.y), Math.round(bounds.width), Math.round(bounds.height)
  ].join(":");
  if (keys.has(key)) {
    return;
  }
  keys.add(key);
  boxes.push({ ...bounds, reason });
}

function normalizeBounds(bounds, viewport) {
  const width = Math.max(1, Number(viewport.width));
  const height = Math.max(1, Number(viewport.height));
  return {
    x: round4(clamp(Number(bounds.x) / width, 0, 1)),
    y: round4(clamp(Number(bounds.y) / height, 0, 1)),
    width: round4(clamp(Number(bounds.width) / width, 0, 1)),
    height: round4(clamp(Number(bounds.height) / height, 0, 1))
  };
}

function normalizeRole(role, tag, inputType) {
  const allowed = new Set(["button", "checkbox", "combobox", "link", "radio", "switch", "textbox"]);
  const candidate = String(role || "").toLowerCase();
  if (allowed.has(candidate)) {
    return candidate;
  }
  if (tag === "button" || inputType === "button" || inputType === "submit") return "button";
  if (tag === "a") return "link";
  if (tag === "select") return "combobox";
  if (inputType === "checkbox") return "checkbox";
  if (inputType === "radio") return "radio";
  if (["input", "textarea"].includes(tag)) return "textbox";
  return "button";
}

function normalizeIdentity(input) {
  return String(input || "").replace(/\s+/g, " ").trim().slice(0, 300);
}

function normalizeCanary(input) {
  return String(input || "").toLowerCase().replace(/\s+/g, "").trim();
}

function sanitizeLanguage(input) {
  const value = String(input || "und").toLowerCase();
  return /^[a-z]{2,3}(?:-[a-z0-9]{2,8})?$/.test(value) ? value : "und";
}

function viewportClass(width) {
  if (width < 640) return "NARROW";
  if (width < 1100) return "STANDARD";
  return "WIDE";
}

function stableStringify(value) {
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const pairs = Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
    return `{${pairs.join(",")}}`;
  }
  return JSON.stringify(value);
}

async function sha256Hex(input) {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomToken(byteLength) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function isSupportedPage(url) {
  if (typeof url !== "string") return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch (_error) {
    return false;
  }
}

function pruneSessions() {
  const now = Date.now();
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.createdAt > SESSION_TTL_MS) {
      sessions.delete(sessionId);
    }
  }
}

function trimSessions() {
  while (sessions.size > MAX_SESSIONS) {
    sessions.delete(sessions.keys().next().value);
  }
}

function failure(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

function publicFailure(code) {
  const messages = {
    ACTION_BINDING_MISMATCH: "The action no longer matches the verified payload. Scan again.",
    ACTION_REPLAYED: "This one-time action was already used. Scan again.",
    CAPTURE_FAILED: "The page snapshot could not be captured safely.",
    CONFIRMATION_REQUIRED: "Explicit confirmation is required before submission.",
    EXECUTION_FAILED: "The action was not executed. Scan the page again.",
    INVALID_ACTION: "Only the verified CLICK action is accepted.",
    INVALID_REQUEST: "The extension rejected an invalid request.",
    NO_ACTIVE_TAB: "No active browser tab is available.",
    NO_APPROVED_ACTION: "There is no approved action for this scan.",
    PAGE_ACCESS_DENIED: "Chrome did not grant access to this page. Re-open the panel from the toolbar.",
    PAGE_CHANGED: "The page changed after verification. Nothing was clicked; scan again.",
    SCREENSHOT_FAILED: "The visible tab could not be captured.",
    SESSION_EXPIRED: "The two-minute action window expired. Scan again.",
    TARGET_CHANGED: "The target changed after verification. Nothing was clicked.",
    TARGET_DISABLED: "The verified target is now disabled. Nothing was clicked.",
    TARGET_MISSING: "The verified target no longer exists. Nothing was clicked.",
    TARGET_NOT_FOUND: "The opaque action target is unknown.",
    TARGET_NOT_VISIBLE: "The verified target is no longer visible. Nothing was clicked.",
    UNSUPPORTED_PAGE: "Open an HTTP or HTTPS page before scanning.",
    UNSUPPORTED_REQUEST: "The extension rejected an unsupported request.",
    UNTRUSTED_SENDER: "The request did not originate from this extension."
  };
  return { code: code || "INTERNAL_ERROR", message: messages[code] || "The operation failed closed. Scan again." };
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function round4(value) {
  return Math.round(value * 10000) / 10000;
}

function collectPageSnapshot(taskNonce) {
  const MAX_NODES = 600;
  const MAX_DOCUMENT_TEXT = 50000;
  const viewport = window.visualViewport;
  const viewportWidth = viewport ? viewport.width : window.innerWidth;
  const viewportHeight = viewport ? viewport.height : window.innerHeight;
  const viewportOffsetLeft = viewport ? viewport.offsetLeft : 0;
  const viewportOffsetTop = viewport ? viewport.offsetTop : 0;

  function normalize(input, limit) {
    return String(input || "").replace(/\s+/g, " ").trim().slice(0, limit || 500);
  }

  function visible(element) {
    if (!(element instanceof Element)) return false;
    const style = window.getComputedStyle(element);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) return false;
    const rect = element.getBoundingClientRect();
    return rect.width > 1 && rect.height > 1 && rect.bottom > 0 && rect.right > 0 && rect.top < viewportHeight && rect.left < viewportWidth;
  }

  function boundsFor(element) {
    const rect = element.getBoundingClientRect();
    const left = Math.max(0, rect.left - viewportOffsetLeft);
    const top = Math.max(0, rect.top - viewportOffsetTop);
    const right = Math.min(viewportWidth, rect.right - viewportOffsetLeft);
    const bottom = Math.min(viewportHeight, rect.bottom - viewportOffsetTop);
    return {
      x: Math.round(left * 100) / 100,
      y: Math.round(top * 100) / 100,
      width: Math.round(Math.max(0, right - left) * 100) / 100,
      height: Math.round(Math.max(0, bottom - top) * 100) / 100
    };
  }

  function escapeCss(value) {
    if (window.CSS && typeof window.CSS.escape === "function") return window.CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, (character) => `\\${character}`);
  }

  function selectorFor(element) {
    if (element.id && document.querySelectorAll(`#${escapeCss(element.id)}`).length === 1) {
      return `#${escapeCss(element.id)}`;
    }
    const parts = [];
    let current = element;
    while (current && current.nodeType === Node.ELEMENT_NODE && current !== document.documentElement) {
      let part = current.tagName.toLowerCase();
      const parent = current.parentElement;
      if (parent) {
        const siblings = Array.from(parent.children).filter((child) => child.tagName === current.tagName);
        if (siblings.length > 1) {
          part += `:nth-of-type(${siblings.indexOf(current) + 1})`;
        }
      }
      parts.unshift(part);
      current = parent;
      if (parts.length >= 8) break;
    }
    return parts.join(" > ");
  }

  function labelFor(element) {
    const labels = [];
    if (element.getAttribute("aria-label")) labels.push(element.getAttribute("aria-label"));
    if (element.getAttribute("aria-labelledby")) {
      for (const id of element.getAttribute("aria-labelledby").split(/\s+/)) {
        const label = document.getElementById(id);
        if (label) labels.push(label.textContent);
      }
    }
    if (element.labels) {
      for (const label of element.labels) labels.push(label.textContent);
    }
    if (element.getAttribute("placeholder")) labels.push(element.getAttribute("placeholder"));
    if (element.getAttribute("title")) labels.push(element.getAttribute("title"));
    if (element.innerText) labels.push(element.innerText);
    return normalize(labels.join(" "), 500);
  }

  function roleFor(element) {
    if (element.getAttribute("role")) return normalize(element.getAttribute("role"), 40).toLowerCase();
    const tag = element.tagName.toLowerCase();
    if (tag === "button") return "button";
    if (tag === "a") return "link";
    if (tag === "select") return "combobox";
    if (tag === "textarea") return "textbox";
    if (tag === "input") {
      const type = String(element.type || "text").toLowerCase();
      if (type === "checkbox") return "checkbox";
      if (type === "radio") return "radio";
      if (["button", "submit", "reset"].includes(type)) return "button";
      return "textbox";
    }
    return "";
  }

  function fingerprint() {
    const bodyText = normalize(document.body ? document.body.innerText : "", 100000);
    const material = `${location.href}\n${document.title}\n${bodyText}\n${document.querySelectorAll("*").length}`;
    let hash = 2166136261;
    for (let index = 0; index < material.length; index += 1) {
      hash ^= material.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `${(hash >>> 0).toString(16).padStart(8, "0")}:${material.length}`;
  }

  const candidates = new Set();
  const walker = document.createTreeWalker(document.body || document.documentElement, NodeFilter.SHOW_TEXT);
  let textNode;
  while ((textNode = walker.nextNode())) {
    if (normalize(textNode.nodeValue, 5).length > 0 && textNode.parentElement && visible(textNode.parentElement)) {
      candidates.add(textNode.parentElement);
    }
  }
  for (const element of document.querySelectorAll(
    "input, textarea, select, button, a[href], [role], [aria-label], [contenteditable='true'], img, video, canvas, iframe, svg, [data-pii], [data-sensitive]"
  )) {
    if (visible(element)) candidates.add(element);
  }

  const candidateList = Array.from(candidates);
  const nodes = [];
  for (const element of candidateList.slice(0, MAX_NODES)) {
    const tag = element.tagName.toLowerCase();
    const inputType = tag === "input" ? String(element.type || "text").toLowerCase() : "";
    const style = window.getComputedStyle(element);
    let mediaKind = "";
    if (["img", "video", "canvas", "iframe", "svg"].includes(tag)) mediaKind = tag.toUpperCase();
    else if (style.backgroundImage && style.backgroundImage !== "none") mediaKind = "BACKGROUND_IMAGE";
    const isFormControl = ["input", "textarea", "select"].includes(tag);
    const interactive = isFormControl || tag === "button" || tag === "a" || element.hasAttribute("role") || element.isContentEditable;
    const accessibleName = labelFor(element);
    const metadata = normalize([
      element.id,
      element.getAttribute("name"),
      element.getAttribute("autocomplete"),
      element.getAttribute("data-field"),
      element.getAttribute("data-testid")
    ].filter(Boolean).join(" "), 300);
    const submitLike =
      inputType === "submit" ||
      (tag === "button" && String(element.type || "").toLowerCase() === "submit") ||
      /submit|send|confirm|file claim/i.test(accessibleName);

    nodes.push({
      selector: selectorFor(element),
      tag,
      inputType,
      role: roleFor(element),
      text: normalize(element.innerText || element.textContent, 500),
      accessibleName,
      value: isFormControl ? normalize(element.value, 300) : "",
      metadata,
      autocomplete: normalize(element.getAttribute("autocomplete"), 80),
      bounds: boundsFor(element),
      interactive,
      isFormControl,
      explicitlySensitive: element.hasAttribute("data-pii") || element.hasAttribute("data-sensitive"),
      mediaKind,
      disabled: Boolean(element.disabled || element.getAttribute("aria-disabled") === "true"),
      submitLike
    });
  }

  const parsed = new URL(location.href);
  return {
    nonceEcho: taskNonce,
    url: location.href,
    scheme: parsed.protocol.replace(":", ""),
    pathDepth: parsed.pathname.split("/").filter(Boolean).length,
    title: normalize(document.title, 300),
    language: normalize(document.documentElement.lang || "und", 20),
    navigationTimeOrigin: performance.timeOrigin,
    pageFingerprint: fingerprint(),
    documentText: normalize(document.body ? document.body.innerText : "", MAX_DOCUMENT_TEXT),
    nodes,
    truncated: candidateList.length > MAX_NODES,
    viewport: {
      width: Math.round(viewportWidth * 100) / 100,
      height: Math.round(viewportHeight * 100) / 100,
      devicePixelRatio: window.devicePixelRatio || 1
    }
  };
}

function revalidateAndClick(expected) {
  function normalize(input) {
    return String(input || "").replace(/\s+/g, " ").trim().slice(0, 300);
  }

  function labelFor(element) {
    const labels = [];
    if (element.getAttribute("aria-label")) labels.push(element.getAttribute("aria-label"));
    if (element.getAttribute("aria-labelledby")) {
      for (const id of element.getAttribute("aria-labelledby").split(/\s+/)) {
        const label = document.getElementById(id);
        if (label) labels.push(label.textContent);
      }
    }
    if (element.labels) {
      for (const label of element.labels) labels.push(label.textContent);
    }
    if (element.getAttribute("placeholder")) labels.push(element.getAttribute("placeholder"));
    if (element.getAttribute("title")) labels.push(element.getAttribute("title"));
    if (element.innerText) labels.push(element.innerText);
    return normalize(labels.join(" "));
  }

  function fingerprint() {
    const bodyText = String(document.body ? document.body.innerText : "").replace(/\s+/g, " ").trim().slice(0, 100000);
    const material = `${location.href}\n${document.title}\n${bodyText}\n${document.querySelectorAll("*").length}`;
    let hash = 2166136261;
    for (let index = 0; index < material.length; index += 1) {
      hash ^= material.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return `${(hash >>> 0).toString(16).padStart(8, "0")}:${material.length}`;
  }

  if (location.href !== expected.url || Math.abs(performance.timeOrigin - expected.navigationTimeOrigin) > 1) {
    return { ok: false, code: "PAGE_CHANGED" };
  }
  if (fingerprint() !== expected.pageFingerprint) {
    return { ok: false, code: "PAGE_CHANGED" };
  }

  let element;
  try {
    element = document.querySelector(expected.target.selector);
  } catch (_error) {
    return { ok: false, code: "TARGET_MISSING" };
  }
  if (!element || !element.isConnected) {
    return { ok: false, code: "TARGET_MISSING" };
  }

  const tag = element.tagName.toLowerCase();
  const inputType = tag === "input" ? String(element.type || "text").toLowerCase() : "";
  if (
    tag !== expected.target.tag ||
    inputType !== expected.target.inputType ||
    labelFor(element) !== expected.target.identityText
  ) {
    return { ok: false, code: "TARGET_CHANGED" };
  }
  if (element.disabled || element.getAttribute("aria-disabled") === "true") {
    return { ok: false, code: "TARGET_DISABLED" };
  }

  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  if (
    style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0 ||
    rect.width <= 1 || rect.height <= 1 || rect.bottom <= 0 || rect.right <= 0 ||
    rect.top >= window.innerHeight || rect.left >= window.innerWidth
  ) {
    return { ok: false, code: "TARGET_NOT_VISIBLE" };
  }
  const original = expected.target.bounds;
  if (
    Math.abs(rect.left - original.x) > 16 ||
    Math.abs(rect.top - original.y) > 16 ||
    Math.abs(rect.width - original.width) > 16 ||
    Math.abs(rect.height - original.height) > 16
  ) {
    return { ok: false, code: "TARGET_CHANGED" };
  }

  element.click();
  return { ok: true };
}
