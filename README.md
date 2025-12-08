<div align="center">
  <img src="https://github.com/andrecb/aura-cursor/blob/main/assets/images/logo.png?raw=true" alt="Aura Cursor Logo" width="200" />
  
  # ✨ Aura Cursor
  
  A lightweight, customizable cursor library for modern web applications. Create beautiful custom cursors that follow your mouse with smooth animations and interactive hover effects.
  
  **[🎮 Try it live](https://andrebarros.dev/projects/aura-cursor)**
</div>

## Features

- 🎨 **Customizable Design** - Size, color, opacity, and speed controls
- 🖱️ **Smart Detection** - Automatically detects interactive elements (links, buttons, etc.)
- 🎯 **Pointer Effects** - Different styles when hovering over clickable elements
- ⚡ **Smooth Animation** - Fluid cursor movement with configurable speed
- 🎭 **Flexible Options** - Hide default cursor, interactive-only mode, outline mode, and more
- 🌈 **Hover Colors** - Custom colors when hovering over interactive elements
- 📦 **Lightweight** - Small bundle size with zero dependencies
- 🔧 **TypeScript** - Full TypeScript support with type definitions
- 👁️ **Center Dot Indicator** - Small dot in the center when default cursor is hidden
- 🪟 **Smart Visibility** - Automatically hides when mouse leaves the browser window

## Installation

### npm

```bash
npm install aura-cursor
```

### yarn

```bash
yarn add aura-cursor
```

### pnpm

```bash
pnpm add aura-cursor
```

## 🎮 Live Demo

Try Aura Cursor in action: **[https://andrebarros.dev/projects/aura-cursor](https://andrebarros.dev/projects/aura-cursor)**

## Quick Start

### Basic Usage

```typescript
import { AuraCursor } from 'aura-cursor';

// Create cursor instance
const cursor = new AuraCursor({
  size: 20,
  color: '#000000',
  opacity: 0.5,
  speed: 0.3
});

// Initialize the cursor
cursor.init();
```

### HTML/JavaScript

```html
<script src="https://unpkg.com/aura-cursor/dist/index.umd.js"></script>
<script>
  const cursor = new AuraCursor.AuraCursor({
    size: 20,
    color: '#000000'
  });
  
  cursor.init();
</script>
```

### React

#### Using the Hook

```tsx
import { useAuraCursor } from 'aura-cursor';

function App() {
  useAuraCursor({
    size: 20,
    color: '#000000',
    opacity: 0.5,
    speed: 0.3
  });

  return <div>Your app content</div>;
}
```

#### Using the Component

```tsx
import { AuraCursor } from 'aura-cursor/react';

function App() {
  return (
    <>
      <AuraCursor
        size={20}
        color="#000000"
        opacity={0.5}
        speed={0.3}
      />
      <div>Your app content</div>
    </>
  );
}
```

The component also supports an `enabled` prop to conditionally enable/disable the cursor:

```tsx
import { AuraCursor } from 'aura-cursor/react';
import { useState } from 'react';

function App() {
  const [enabled, setEnabled] = useState(true);

  return (
    <>
      <AuraCursor
        enabled={enabled}
        size={20}
        color="#000000"
      />
      <button onClick={() => setEnabled(!enabled)}>
        Toggle Cursor
      </button>
    </>
  );
}
```

**Note**: When importing from `'aura-cursor'`, you get the `AuraCursor` class. When importing from `'aura-cursor/react'`, you get the `AuraCursor` React component. Both share the same name but serve different purposes.

## Configuration Options

### AuraCursorOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `size` | `number` | `20` | Circle size in pixels |
| `color` | `string` | `'#000000'` | Circle color (hex, rgb, etc.) |
| `opacity` | `number` | `0.5` | Circle opacity (0 to 1) |
| `speed` | `number` | `0.3` | Mouse follow speed (0 to 1) |
| `hideDefaultCursor` | `boolean` | `false` | Hide the default browser cursor |
| `className` | `string` | `''` | Additional CSS class for cursor element |
| `interactiveOnly` | `boolean` | `false` | Show cursor only on interactive elements |
| `outlineMode` | `boolean` | `false` | Show cursor as outline (border only) with center dot |
| `outlineWidth` | `number` | `2` | Border width in pixels when outline mode is enabled |
| `cursorDotColor` | `string` | `undefined` | Color for the center dot in outline mode (uses primary color if not provided) |
| `hoverColor` | `string` | `undefined` | Color when hovering over interactive elements (uses primary color or pointer color if not provided) |
| `pointer` | `AuraCursorPointerOptions` | `undefined` | Options for pointer hover effects |

### AuraCursorPointerOptions

Configure how the cursor changes when hovering over clickable elements:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `size` | `number` | `undefined` | Size when hovering (uses default if not set) |
| `color` | `string` | `undefined` | Color when hovering (uses default if not set) |
| `opacity` | `number` | `undefined` | Opacity when hovering (uses default if not set) |
| `scale` | `number` | `1.5` | Scale multiplier when hovering |

## Examples

### Basic Custom Cursor

```typescript
import { AuraCursor } from 'aura-cursor';

const cursor = new AuraCursor({
  size: 30,
  color: '#ff6b6b',
  opacity: 0.6,
  speed: 0.2
});

cursor.init();
```

### With Pointer Effects

```typescript
import { AuraCursor } from 'aura-cursor';

const cursor = new AuraCursor({
  size: 20,
  color: '#000000',
  opacity: 0.5,
  pointer: {
    size: 30,
    color: '#ff6b6b',
    opacity: 0.8,
    scale: 1.5
  }
});

cursor.init();
```

### Hide Default Cursor

```typescript
import { AuraCursor } from 'aura-cursor';

const cursor = new AuraCursor({
  size: 25,
  color: '#ffffff',
  opacity: 0.7,
  hideDefaultCursor: true
});

cursor.init();
```

When `hideDefaultCursor` is enabled, a small center dot will appear to indicate the exact cursor position, following the mouse instantly while the outer circle follows with the configured speed.

### Interactive Only Mode

```typescript
import { AuraCursor } from 'aura-cursor';

const cursor = new AuraCursor({
  size: 20,
  color: '#000000',
  interactiveOnly: true
});

cursor.init();
```

When `interactiveOnly` is enabled, the cursor will only appear when hovering over interactive elements (links, buttons, etc.). The cursor will automatically hide when the mouse leaves interactive areas or exits the browser window.

### Outline Mode

```typescript
import { AuraCursor } from 'aura-cursor';

const cursor = new AuraCursor({
  size: 20,
  color: '#000000',
  opacity: 0.5,
  outlineMode: true,
  outlineWidth: 2,
  cursorDotColor: '#ff0000'
});

cursor.init();
```

This mode displays the cursor as a border-only circle with a center dot, instead of a filled circle. The inner dot follows the mouse instantly, while the outer circle follows with a smooth delay. You can customize the border width using the `outlineWidth` option (default: 2px) and the center dot color using `cursorDotColor`.

### With Hover Color

```typescript
import { AuraCursor } from 'aura-cursor';

const cursor = new AuraCursor({
  size: 20,
  color: '#000000',
  hoverColor: '#ff6b6b',
  pointer: {
    size: 30,
    scale: 1.5
  }
});

cursor.init();
```

The `hoverColor` option allows you to set a specific color that will be used when hovering over interactive elements. This color takes precedence over the `pointer.color` option.

### Update Options Dynamically

```typescript
import { AuraCursor } from 'aura-cursor';

const cursor = new AuraCursor({
  size: 20,
  color: '#000000'
});

cursor.init();

// Update options later
cursor.updateOptions({
  size: 40,
  color: '#ff0000',
  opacity: 0.8
});
```

### Destroy Cursor

```typescript
// Remove cursor and clean up
cursor.destroy();
```

## API Reference

### Methods

#### `init(): void`

Initializes the custom cursor. Creates the cursor element and attaches event listeners.

```typescript
cursor.init();
```

#### `destroy(): void`

Removes the custom cursor and cleans up all event listeners and DOM elements.

```typescript
cursor.destroy();
```

#### `updateOptions(options: Partial<AuraCursorOptions>): void`

Updates cursor options dynamically without recreating the cursor.

```typescript
cursor.updateOptions({
  size: 30,
  color: '#ff0000'
});
```

## TypeScript Support

The library is written in TypeScript and provides full type definitions. All interfaces are exported for use in your TypeScript projects:

```typescript
import type { 
  AuraCursorOptions, 
  AuraCursorPointerOptions, 
  AuraCursorProps 
} from 'aura-cursor';

// Use the types in your code
const options: AuraCursorOptions = {
  size: 20,
  color: '#000000',
  hoverColor: '#ff0000'
};

// Extend interfaces if needed
interface ExtendedOptions extends AuraCursorOptions {
  customProperty?: string;
}
```

## Element Detection

The cursor automatically detects interactive elements including:

- Links (`<a>`)
- Buttons (`<button>`)
- Elements with `role="button"`
- Elements with `onclick` handlers
- Elements with `cursor: pointer` in CSS
- Interactive inputs (range, color, checkbox)
- Elements inside clickable containers

The cursor also automatically hides when the mouse leaves the browser window (e.g., when moving to the address bar or outside the viewport).

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

### Clone the repository

```bash
git clone https://github.com/andrecb/aura-cursor.git
cd aura-cursor
```

### Install dependencies

```bash
npm install
```

### Build

```bash
npm run build
```

### Run tests

```bash
npm test
```

### Run example

```bash
npm run example
```

This will build the project and start a local server at `http://localhost:8080` with the example page.

## Versioning

This project follows [Semantic Versioning](https://semver.org/) (SemVer).

### Version Format

Version numbers follow the pattern: `MAJOR.MINOR.PATCH`

- **MAJOR** version when you make incompatible API changes
- **MINOR** version when you add functionality in a backward compatible manner
- **PATCH** version when you make backward compatible bug fixes

### Versioning Scripts

The project includes npm scripts to help with versioning:

```bash
# Bump patch version (1.0.0 -> 1.0.1)
npm run version:patch

# Bump minor version (1.0.0 -> 1.1.0)
npm run version:minor

# Bump major version (1.0.0 -> 2.0.0)
npm run version:major
```

These scripts will:
1. Update the version in `package.json`
2. Create a git commit with the version change
3. Create a git tag for the new version

### Release Process

Before releasing a new version:

1. Update the `CHANGELOG.md` with the changes
2. Run tests: `npm run test:run`
3. Build the project: `npm run build`
4. Bump the version using the appropriate script
5. Push to repository: `git push && git push --tags`
6. Publish to npm: `npm publish`

## License

MIT © [André Barros](https://github.com/andrecb)

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Author

**André Barros**

- Email: contato@andrebarros.dev
- GitHub: [@andrecb](https://github.com/andrecb)

---

Made with ❤️ by [André Barros](https://andrebarros.dev)

