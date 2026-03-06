#!/bin/bash
set -euo pipefail

# --- Required environment variables ---
# BUILD_ID         - GodotForge build record ID
# REPO_URL         - GitHub repo clone URL
# COMMIT_SHA       - Commit to build
# PROJECT_PATH     - Path to project.godot within the repo (e.g. "." or "game/")
# PLATFORMS        - Comma-separated list: windows,linux,web
# SUPABASE_URL     - Supabase project URL
# SUPABASE_SERVICE_ROLE_KEY - Service role key for API access

ARTIFACTS_DIR="/build/artifacts"
REPO_DIR="/build/repo"
LOG_URL="${SUPABASE_URL}/rest/v1/build_logs"
BUILD_URL="${SUPABASE_URL}/rest/v1/builds?id=eq.${BUILD_ID}"
STORAGE_URL="${SUPABASE_URL}/storage/v1/object/artifacts/${BUILD_ID}"
AUTH_HEADER="Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}"
APIKEY_HEADER="apikey: ${SUPABASE_SERVICE_ROLE_KEY}"

# --- Helper functions ---

update_build_status() {
  local status="$1"
  local extra="${2:-}"
  local body="{\"status\":\"${status}\"${extra}}"
  curl -s -X PATCH "${BUILD_URL}" \
    -H "${AUTH_HEADER}" -H "${APIKEY_HEADER}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "${body}" || true
}

append_log() {
  local phase="$1"
  local message="$2"
  local body="{\"build_id\":\"${BUILD_ID}\",\"phase\":\"${phase}\",\"message\":\"${message}\"}"
  curl -s -X POST "${LOG_URL}" \
    -H "${AUTH_HEADER}" -H "${APIKEY_HEADER}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "${body}" || true
}

upload_artifact() {
  local file_path="$1"
  local file_name="$2"
  local platform="$3"
  curl -s -X POST "${STORAGE_URL}/${file_name}" \
    -H "${AUTH_HEADER}" -H "${APIKEY_HEADER}" \
    -H "Content-Type: application/octet-stream" \
    --data-binary "@${file_path}" || true

  # Insert artifact record
  local size
  size=$(stat -c%s "${file_path}" 2>/dev/null || echo "0")
  local artifact_body="{\"build_id\":\"${BUILD_ID}\",\"platform\":\"${platform}\",\"file_name\":\"${file_name}\",\"file_size\":${size},\"storage_path\":\"artifacts/${BUILD_ID}/${file_name}\"}"
  curl -s -X POST "${SUPABASE_URL}/rest/v1/artifacts" \
    -H "${AUTH_HEADER}" -H "${APIKEY_HEADER}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "${artifact_body}" || true
}

# --- Main build process ---

START_TIME=$(date +%s)

echo "=== GodotForge Builder ==="
echo "Build ID: ${BUILD_ID}"
echo "Repo: ${REPO_URL}"
echo "Commit: ${COMMIT_SHA}"
echo "Platforms: ${PLATFORMS}"

# Mark as running
update_build_status "running" ",\"started_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\""

# Phase 1: Clone
append_log "clone" "Cloning repository..."
git clone --depth 1 "${REPO_URL}" "${REPO_DIR}" 2>&1
if [ -n "${COMMIT_SHA}" ] && [ "${COMMIT_SHA}" != "null" ]; then
  cd "${REPO_DIR}"
  git fetch --depth 1 origin "${COMMIT_SHA}" 2>&1 || true
  git checkout "${COMMIT_SHA}" 2>&1 || true
fi
append_log "clone" "Repository cloned successfully"

# Navigate to project directory
PROJECT_DIR="${REPO_DIR}"
if [ -n "${PROJECT_PATH}" ] && [ "${PROJECT_PATH}" != "." ] && [ "${PROJECT_PATH}" != "null" ]; then
  PROJECT_DIR="${REPO_DIR}/${PROJECT_PATH}"
fi
cd "${PROJECT_DIR}"

if [ ! -f "project.godot" ]; then
  append_log "clone" "ERROR: project.godot not found at ${PROJECT_PATH}"
  update_build_status "failed"
  exit 1
fi

append_log "clone" "Found project.godot at ${PROJECT_PATH:-root}"

# Phase 2: Import
append_log "import" "Importing project resources..."
mkdir -p "${ARTIFACTS_DIR}"
timeout 120 godot --headless --import 2>&1 || true
append_log "import" "Import complete"

# Phase 3: Export
IFS=',' read -ra PLATFORM_LIST <<< "${PLATFORMS}"

for platform in "${PLATFORM_LIST[@]}"; do
  platform=$(echo "${platform}" | xargs) # trim whitespace

  case "${platform}" in
    windows)
      PRESET_NAME="Windows Desktop"
      OUTPUT_FILE="${ARTIFACTS_DIR}/game.exe"
      ARTIFACT_NAME="game-windows.exe"
      ;;
    linux)
      PRESET_NAME="Linux"
      OUTPUT_FILE="${ARTIFACTS_DIR}/game.x86_64"
      ARTIFACT_NAME="game-linux.x86_64"
      ;;
    web)
      PRESET_NAME="Web"
      OUTPUT_FILE="${ARTIFACTS_DIR}/game.html"
      ARTIFACT_NAME="game-web.zip"
      ;;
    macos)
      PRESET_NAME="macOS"
      OUTPUT_FILE="${ARTIFACTS_DIR}/game.dmg"
      ARTIFACT_NAME="game-macos.dmg"
      ;;
    android)
      PRESET_NAME="Android"
      OUTPUT_FILE="${ARTIFACTS_DIR}/game.apk"
      ARTIFACT_NAME="game-android.apk"
      ;;
    *)
      append_log "export" "Unknown platform: ${platform}, skipping"
      continue
      ;;
  esac

  append_log "export" "Exporting for ${platform} (preset: ${PRESET_NAME})..."

  if timeout 600 godot --headless --export-release "${PRESET_NAME}" "${OUTPUT_FILE}" 2>&1; then
    append_log "export" "Export successful for ${platform}"

    # For web builds, zip the output directory
    if [ "${platform}" = "web" ] && [ -f "${OUTPUT_FILE}" ]; then
      cd "${ARTIFACTS_DIR}"
      zip -j "game-web.zip" game.html game.js game.wasm game.pck game.audio.worklet.js 2>/dev/null || true
      cd "${PROJECT_DIR}"
      OUTPUT_FILE="${ARTIFACTS_DIR}/game-web.zip"
    fi

    # Phase 4: Upload
    if [ -f "${OUTPUT_FILE}" ]; then
      append_log "upload" "Uploading ${ARTIFACT_NAME}..."
      upload_artifact "${OUTPUT_FILE}" "${ARTIFACT_NAME}" "${platform}"
      append_log "upload" "Uploaded ${ARTIFACT_NAME}"
    else
      append_log "export" "WARNING: Export file not found for ${platform}"
    fi
  else
    append_log "export" "Export FAILED for ${platform}"
  fi
done

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# Mark build as success
append_log "complete" "Build completed in ${DURATION}s"
update_build_status "success" ",\"finished_at\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"duration_seconds\":${DURATION}"

echo "=== Build complete (${DURATION}s) ==="
