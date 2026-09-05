"use strict";

const elements = {
  scanButton: document.getElementById("scan-button"),
  resetButton: document.getElementById("reset-button"),
  pipelineState: document.getElementById("pipeline-state"),
  pipelineItems: Array.from(document.querySelectorAll("#pipeline-list li")),
  failureCard: document.getElementById("failure-card"),
  failureTitle: document.getElementById("failure-title"),
  failureMessage: document.getElementById("failure-message"),
  evidenceSection: document.getElementById("evidence-section"),
  redactedPreview: document.getElementById("redacted-preview"),
  metricRegions: document.getElementById("metric-regions"),
  metricNodes: document.getElementById("metric-nodes"),
  metricBytes: document.getElementById("metric-bytes"),
  verificationSection: document.getElementById("verification-section"),
  verificationBadge: document.getElementById("verification-badge"),
  digest: document.getElementById("digest"),
  coverage: document.getElementById("coverage"),
  payloadPreview: document.getElementById("payload-preview"),
  actionSection: document.getElementById("action-section"),
  actionLabel: document.getElementById("action-label"),
  opaqueTarget: document.getElementById("opaque-target"),
  confirmationRow: document.getElementById("confirmation-row"),
  confirmCheckbox: document.getElementById("confirm-checkbox"),
  executeButton: document.getElementById("execute-button"),
  successCard: document.getElementById("success-card")
};

let currentScan = null;
let previewObjectUrl = null;

elements.scanButton.addEventListener("click", () => void runScan());
elements.resetButton.addEventListener("click", () => void resetScan(true));
elements.confirmCheckbox.addEventListener("change", updateExecuteState);
elements.executeButton.addEventListener("click", () => void executeApprovedAction());

async function runScan() {
  await resetScan(true);
  setBusy(true);
  markPipeline("capture", "active");

  let response;
  try {
    response = await chrome.runtime.sendMessage({ type: "SCAN_ACTIVE_TAB" });
  } catch (_error) {
    response = { ok: false, error: { code: "EXTENSION_UNAVAILABLE", message: "The extension worker was unavailable. Reload the extension and try again." } };
  }

  if (!response || response.ok !== true) {
    showFailure("Capture blocked", response && response.error ? response.error.message : "The operation failed closed.");
    markPipeline("capture", "blocked");
    setPipelineState("Blocked", "bad");
    setBusy(false);
    return;
  }

  currentScan = response;
  markPipeline("capture", "done");
  markPipeline("detect", "done");
  markPipeline("mask", "active");

  try {
    previewObjectUrl = await createRedactedBitmap(
      response.screenshotDataUrl,
      response.maskBoxes,
      response.viewport
    );
    response.screenshotDataUrl = null;
    elements.redactedPreview.src = previewObjectUrl;
    elements.evidenceSection.hidden = false;
    markPipeline("mask", "done");
  } catch (_error) {
    currentScan = null;
    showFailure("Redaction failed", "A new masked bitmap could not be produced. The payload and action were withheld.");
    markPipeline("mask", "blocked");
    setPipelineState("Blocked", "bad");
    setBusy(false);
    return;
  }

  renderEvidence(response);
  renderVerification(response);
  markPipeline("verify", response.verification.passed ? "done" : "blocked");

  if (response.decision === "READY" && response.action && response.verification.passed) {
    renderAction(response.action);
    markPipeline("plan", "done");
    setPipelineState("Ready", "good");
  } else {
    markPipeline("plan", "blocked");
    showDecisionFailure(response.decision, response.verification);
    setPipelineState("Blocked", "bad");
  }
  setBusy(false);
}

async function createRedactedBitmap(originalDataUrl, boxes, viewport) {
  if (typeof originalDataUrl !== "string" || !originalDataUrl.startsWith("data:image/png;base64,")) {
    throw new Error("INVALID_CAPTURE");
  }
  const image = new Image();
  image.decoding = "async";
  image.src = originalDataUrl;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d", { alpha: false });
  if (!context) throw new Error("CANVAS_UNAVAILABLE");
  context.drawImage(image, 0, 0);

  const scaleX = canvas.width / Math.max(1, Number(viewport.width));
  const scaleY = canvas.height / Math.max(1, Number(viewport.height));
  context.fillStyle = "#080a10";
  for (const box of boxes) {
    const x = Math.max(0, Math.floor(Number(box.x) * scaleX) - 2);
    const y = Math.max(0, Math.floor(Number(box.y) * scaleY) - 2);
    const width = Math.min(canvas.width - x, Math.ceil(Number(box.width) * scaleX) + 4);
    const height = Math.min(canvas.height - y, Math.ceil(Number(box.height) * scaleY) + 4);
    if (width > 0 && height > 0) context.fillRect(x, y, width, height);
  }
  image.src = "";

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("ENCODE_FAILED")), "image/png");
  });
  canvas.width = 1;
  canvas.height = 1;
  return URL.createObjectURL(blob);
}

function renderEvidence(scan) {
  const regions = scan.metrics.sensitiveRegions + scan.metrics.visualMediaRegions;
  elements.metricRegions.textContent = String(regions);
  elements.metricNodes.textContent = String(scan.metrics.outboundNodes);
  elements.metricBytes.textContent = formatBytes(scan.metrics.outboundBytes);
}

