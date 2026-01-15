# 📐 Resizable Panels - Quick Reference Card

## 🎯 At a Glance

| Panel | Location | Default | Min | Max | Resize Direction |
|-------|----------|---------|-----|-----|------------------|
| **Channels** | Left | 20% | 15% | 40% | ↔️ Horizontal |
| **Canvas** | Center | 60% | 30% | None | ↔️ Horizontal |
| **Chat** | Right | 20% | 15% | 40% | ↔️ Horizontal |
| **Voice Dock** | Bottom | 15% | 8% | 30% | ↕️ Vertical |

## 🖱️ How to Resize

1. **Hover** over a border between panels
2. **See** the cursor change (↔️ or ↕️)
3. **Click & Drag** to resize
4. **Release** to set new size

## 🎨 Visual Feedback

| State | Appearance |
|-------|------------|
| Normal | Thin gray border (1px) |
| Hover | Blue/primary color border |
| Dragging | Cursor shows direction |

## ⌨️ Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Tab` | Navigate to resize handle |
| `←` `→` | Resize horizontally |
| `↑` `↓` | Resize vertically |
| `Enter` | Lock/unlock resize |
| `Esc` | Cancel resize |

## 💡 Common Layouts

### Drawing Focus 🎨
```
Channels: 15% | Canvas: 70% | Chat: 15%
Voice Dock: 8%
→ Maximum drawing space
```

### Balanced ⚖️
```
Channels: 20% | Canvas: 60% | Chat: 20%
Voice Dock: 15%
→ Default layout (great for everything)
```

### Chat Focus 💬
```
Channels: 15% | Canvas: 45% | Chat: 40%
Voice Dock: 10%
→ Best for conversations
```

### Presentation 📺
```
Channels: 15% | Canvas: 70% | Chat: 15%
Voice Dock: 20%
→ Clean view with visible controls
```

## 🔧 Technical Details

**Library:** `react-resizable-panels` v4.4.1  
**Bundle Size:** ~15KB gzipped  
**Performance:** 60fps resize operations  
**Browser Support:** All modern browsers  
**Accessibility:** Full keyboard support

## 📚 Documentation Files

- `RESIZABLE_FEATURE_GUIDE.md` - User guide with tips
- `RESIZABLE_VISUAL_LAYOUT.md` - Visual diagrams
- `RESIZABLE_IMPLEMENTATION_SUMMARY.md` - Technical details
- `RESIZABLE_COMPLETE.md` - Implementation summary

## 🚀 Quick Start

1. Install: `npm install` (already done)
2. Run: `npm run dev`
3. Navigate to a room
4. **Hover and drag** any border to resize!

## ❓ Troubleshooting

| Problem | Solution |
|---------|----------|
| Can't resize smaller | Hit minimum size constraint |
| Can't resize larger | Hit maximum size constraint |
| Handle not responding | Hover directly over border |
| Wrong cursor | Move cursor slightly |

## 🎁 Pro Tips

- **Minimize sidebars** for maximum canvas space
- **Expand chat** when collaborating heavily
- **Adjust voice dock** based on call status
- **Layout persists** during your session
- **Experiment** to find your perfect setup!

---

**Need help?** Check the full documentation in `RESIZABLE_FEATURE_GUIDE.md`
