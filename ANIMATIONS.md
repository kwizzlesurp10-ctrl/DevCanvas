# Animation Guide

This project includes custom animations built with Tailwind CSS v4. All animations are defined in `app/globals.css` and work seamlessly with Turbopack.

## Available Animations

### Fade Animations
- `animate-fade-in` - Fade in element (0.2s)
- `animate-fade-out` - Fade out element (0.2s)

### Slide Animations
- `animate-slide-in-top` - Slide in from top (0.3s)
- `animate-slide-in-bottom` - Slide in from bottom (0.3s)
- `animate-slide-in-left` - Slide in from left (0.3s)
- `animate-slide-in-right` - Slide in from right (0.3s)

### Scale Animations
- `animate-scale-in` - Scale in from 95% to 100% (0.2s)
- `animate-scale-out` - Scale out from 100% to 95% (0.2s)

### Special Animations
- `animate-bounce-in` - Bouncy entrance animation (0.6s)
- `animate-spin-slow` - Slow continuous rotation (3s infinite)
- `animate-pulse-slow` - Slow pulsing opacity (3s infinite)

## Usage Examples

### Basic Usage
```tsx
<div className="animate-fade-in">
  Content that fades in
</div>
```

### With Delay
```tsx
<div 
  className="animate-fade-in" 
  style={{ animationDelay: '0.2s' }}
>
  Content with delayed animation
</div>
```

### Combining with Tailwind Classes
```tsx
<Card className="animate-scale-in hover:scale-105 transition-transform">
  Animated card
</Card>
```

### Sequential Animations
```tsx
<div className="space-y-4">
  <div className="animate-slide-in-left">Item 1</div>
  <div className="animate-slide-in-left" style={{ animationDelay: '0.1s' }}>Item 2</div>
  <div className="animate-slide-in-left" style={{ animationDelay: '0.2s' }}>Item 3</div>
</div>
```

## Built-in Tailwind Animations

You can also use Tailwind's built-in animations:
- `animate-spin` - Fast rotation
- `animate-pulse` - Fast pulsing
- `animate-bounce` - Bouncing animation
- `animate-ping` - Ping effect

## Customizing Animations

To customize animations, edit the `@keyframes` definitions and animation utilities in `app/globals.css`:

```css
@keyframes your-custom-animation {
  /* Define your animation */
}

.animate-your-custom {
  animation: your-custom-animation 0.3s ease-out;
}
```

## Performance Tips

1. **Use `transform` and `opacity`** - These properties are GPU-accelerated
2. **Avoid animating `width`, `height`, `margin`** - These cause layout reflows
3. **Use `will-change` sparingly** - Only when necessary for performance
4. **Prefer CSS animations over JavaScript** - Better performance

## Browser Support

All animations use standard CSS properties and are supported in all modern browsers:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
