#!/bin/bash
#utils/analyzeNode.sh
# Output file location
OUTPUT_DIR="./archive"
OUTPUT_FILE="$OUTPUT_DIR/node_analysis.txt"

# Ensure the archive directory exists
mkdir -p "$OUTPUT_DIR"

# Clear the output file if it exists
> "$OUTPUT_FILE"

# Analyze Node.js server files and save to the output file
git ls-files '*.js' | while read file; do  
  echo "$file:" >> "$OUTPUT_FILE";
  grep -E '^(const|let|function|async|await|require|module\.exports|exports|app\.use|app\.(get|post|put|delete|patch))' "$file" | sed 's/^/    /' >> "$OUTPUT_FILE"; 
  echo >> "$OUTPUT_FILE";
done

echo "Node analysis saved to $OUTPUT_FILE"