#!/bin/sh
set -e
npm run create-root
exec "$@"