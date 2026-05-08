# 📋 Code Cleanup Deliverables

**Scan Date:** May 6, 2026  
**Workspace:** `D:\KHOA_LUAN\LUAN_AN\DoAnTichHop`

---

## 📁 Generated Files

### 1. **CODE_CLEANUP_ANALYSIS.md** 📊
**Comprehensive technical analysis**
- Detailed breakdown of all issues
- Line-by-line code examples
- Top 20 files with most problems
- Metrics and timeline
- Best practices guide
- ESLint configuration examples

**Cách sử dụng:** Tham khảo khi cần hiểu chi tiết vấn đề

---

### 2. **CLEANUP_SUMMARY.md** 🚀
**Executive summary (1-2 pages)**
- Top 5 files to fix
- Priority classification (HIGH/MEDIUM/LOW)
- Quick statistics
- Tools recommendations
- Timeline estimate

**Cách sử dụng:** Báo cáo cho management/team lead

---

### 3. **cleanup.ps1** 🔧 (PowerShell - Windows)
**Automated cleanup tool for Windows**

**Cách sử dụng:**
```powershell
# Interactive mode (recommended)
.\cleanup.ps1

# Or specific action
.\cleanup.ps1 -Action find-console
.\cleanup.ps1 -Action find-useeffect
.\cleanup.ps1 -Action find-keys
.\cleanup.ps1 -Action report
.\cleanup.ps1 -Action remove
.\cleanup.ps1 -Action restore
.\cleanup.ps1 -Action full
```

**Các chức năng:**
- Find console.log instances
- Find useEffect issues
- Find missing keys in .map()
- Generate report
- Remove console.log (with automatic backup)
- Restore from backup
- Run ESLint checks

---

### 4. **cleanup.sh** 🔧 (Bash - Mac/Linux)
**Automated cleanup tool for Mac/Linux**

**Cách sử dụng:**
```bash
# Make executable
chmod +x cleanup.sh

# Interactive mode
./cleanup.sh

# Or specific action
./cleanup.sh find-console
./cleanup.sh find-useeffect
./cleanup.sh find-keys
./cleanup.sh report
./cleanup.sh remove
./cleanup.sh restore
./cleanup.sh full
```

---

## 🎯 Quick Start Guide

### Step 1: Review the Analysis
```bash
# Open comprehensive analysis
CODE_CLEANUP_ANALYSIS.md

# Or quick summary
CLEANUP_SUMMARY.md
```

### Step 2: Scan Your Code
**Windows:**
```powershell
.\cleanup.ps1 -Action find-console
.\cleanup.ps1 -Action find-useeffect
.\cleanup.ps1 -Action find-keys
.\cleanup.ps1 -Action report
```

**Mac/Linux:**
```bash
./cleanup.sh find-console
./cleanup.sh find-useeffect
./cleanup.sh find-keys
./cleanup.sh report
```

### Step 3: Fix Issues

#### Option A: Manual Fixes (Recommended for first pass)
1. Open files one by one from the report
2. Use Find & Replace (Ctrl+H) to remove console.log
3. Review and commit each fix

#### Option B: Automated Fixes
**Use the script with caution - creates backups automatically:**

```powershell
# Windows
.\cleanup.ps1 -Action remove

# Restore if needed
.\cleanup.ps1 -Action restore
```

### Step 4: Verify
```bash
npm run lint
npm run test
```

---

## 📊 Statistics

### Scan Results
| Issue | Count | Priority | Effort |
|-------|-------|----------|--------|
| console.log | 65+ | 🔴 HIGH | 2 hrs |
| useEffect | 20+ | 🔴 HIGH | 4 hrs |
| map() keys | 8+ | 🔴 HIGH | 2 hrs |
| Inline functions | 15+ | 🟡 MED | 4 hrs |
| TODO/FIXME | 3 | 🟡 MED | 1 hr |
| Type safety | 5+ | 🟡 MED | 3 hrs |
| Unused imports | 10+ | 🟢 LOW | 2 hrs |
| **TOTAL** | **150+** | - | **~18 hrs** |

---

## 🔴 High Priority (Do First)

### 1. Remove console.log (65+ instances)
**Files:** 
- MaintenanceTeam_Table.jsx (13)
- ReceptForm.jsx (14)
- phoneAuth.service.js (9)
- usePhoneAuth.js (7)
- PhoneAuthVerification.jsx (6)

**Manual fix example:**
```javascript
// ❌ REMOVE THESE
console.log("[DEBUG] useEffect for leaders mounted");
console.log("[DEBUG] API Response:", res);
console.log("[DEBUG] ======= FULL API RESPONSE =======");

// ✅ KEEP ONLY
console.error("Critical error:", error);
console.warn("Deprecation warning", warning);
```

### 2. Fix useEffect dependencies (20+ instances)
**Example fix:**
```javascript
// ❌ WRONG - runs on every render
useEffect(() => {
  fetchData();
});

// ✅ CORRECT - runs once on mount
useEffect(() => {
  fetchData();
}, []);

// ✅ CORRECT - runs when dependency changes
useEffect(() => {
  if (userId) {
    fetchData(userId);
  }
}, [userId]);
```

