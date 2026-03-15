#!/bin/bash
set -uo pipefail
# Note: -e is intentionally omitted. We handle errors explicitly and always
# exit 0 so Railway doesn't restart ephemeralbuild containers.

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
  local body

  if [ -n "${extra}" ]; then
    body="{\"status\":\"${status}\"${extra}}"
  else
    body=$(jq -nc --arg status "${status}" '{status: $status}')
  fi

  curl -s -X PATCH "${BUILD_URL}" \
    -H "${AUTH_HEADER}" -H "${APIKEY_HEADER}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "${body}" || true
}

append_log() {
  local phase="$1"
  local message="$2"
  local platform="${3:-}"
  local body
  if [ -n "${platform}" ]; then
    body=$(jq -nc \
      --arg build_id "${BUILD_ID}" \
      --arg phase "${phase}" \
      --arg platform "${platform}" \
      --arg message "${message}" \
      '{build_id: $build_id, phase: $phase, platform: $platform, message: $message}')
  else
    body=$(jq -nc \
      --arg build_id "${BUILD_ID}" \
      --arg phase "${phase}" \
      --arg message "${message}" \
      '{build_id: $build_id, phase: $phase, message: $message}')
  fi

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
  local upload_response
  upload_response=$(curl -s -w "\n%{http_code}" -X POST "${STORAGE_URL}/${file_name}" \
    -H "${AUTH_HEADER}" -H "${APIKEY_HEADER}" \
    -H "Content-Type: application/octet-stream" \
    -H "x-upsert: true" \
    --data-binary "@${file_path}")

  local upload_http
  upload_http=$(echo "${upload_response}" | tail -n1)
  local upload_body
  upload_body=$(echo "${upload_response}" | sed '$d')

  if [ "${upload_http}" -lt 200 ] || [ "${upload_http}" -ge 300 ]; then
    # 409 Duplicate means the file already exists in storage — treat as success
    if [ "${upload_http}" = "400" ] && [[ "${upload_body}" == *"Duplicate"* || "${upload_body}" == *"409"* ]]; then
      append_log "upload" "File ${file_name} already exists in storage (409 Duplicate), treating as success" "${platform}"
      # Fall through to insert artifact record below
    else
      append_log "upload" "Upload failed for ${file_name} (HTTP ${upload_http}): ${upload_body}" "${platform}"
      if [ "${upload_http}" = "400" ] && [[ "${upload_body}" == *"413"* || "${upload_body}" == *"Payload too large"* ]]; then
        return 42
      fi
      return 1
    fi
  fi

  # Insert artifact record
  local size
  size=$(stat -c%s "${file_path}" 2>/dev/null || echo "0")
  local artifact_body
  artifact_body=$(jq -nc \
    --arg build_id "${BUILD_ID}" \
    --arg platform "${platform}" \
    --arg file_name "${file_name}" \
    --arg storage_path "artifacts/${BUILD_ID}/${file_name}" \
    --argjson file_size "${size}" \
    '{build_id: $build_id, platform: $platform, file_name: $file_name, file_size: $file_size, storage_path: $storage_path}')
  local record_response
  record_response=$(curl -s -w "\n%{http_code}" -X POST "${SUPABASE_URL}/rest/v1/artifacts" \
    -H "${AUTH_HEADER}" -H "${APIKEY_HEADER}" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal,resolution=merge-duplicates" \
    -d "${artifact_body}")

  local record_http
  record_http=$(echo "${record_response}" | tail -n1)
  local record_body
  record_body=$(echo "${record_response}" | sed '$d')

  if [ "${record_http}" -lt 200 ] || [ "${record_http}" -ge 300 ]; then
    append_log "upload" "Artifact record insert failed for ${file_name} (HTTP ${record_http}): ${record_body}" "${platform}"
    return 1
  fi

  return 0
}

prepare_upload_file() {
  local platform="$1"
  local source_file="$2"
  local upload_file="$source_file"
  local upload_name
  upload_name=$(basename "${source_file}")

  case "${platform}" in
    windows)
      upload_name="game-windows.zip"
      ;;
    linux)
      upload_name="game-linux.zip"
      ;;
    *)
      printf '%s|%s' "${upload_file}" "${upload_name}"
      return 0
      ;;
  esac

  upload_file="${ARTIFACTS_DIR}/${upload_name}"
  if zip -9 -j "${upload_file}" "${source_file}" >/dev/null 2>&1; then
    printf '%s|%s' "${upload_file}" "${upload_name}"
    return 0
  fi

  printf '%s|%s' "${source_file}" "$(basename "${source_file}")"
  return 0
}

# --- Main build process ---

START_TIME=$(date +%s)

echo "=== GodotForge Builder ==="
echo "Build ID: ${BUILD_ID}"
echo "Repo: ${REPO_URL}"
echo "Commit: ${COMMIT_SHA}"
# PLATFORM (singular) takes precedence when set by the orchestrator.
# PLATFORMS (plural, comma-separated) is the fallback.
if [ -n "${PLATFORM:-}" ]; then
  PLATFORMS="${PLATFORM}"
