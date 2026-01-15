# 🎨 Resizable Panel Layout - Visual Guide

## Before vs After

### Before (Fixed Layout)
```
┌────────────┬─────────────────────────────────┬───────────┐
│            │                                 │           │
│  Channels  │           Canvas                │   Chat    │
│   (256px)  │          (flexible)             │  (320px)  │
│   FIXED    │                                 │   FIXED   │
│            │                                 │           │
└────────────┴─────────────────────────────────┴───────────┘
└───────────────────────────────────────────────────────────┘
│                    Voice Dock (80px)                      │
│                        FIXED                              │
└───────────────────────────────────────────────────────────┘
```

### After (Resizable Layout)
```
┌────────────┬─────────────────────────────────┬───────────┐
│            ║                                 ║           │
│  Channels  ║           Canvas                ║   Chat    │
│  (15-40%)  ║           (30%+)                ║ (15-40%)  │
│ RESIZABLE  ║                                 ║ RESIZABLE │
│     ↔️      ║              ↔️                  ║           │
└────────────╩─────────────────────────────────╩───────────┘
═══════════════════════════════════════════════════════════
                          ↕️
═══════════════════════════════════════════════════════════
│                    Voice Dock (8-30%)                     │
│                      RESIZABLE                            │
└───────────────────────────────────────────────────────────┘

Legend:
║  = Vertical resize handle (drag left/right)
═  = Horizontal resize handle (drag up/down)
↔️  = Horizontal resize direction
↕️  = Vertical resize direction
```

## Interaction Points

### 1. Left Resize Handle (Channels ↔️ Canvas)
```
┌────────────┃
│  Channels  ┃  ← Drag this border
│            ┃
│     ↔️      ┃  ← Cursor changes to ↔️
│            ┃
└────────────┃

Actions:
- Hover: Border highlights (gray → blue)
- Click & Drag Left: Shrinks Channels, expands Canvas
- Click & Drag Right: Expands Channels, shrinks Canvas
- Min: 15% of screen width
- Max: 40% of screen width
```

### 2. Right Resize Handle (Canvas ↔️ Chat)
```
                 ┃───────────┐
  ← Drag this → ┃   Chat    │
                 ┃           │
      ↔️          ┃           │
                 ┃           │
                 ┃───────────┘

Actions:
- Hover: Border highlights (gray → blue)
- Click & Drag Left: Expands Chat, shrinks Canvas
- Click & Drag Right: Shrinks Chat, expands Canvas
- Min: 15% of screen width
- Max: 40% of screen width
```

### 3. Bottom Resize Handle (Content ↕️ Voice Dock)
```
─────────────────────────────────────
          ↑  Drag this border  ↑
═════════════════════════════════════
          ↕️  Cursor: ↕️          ↕️
─────────────────────────────────────
│         Voice Dock                │
─────────────────────────────────────

Actions:
- Hover: Border highlights (gray → blue)
- Click & Drag Up: Expands Voice Dock, shrinks Content
- Click & Drag Down: Shrinks Voice Dock, expands Content
- Min: 8% of screen height
- Max: 30% of screen height
```

## Common Layouts

### 1. Drawing Focus Mode
Maximize canvas space for intensive drawing work.

```
┌─┬────────────────────────────────────────────────┬─┐
│C│                  Canvas                        │C│
│h│                  (EXPANDED)                    │h│
│a│                                                │a│
│n│                    60%+                        │t│
└─┴────────────────────────────────────────────────┴─┘
═══════════════════════════════════════════════════════
│           Voice Dock (MINIMIZED - 8%)               │
═══════════════════════════════════════════════════════

Setup:
1. Drag Channels border right → minimum (15%)
2. Drag Chat border left → minimum (15%)
3. Drag Voice Dock border down → minimum (8%)
Result: Maximum drawing space!
```

### 2. Collaboration Mode
Balanced view for working together.

```
┌──────────┬──────────────────────────┬──────────┐
│          │                          │          │
│ Channels │        Canvas            │   Chat   │
│  (20%)   │        (60%)             │  (20%)   │
│          │                          │          │
└──────────┴──────────────────────────┴──────────┘
═════════════════════════════════════════════════
│           Voice Dock (15%)                      │
═════════════════════════════════════════════════

Setup:
1. Default layout (no changes needed)
Result: Balanced access to all features!
```

