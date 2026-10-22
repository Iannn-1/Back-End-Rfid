# 🎯 School ID Quick Reference

## Format
```
YYYY-NNNN
2026-8813
 ↑    ↑
Year  Last 4 digits (editable)
```

## Key Points
- ✅ **Year**: Auto-updates to current year
- ✅ **Digits**: Only numbers 0-9 allowed
- ✅ **Length**: Exactly 4 digits
- ✅ **Unique**: No duplicates allowed
- ✅ **Auto-gen**: Leave empty to auto-generate

## Where It Appears
1. **Student Table** - School ID column
2. **Student Form** - Input field with year prefix
3. **Mobile Monitor** - Shows on RFID scan
4. **Student Profile** - Displays prominently

## Commands
```bash
# Run migration (already done ✅)
npm run migrate:schoolid

# Start backend
cd BACK-END-RFID
npm run dev

# Start frontend
cd FRONT-END-RFID
npm run dev
```

## Input Examples
| You Type | System Saves |
|----------|--------------|
| `8813` | `2026-8813` |
| `abc123` | `2026-0123` (letters filtered) |
| (empty) | `2026-0003` (auto-generated) |
| `12` | `2026-0012` (padded) |
| `123456` | `2026-1234` (truncated to 4) |

## Status: ✅ READY TO USE
