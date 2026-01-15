# Resizable Panels Feature

## Overview
The DevCanvas application now features fully resizable panels, allowing you to customize your workspace layout to suit your preferences.

## How to Use

### Resizing Panels

1. **Horizontal Resizing** - Adjust the width of sidebars and canvas:
   - Hover over the vertical divider between the **Channels** sidebar and **Canvas**
   - Click and drag left or right to resize
   - Do the same between **Canvas** and **Chat** sidebar

2. **Vertical Resizing** - Adjust the height of the voice dock:
   - Hover over the horizontal divider between the main content and **Voice Dock**
   - Click and drag up or down to resize

### Panel Constraints

Each panel has minimum and maximum size constraints to ensure usability:

- **Channels Sidebar** (Left):
  - Default: 20% of width
  - Min: 15% of width
  - Max: 40% of width

- **Canvas** (Center):
  - Default: 60% of width
  - Min: 30% of width
  - No maximum (flexible)

- **Chat Sidebar** (Right):
  - Default: 20% of width
  - Min: 15% of width
  - Max: 40% of width

- **Voice Dock** (Bottom):
  - Default: 15% of height
  - Min: 8% of height
  - Max: 30% of height

### Visual Feedback

- Resize handles appear as thin borders between panels
- Handles highlight when you hover over them
- The cursor changes to indicate the resize direction

## Benefits

- **Personalized Workspace**: Adjust panel sizes to match your workflow
- **More Canvas Space**: Minimize sidebars when focusing on drawing
- **Better Chat Visibility**: Expand the chat panel when collaborating
- **Flexible Voice Controls**: Adjust the voice dock size as needed

## Technical Details

The resizable panels feature is built using:
- **react-resizable-panels**: A lightweight, performant React library
- **Smooth animations**: Hover effects on resize handles
- **Persistent state**: Panel sizes are maintained within your session
- **Responsive design**: Works seamlessly across different screen sizes
