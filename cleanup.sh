#!/bin/bash

# ============================================
# Code Cleanup Script for frontend/src
# ============================================
# Sử dụng: bash cleanup.sh [option]
# ============================================

set -e  # Exit on error

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
FRONTEND_SRC="${SCRIPT_DIR}/frontend/src"

echo "🧹 Code Cleanup Script"
echo "===================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ============================================
# 1. Remove console.log statements
# ============================================
remove_console_logs() {
    echo -e "${YELLOW}[1/5] Removing console.log statements...${NC}"
    
    # Backup first
    find "$FRONTEND_SRC" -type f \( -name "*.jsx" -o -name "*.js" \) \
        -exec cp {} {}.backup \;
    echo "✅ Backup created (.backup files)"
    
    # Remove console.log, console.error, console.warn (keep error handling)
    # This is simple - just removes lines with console.
    # For production, you might want to keep console.error/warn
    find "$FRONTEND_SRC" -type f \( -name "*.jsx" -o -name "*.js" \) \
        -exec sed -i '/^[[:space:]]*console\.\(log\|debug\)/d' {} \;
    
    echo -e "${GREEN}✅ Removed console.log/debug statements${NC}"
    
    # Count removed
    COUNT=$(grep -r "console\.log\|console\.debug" "$FRONTEND_SRC" --include="*.jsx" --include="*.js" | wc -l || true)
    if [ "$COUNT" -eq 0 ]; then
        echo "✅ All console.log removed!"
    else
        echo -e "${YELLOW}⚠️  Found $COUNT remaining console.log (verify manually)${NC}"
    fi
}

# ============================================
# 2. Find console.log instances
# ============================================
find_console_logs() {
    echo -e "${YELLOW}Scanning for console.log instances...${NC}"
    
    RESULTS=$(find "$FRONTEND_SRC" -type f \( -name "*.jsx" -o -name "*.js" \) \
        -exec grep -l "console\." {} \;)
    
    FILE_COUNT=$(echo "$RESULTS" | grep -c . || echo 0)
    
    echo -e "${GREEN}Found in $FILE_COUNT files:${NC}"
    while IFS= read -r file; do
        COUNT=$(grep -c "console\." "$file" || true)
        echo "  - $(basename "$file"): $COUNT instances"
    done <<< "$RESULTS"
}

# ============================================
# 3. Find useEffect without dependencies
# ============================================
find_use_effect_issues() {
    echo -e "${YELLOW}Scanning for useEffect issues...${NC}"
    
    # This is a simple check - look for useEffect not followed by dependency array
    # More sophisticated: use AST parser
    find "$FRONTEND_SRC" -type f \( -name "*.jsx" -o -name "*.js" \) \
        -print0 | xargs -0 grep -n "useEffect" | head -20
}

# ============================================
# 4. Find missing keys in .map()
# ============================================
find_missing_keys() {
    echo -e "${YELLOW}Scanning for missing keys in .map()...${NC}"
    
    # This is approximate - looks for .map( without key=
    find "$FRONTEND_SRC" -type f \( -name "*.jsx" -o -name "*.js" \) \
        -print0 | xargs -0 grep -n "\.map(" | grep -v "key=" | head -15
}

# ============================================
# 5. Generate report
# ============================================
generate_report() {
    echo -e "${YELLOW}Generating cleanup report...${NC}"
    
    REPORT="${SCRIPT_DIR}/CLEANUP_REPORT_$(date +%Y%m%d_%H%M%S).txt"
    
    {
        echo "=== Code Cleanup Report ==="
        echo "Generated: $(date)"
        echo ""
        
        echo "## Console.log Instances"
        find "$FRONTEND_SRC" -type f \( -name "*.jsx" -o -name "*.js" \) \
            -exec grep -l "console\." {} \; | wc -l
        echo ""
        
        echo "## useEffect Instances"
        find "$FRONTEND_SRC" -type f \( -name "*.jsx" -o -name "*.js" \) \
            -exec grep -c "useEffect" {} + | awk -F: '{sum+=$2} END {print sum}'
        echo ""
        
        echo "## Files with most issues"
        echo "### console.log count by file:"
        find "$FRONTEND_SRC" -type f \( -name "*.jsx" -o -name "*.js" \) \
            -exec grep -c "console\." {} + | sort -t: -k2 -rn | head -10
        
    } > "$REPORT"
    
    echo -e "${GREEN}Report saved to: $REPORT${NC}"
}

# ============================================
# 6. Restore from backup
# ============================================
restore_backup() {
    echo -e "${YELLOW}Restoring from backup...${NC}"
    
    find "$FRONTEND_SRC" -name "*.backup" -type f | while read backup; do
        original="${backup%.backup}"
        mv "$backup" "$original"
        echo "Restored: $(basename $original)"
    done
    
    echo -e "${GREEN}Restore complete${NC}"
}

# ============================================
# 7. ESLint Check
# ============================================
run_eslint() {
    echo -e "${YELLOW}Running ESLint...${NC}"
    
    if command -v eslint &> /dev/null; then
        eslint "$FRONTEND_SRC" --ext .js,.jsx,.ts,.tsx --max-warnings 0
        echo -e "${GREEN}ESLint passed${NC}"
    else
        echo -e "${RED}ESLint not installed${NC}"
        echo "Install: npm install --save-dev eslint eslint-plugin-react eslint-plugin-react-hooks"
    fi
}

# ============================================
# Main Menu
# ============================================
show_menu() {
    echo ""
    echo "Options:"
    echo "1) Find console.log instances"
    echo "2) Find useEffect issues"
    echo "3) Find missing keys in maps"
    echo "4) Generate cleanup report"
    echo "5) Remove console.log (with backup)"
    echo "6) Restore from backup"
    echo "7) Run ESLint checks"
    echo "8) Full cleanup pipeline"
    echo "q) Quit"
    echo ""
    read -p "Choose option [1-8, q]: " choice
}

# ============================================
# Execute
# ============================================
if [ $# -eq 0 ]; then
    # Interactive mode
    while true; do
        show_menu
        case $choice in
            1) find_console_logs ;;
            2) find_use_effect_issues ;;
            3) find_missing_keys ;;
            4) generate_report ;;
            5) remove_console_logs ;;
            6) restore_backup ;;
            7) run_eslint ;;
            8) 
                find_console_logs
                find_use_effect_issues
                find_missing_keys
                generate_report
                ;;
            q|Q) echo "Goodbye!"; exit 0 ;;
            *) echo "Invalid option" ;;
        esac
    done
else
    # Command line mode
    case $1 in
        find-console) find_console_logs ;;
        find-useeffect) find_use_effect_issues ;;
        find-keys) find_missing_keys ;;
        report) generate_report ;;
        remove) remove_console_logs ;;
        restore) restore_backup ;;
        eslint) run_eslint ;;
        full) 
            find_console_logs
            find_use_effect_issues
            find_missing_keys
            generate_report
            ;;
        *)
            echo "Usage: $0 [find-console|find-useeffect|find-keys|report|remove|restore|eslint|full]"
            exit 1
            ;;
    esac
fi
