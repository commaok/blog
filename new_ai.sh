#!/bin/bash
set -euo pipefail

if [ $# -ne 1 ]; then
	echo "Usage: $0 <slug>" >&2
	exit 1
fi

slug="$1"
file="content/ai/${slug}.md"

if [ -f "$file" ]; then
	echo "File already exists: $file" >&2
	exit 1
fi

date="$(date +%Y-%m-%d)T07:12:48-07:00"

cat > "$file" <<EOF
+++
date = "${date}"
title = "${slug}"
+++

${slug}
EOF

echo "$file"
