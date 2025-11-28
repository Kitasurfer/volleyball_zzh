#!/bin/bash
# Process PDF with Docling locally and upload chunks to Supabase

set -e

PDF_PATH="$1"
TITLE="$2"
LANGUAGE="${3:-de}"

if [ -z "$PDF_PATH" ] || [ -z "$TITLE" ]; then
    echo "Usage: $0 <pdf_path> <title> [language]"
    echo "Example: $0 /tmp/volleyball-rules.pdf 'Offizielle Volleyballregeln 2025-2028' de"
    exit 1
fi

DOCLING_URL="https://volleyball-docling.onrender.com"
SUPABASE_URL="https://kxwmkvtxkaczuonnnxlj.supabase.co"

# Use service role key for database operations (set via environment variable)
if [ -z "$SUPABASE_SERVICE_KEY" ]; then
    echo "Warning: SUPABASE_SERVICE_KEY not set, using anon key (may fail due to RLS)"
    SUPABASE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4d21rdnR4a2FjenVvbm5ueGxqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI0NDUwNzQsImV4cCI6MjA3ODAyMTA3NH0.L_wiWNZbDL9Nhf1A_ynY_-SLn1F2uSBQRELxeQghI7I"
else
    SUPABASE_KEY="$SUPABASE_SERVICE_KEY"
fi

echo "=== Processing PDF with Docling ==="
echo "PDF: $PDF_PATH"
echo "Title: $TITLE"
echo "Language: $LANGUAGE"

# Wake up Docling service
echo "Waking up Docling service..."
curl -s "$DOCLING_URL/health" > /dev/null

# Wait a bit for cold start
sleep 2

# Process PDF
echo "Sending PDF to Docling (this may take a few minutes)..."
RESULT=$(curl -s -X POST "$DOCLING_URL/process" \
    -F "file=@$PDF_PATH" \
    --max-time 600)

# Check if we got markdown
MARKDOWN_LENGTH=$(echo "$RESULT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('markdown','')))" 2>/dev/null || echo "0")

if [ "$MARKDOWN_LENGTH" -lt 100 ]; then
    echo "Error: Docling returned empty or error response"
    echo "$RESULT" | head -c 500
    exit 1
fi

echo "Got $MARKDOWN_LENGTH characters of markdown"

# Save result
RESULT_FILE="/tmp/docling-result-$(date +%s).json"
echo "$RESULT" > "$RESULT_FILE"
echo "Saved to $RESULT_FILE"

# Split into chunks and create content_item
echo "Creating content_item with chunks..."

python3 << EOF
import json
import re
import requests
from datetime import datetime

with open("$RESULT_FILE") as f:
    data = json.load(f)

markdown = data.get("markdown", "")
metadata = data.get("metadata", {})

# Split markdown into chunks by headings
def split_markdown_into_chunks(md, max_size=1500):
    chunks = []
    lines = md.split('\n')
    
    current_chunk = ''
    current_headings = []
    heading_stack = []
    
    for line in lines:
        heading_match = re.match(r'^(#{1,6})\s+(.+)$', line)
        
        if heading_match:
            if len(current_chunk.strip()) > 50:
                chunks.append({
                    'text': current_chunk.strip(),
                    'headings': list(current_headings)
                })
            
            level = len(heading_match.group(1))
            heading_text = heading_match.group(2).strip()
            
            while len(heading_stack) >= level:
                heading_stack.pop()
            heading_stack.append(heading_text)
            
            current_headings = list(heading_stack)
            current_chunk = ''
        else:
            current_chunk += line + '\n'
            
            if len(current_chunk) > max_size:
                chunks.append({
                    'text': current_chunk.strip(),
                    'headings': list(current_headings)
                })
                current_chunk = ''
    
    if len(current_chunk.strip()) > 50:
        chunks.append({
            'text': current_chunk.strip(),
            'headings': list(current_headings)
        })
    
    return chunks

chunks = split_markdown_into_chunks(markdown)
print(f"Split into {len(chunks)} chunks")

# Generate slug
title = "$TITLE"
timestamp = int(datetime.now().timestamp() * 1000)
slug_base = re.sub(r'[^a-z0-9\s-]', '', title.lower())
slug_base = re.sub(r'\s+', '-', slug_base)[:50]
slug = f"{slug_base}-{timestamp}"

# Build body markdown
body_parts = []
for chunk in chunks:
    if chunk['headings']:
        body_parts.append(f"## {' > '.join(chunk['headings'])}\n\n{chunk['text']}")
    else:
        body_parts.append(chunk['text'])

body_markdown = '\n\n---\n\n'.join(body_parts)

# Create content_item via Supabase REST API
supabase_url = "$SUPABASE_URL"
supabase_key = "$SUPABASE_KEY"

payload = {
    "title": title,
    "slug": slug,
    "language": "$LANGUAGE",
    "type": "rules",
    "tags": ["volleyball", "rules", "official"],
    "body_markdown": body_markdown,
    "summary": chunks[0]['text'][:300] if chunks else None,
    "metadata": {
        "source_file": "$PDF_PATH",
        "docling_chunks": chunks,
        "docling_metadata": metadata,
        "processed_at": datetime.now().isoformat()
    }
}

headers = {
    "apikey": supabase_key,
    "Authorization": f"Bearer {supabase_key}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

response = requests.post(
    f"{supabase_url}/rest/v1/content_items",
    json=payload,
    headers=headers
)

if response.status_code in [200, 201]:
    result = response.json()
    content_id = result[0]["id"] if isinstance(result, list) else result["id"]
    print(f"Created content_item: {content_id}")
    
    # Create vector_job
    job_payload = {
        "content_id": content_id,
        "status": "pending"
    }
    
    job_response = requests.post(
        f"{supabase_url}/rest/v1/vector_jobs",
        json=job_payload,
        headers=headers
    )
    
    if job_response.status_code in [200, 201]:
        print("Vector job created")
    else:
        print(f"Failed to create vector job: {job_response.text}")
else:
    print(f"Failed to create content_item: {response.status_code}")
    print(response.text)

print(f"\nDone! Created {len(chunks)} chunks for '{title}'")
EOF

echo "=== Complete ==="