function renderVerification(scan) {
  elements.verificationSection.hidden = false;
  elements.verificationBadge.textContent = scan.verification.passed ? "Passed" : "Blocked";
  elements.verificationBadge.className = `state ${scan.verification.passed ? "good" : "bad"}`;
  elements.digest.textContent = scan.payloadDigest;
  elements.digest.title = scan.payloadDigest;
  elements.coverage.textContent = String(scan.metrics.unknownCoverage);
  try {
    elements.payloadPreview.textContent = JSON.stringify(JSON.parse(scan.serializedPayload), null, 2);
  } catch (_error) {
    elements.payloadPreview.textContent = "Payload unavailable";
  }
}

function renderAction(action) {
  elements.actionSection.hidden = false;
  elements.actionLabel.textContent = action.label;
  elements.opaqueTarget.textContent = action.target;
  elements.opaqueTarget.title = action.target;
  elements.confirmationRow.hidden = !action.requiresConfirmation;
  elements.confirmCheckbox.checked = false;
  updateExecuteState();
}

async function executeApprovedAction() {
  if (!currentScan || !currentScan.action) return;
  elements.executeButton.disabled = true;
  elements.executeButton.textContent = "Revalidating page…";

  let response;
  try {
    response = await chrome.runtime.sendMessage({
      type: "EXECUTE_ACTION",
      sessionId: currentScan.sessionId,
      payloadDigest: currentScan.payloadDigest,
      action: currentScan.action,
      userConfirmed: elements.confirmCheckbox.checked
    });
  } catch (_error) {
    response = { ok: false, error: { message: "The action failed closed. Scan again." } };
  }

  if (!response || response.ok !== true) {
    showFailure("Nothing was clicked", response && response.error ? response.error.message : "The action failed closed.");
    elements.executeButton.textContent = "Scan again to retry";
    elements.executeButton.disabled = true;
    setPipelineState("Stale", "bad");
    return;
  }

  elements.successCard.hidden = false;
  elements.actionSection.hidden = true;
  elements.executeButton.textContent = "Execute verified CLICK";
  setPipelineState("Executed", "good");
  currentScan = null;
}

async function resetScan(notifyWorker) {
  if (notifyWorker && currentScan && currentScan.sessionId) {
    try {
      await chrome.runtime.sendMessage({ type: "DISCARD_SESSION", sessionId: currentScan.sessionId });
    } catch (_error) {
      // The in-memory capability expires independently; reset remains safe.
    }
  }
  currentScan = null;
  if (previewObjectUrl) {
    URL.revokeObjectURL(previewObjectUrl);
    previewObjectUrl = null;
  }
  elements.redactedPreview.removeAttribute("src");
  elements.evidenceSection.hidden = true;
  elements.verificationSection.hidden = true;
  elements.actionSection.hidden = true;
  elements.failureCard.hidden = true;
  elements.successCard.hidden = true;
  elements.confirmCheckbox.checked = false;
  elements.executeButton.disabled = true;
  elements.executeButton.textContent = "Execute verified CLICK";
  for (const item of elements.pipelineItems) {
    item.className = "";
    item.querySelector("b").textContent = "—";
  }
  setPipelineState("Waiting", "neutral");
}

function updateExecuteState() {
  if (!currentScan || !currentScan.action) {
    elements.executeButton.disabled = true;
    return;
  }
  elements.executeButton.disabled = currentScan.action.requiresConfirmation && !elements.confirmCheckbox.checked;
}

function markPipeline(step, state) {
  const item = elements.pipelineItems.find((candidate) => candidate.dataset.step === step);
  if (!item) return;
  item.className = state;
  item.querySelector("b").textContent = state === "done" ? "✓" : state === "blocked" ? "×" : "…";
}

function setPipelineState(label, state) {
  elements.pipelineState.textContent = label;
  elements.pipelineState.className = `state ${state}`;
}

function setBusy(busy) {
  elements.scanButton.disabled = busy;
  elements.scanButton.classList.toggle("busy", busy);
  elements.scanButton.lastChild.textContent = busy ? " Scanning locally…" : " Scan visible page";
}

function showFailure(title, message) {
  elements.failureTitle.textContent = title;
  elements.failureMessage.textContent = message;
  elements.failureCard.hidden = false;
}

function showDecisionFailure(decision, verification) {
  const messages = {
    BLOCKED_TRUNCATED_CAPTURE: "The page contained more visible nodes than the bounded collector could account for.",
    BLOCKED_COVERAGE_GAP: "A sensitive canary was found without a corresponding maskable DOM region.",
    BLOCKED_PRIVACY_VERIFICATION: "The exact serialized payload contained a forbidden key, residual pattern, or canary.",
    BLOCKED_PROMPT_INJECTION: "Untrusted page text attempted to override privacy or system instructions.",
    NO_SAFE_ACTION: "No enabled submit, review, or continue control could be safely bound to CLICK."
  };
  const suffix = verification && verification.reasons && verification.reasons.length
    ? ` Gate: ${verification.reasons.join(", ")}.`
    : "";
  showFailure("Action withheld", `${messages[decision] || "The scan did not satisfy the action policy."}${suffix}`);
}

function formatBytes(bytes) {
  const value = Number(bytes) || 0;
  if (value < 1024) return `${value} B`;
  return `${(value / 1024).toFixed(1)} KB`;
}