### 3. Add keys to .map() (8+ instances)
**Example fix:**
```javascript
// ❌ WRONG - no key
{items.map((item) => (
  <div>{item.name}</div>
))}

// ✅ CORRECT - has key
{items.map((item) => (
  <div key={item.id}>{item.name}</div>
))}
```

---

## 🟡 Medium Priority (Next Sprint)

### 4. Refactor inline functions
```javascript
// ❌ WRONG - function created on every render
<button onClick={() => handleClick()}>Click</button>

// ✅ CORRECT - use useCallback
const handleClick = useCallback(() => {
  // ...
}, [dependencies]);

<button onClick={handleClick}>Click</button>
```

### 5. Resolve TODO/FIXME
- PhoneAuthVerification.jsx (line 131)
- PhoneAuthExample.jsx (line 48)
- SignIn.jsx (line 192)

### 6. Add PropTypes
```javascript
import PropTypes from 'prop-types';

function MyComponent({ title, onClick }) {
  return <button onClick={onClick}>{title}</button>;
}

MyComponent.propTypes = {
  title: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};
```

---

## 🟢 Low Priority (When Time Permits)

### 7. Remove unused imports
```javascript
// ❌ REMOVE UNUSED
import { UnusedComponent, UsedComponent } from './components';

// ✅ KEEP ONLY USED
import { UsedComponent } from './components';
```

---

## 🛠️ ESLint Configuration

Add to `.eslintrc.json`:
```json
{
  "rules": {
    "no-console": ["warn", { "allow": ["warn", "error"] }],
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "react/jsx-key": "error",
    "no-unused-vars": "warn"
  }
}
```

Then run:
```bash
npm run lint -- --fix
```

---

## 📈 Progress Tracking

### Week 1 (Priority: HIGH)
- [ ] Day 1-2: Remove console.log (65+ instances)
- [ ] Day 3: Fix useEffect dependencies (20+ instances)
- [ ] Day 4-5: Add missing keys (8+ instances)
- [ ] Day 6-7: Testing & review

### Week 2 (Priority: MEDIUM)
- [ ] Day 1-2: Refactor inline functions
- [ ] Day 3-4: Resolve TODO/FIXME
- [ ] Day 5-7: Add PropTypes/TypeScript

### Week 3 (Priority: LOW)
- [ ] Remove unused imports
- [ ] Final testing & commit

---

## 🔍 Verification Checklist

- [ ] All console.log removed ✓
- [ ] All useEffect has dependency array ✓
- [ ] All .map() has key prop ✓
- [ ] All TODO/FIXME resolved ✓
- [ ] All PropTypes added ✓
- [ ] All unused imports removed ✓
- [ ] ESLint passes: `npm run lint` ✓
- [ ] Tests pass: `npm run test` ✓
- [ ] No React warnings in console ✓

---

## 📝 Commit Message Templates

```bash
# Remove console.log
git commit -m "chore: remove console.log statements

Removes 65+ console.log debug statements from:
- MaintenanceTeam_Table.jsx
- ReceptForm.jsx
- phoneAuth services

Related: Code Cleanup #123"

# Fix useEffect
git commit -m "fix: add missing useEffect dependencies

Adds proper dependency arrays to 20+ useEffect calls
to prevent infinite loops and memory leaks.

Related: Code Cleanup #123"

# Add keys to maps
git commit -m "fix: add missing keys to .map() iterations

Adds key prop to 8+ .map() calls to fix React
warnings and improve rendering performance.

Related: Code Cleanup #123"
```

---

## 💡 Tips & Tricks

### Find & Replace in VS Code
1. Press `Ctrl+H` (Cmd+H on Mac)
2. Find: `console\.log\([^)]*\);?\n?`
3. Replace: (leave empty)
4. Enable Regex: `Alt+R`
5. Replace All

### Check specific file
```bash
# Windows
Select-String -Path "frontend/src/components/MyComponent.jsx" -Pattern "console\."

# Mac/Linux
grep -n "console\." frontend/src/components/MyComponent.jsx
```

### Run incremental fixes
```bash
# Fix lint issues automatically
npx eslint frontend/src --fix

# Only console rules
npx eslint frontend/src --fix --rule "no-console: error"
```

---

## 📞 Support

For questions about:
- **ESLint config:** See .eslintrc.json
- **Scripts:** See cleanup.ps1 / cleanup.sh
- **Details:** See CODE_CLEANUP_ANALYSIS.md
- **Timeline:** See CLEANUP_SUMMARY.md

---

## ✅ Done!

**What's included:**
1. ✅ Comprehensive analysis report
2. ✅ Executive summary
3. ✅ Windows automation script (PowerShell)
4. ✅ Unix automation script (Bash)
5. ✅ This guide

**Next steps:**
1. Review `CLEANUP_SUMMARY.md`
2. Run appropriate cleanup script
3. Fix issues following the guide
4. Run ESLint & tests
5. Commit changes

---

**Last Updated:** May 6, 2026  
**Status:** Ready for implementation
