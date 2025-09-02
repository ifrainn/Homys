#!/usr/bin/env bash
set -euo pipefail
echo "Forcing npm install (not npm ci)"
export EAS_USE_NPM_INSTALL=1