fi

echo "Platform(s): ${PLATFORMS}"

# Phase 1: Clone
append_log "clone" "Cloning repository..."
rm -rf "${REPO_DIR}" "${ARTIFACTS_DIR}"
mkdir -p "${ARTIFACTS_DIR}"
CLONE_URL="${REPO_URL}"

if [[ "${REPO_URL}" == https://github.com/* ]] && [ -z "${GITHUB_TOKEN:-}" ]; then
  append_log "clone" "ERROR: Missing GITHUB_TOKEN for GitHub repository clone"
  exit 0
fi

if [ -n "${GITHUB_TOKEN:-}" ]; then
  CLONE_URL=$(echo "${REPO_URL}" | sed "s|https://github.com/|https://x-access-token:${GITHUB_TOKEN}@github.com/|")
fi
git clone --depth 1 "${CLONE_URL}" "${REPO_DIR}" 2>&1
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
  exit 0
fi

append_log "clone" "Found project.godot at ${PROJECT_PATH:-root}"

# Phase 2: Import
append_log "import" "Importing project resources..."
if timeout 120 godot --headless --import 2>&1; then
  append_log "import" "Import complete"
else
  IMPORT_EXIT=$?
  if [ ${IMPORT_EXIT} -eq 137 ]; then
    append_log "import" "Import killed (OOM or signal) — exit ${IMPORT_EXIT}. Failing build."
  else
    append_log "import" "Import exited with code ${IMPORT_EXIT}. Failing build."
  fi
  exit 0
fi

# Phase 3: Export
IFS=',' read -ra PLATFORM_LIST <<< "${PLATFORMS}"
declare -A SEEN_PLATFORMS
had_failure=0

for platform in "${PLATFORM_LIST[@]}"; do
  platform=$(echo "${platform}" | xargs) # trim whitespace

  if [ -z "${platform}" ]; then
    continue
  fi

  if [[ -n "${SEEN_PLATFORMS[${platform}]:-}" ]]; then
    append_log "export" "Duplicate platform '${platform}' detected, skipping duplicate entry" "${platform}"
    continue
  fi
  SEEN_PLATFORMS["${platform}"]=1

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
      append_log "export" "Unknown platform: ${platform}, marking failure"
      had_failure=1
      continue
      ;;
  esac

  append_log "export" "Exporting for ${platform} (preset: ${PRESET_NAME})..." "${platform}"

  if timeout 600 godot --headless --export-release "${PRESET_NAME}" "${OUTPUT_FILE}" 2>&1; then
    append_log "export" "Export successful for ${platform}" "${platform}"

    # For web builds, zip the output directory
    if [ "${platform}" = "web" ] && [ -f "${OUTPUT_FILE}" ]; then
      cd "${ARTIFACTS_DIR}"
      zip -j "game-web.zip" game.html game.js game.wasm game.pck game.audio.worklet.js 2>/dev/null || true
      cd "${PROJECT_DIR}"
      OUTPUT_FILE="${ARTIFACTS_DIR}/game-web.zip"
    fi

    # Phase 4: Upload
    if [ -f "${OUTPUT_FILE}" ]; then
      prepared=$(prepare_upload_file "${platform}" "${OUTPUT_FILE}")
      upload_file="${prepared%%|*}"
      upload_name="${prepared#*|}"

      append_log "upload" "Uploading ${upload_name}..." "${platform}"
      if upload_artifact "${upload_file}" "${upload_name}" "${platform}"; then
        append_log "upload" "Uploaded ${upload_name}" "${platform}"
      else
        UPLOAD_EXIT=$?
        if [ ${UPLOAD_EXIT} -eq 42 ]; then
          append_log "upload" "Fatal upload limit reached for ${platform}; stopping remaining exports" "${platform}"
          exit 0
        fi
        had_failure=1
      fi
    else
      append_log "export" "Export file not found for ${platform}, marking failure" "${platform}"
      had_failure=1
    fi
  else
    EXPORT_EXIT=$?
    if [ ${EXPORT_EXIT} -eq 137 ]; then
      append_log "export" "Export killed (OOM or signal) for ${platform} — exit ${EXPORT_EXIT}" "${platform}"
    else
      append_log "export" "Export FAILED for ${platform} (exit ${EXPORT_EXIT})" "${platform}"
    fi
    had_failure=1
  fi
done

# Calculate duration
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

if [ ${had_failure} -eq 1 ]; then
  append_log "complete" "Build completed with errors in ${DURATION}s"
  echo "=== Build failed (${DURATION}s) ==="
else
  append_log "complete" "Build completed in ${DURATION}s"
  echo "=== Build complete (${DURATION}s) ==="
fi

# Keep container alive so Railway doesn't restart it in a loop.
# The orchestrator detects completion via Supabase artifacts and deletes the service.
exec sleep infinity