### 3. Chat Focus Mode
Great for code reviews and discussions.

```
┌────┬──────────────────────┬──────────────────┐
│    │                      │                  │
│ Ch │      Canvas          │       Chat       │
│ 15%│       45%            │     (EXPANDED)   │
│    │                      │        40%       │
└────┴──────────────────────┴──────────────────┘
═════════════════════════════════════════════════
│           Voice Dock (10%)                     │
═════════════════════════════════════════════════

Setup:
1. Drag Channels border left → minimum (15%)
2. Drag Chat border left → expand to 40%
3. Slightly reduce Voice Dock if needed
Result: Maximum chat visibility!
```

### 4. Presentation Mode
Ideal when screen sharing.

```
┌────┬────────────────────────────────────────┬────┐
│    │                                        │    │
│ C  │           Canvas                       │ C  │
│ 15%│          (EXPANDED)                    │ 15%│
│    │            70%                         │    │
└────┴────────────────────────────────────────┴────┘
═══════════════════════════════════════════════════
│         Voice Dock (EXPANDED - 20%)              │
═══════════════════════════════════════════════════

Setup:
1. Minimize Channels to 15%
2. Minimize Chat to 15%
3. Expand Voice Dock to 20% (larger controls)
Result: Clean canvas with visible controls!
```

## Size Reference Guide

### Percentage to Pixel Approximation
(Based on 1920px width, 1080px height screen)

#### Horizontal Panels (Width)
| % | Pixels | Usage |
|---|--------|-------|
| 15% | ~288px | Minimum sidebar width |
| 20% | ~384px | Default sidebar width |
| 30% | ~576px | Minimum canvas width |
| 40% | ~768px | Maximum sidebar width |
| 60% | ~1152px | Default canvas width |
| 70% | ~1344px | Expanded canvas |

#### Vertical Panels (Height)
| % | Pixels | Usage |
|---|--------|-------|
| 8% | ~86px | Minimum voice dock |
| 15% | ~162px | Default voice dock |
| 20% | ~216px | Comfortable voice dock |
| 30% | ~324px | Maximum voice dock |

## Keyboard Accessibility

The resize handles support keyboard navigation:

```
1. Tab → Navigate to resize handle
   ┌────────┃────────┐
   │        ┃ ← Focus │
   └────────┃────────┘

2. Arrow Keys → Adjust size
   ← / → : Horizontal resize (±2%)
   ↑ / ↓ : Vertical resize (±2%)

3. Enter → Lock/Unlock
   Press Enter to toggle resize mode

4. Escape → Cancel
   Reset to original size
```

## Responsive Behavior

The panels adapt to different screen sizes:

### Desktop (1920x1080+)
- All panels visible
- Full resize functionality
- Comfortable minimum sizes

### Laptop (1366x768)
- All panels visible
- Tighter minimum constraints
- May need to resize for optimal view

### Tablet (1024x768)
- Consider minimizing sidebars
- Focus on one main area
- Portrait mode may stack panels

### Mobile (< 768px)
- Panels stack vertically
- Swipe gestures (future enhancement)
- Simplified controls

## Tips & Tricks

### Quick Resize
1. **Double-width drag**: Click and drag quickly for faster resizing
2. **Edge snapping**: Panels snap to min/max sizes near edges
3. **Proportional resize**: Canvas expands/shrinks to fill space

### Visual Cues
- **Gray border** = Inactive resize handle
- **Blue/Primary border** = Active (hovering) resize handle
- **Cursor change** = Ready to resize (↔️ or ↕️)
- **Smooth animation** = 200ms transition on hover

### Constraints
- Canvas always maintains **at least 30%** width
- Sidebars limited to **15-40%** width range
- Voice dock limited to **8-30%** height range
- Total width always equals 100%

### Troubleshooting
- **Can't drag smaller?** → You've hit the minimum size
- **Can't drag larger?** → You've hit the maximum size
- **Handle not responding?** → Make sure you're hovering over the border
- **Wrong cursor?** → Move slightly to activate the handle

---

**Pro Tip:** Experiment with different layouts to find what works best for your workflow. The layout will persist during your session, so you can customize it once and keep working!
