# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.4.1] - 2025-12-08

### Fixed
- Fixed `requestAnimationFrame is not defined` error in test environment
- Improved test setup with proper global and window mock configuration
- Ensured all pending RAF callbacks are cleaned up after each test

### Changed
- Updated package keywords to be more relevant and concise for better discoverability

## [1.4.0] - 2025-12-08

### Added
- Mobile accessibility: cursor automatically disables on mobile devices and small screens
- Automatic detection of touch-enabled devices
- Responsive behavior: cursor disables/enables based on screen size changes and orientation changes
- Improved accessibility for touch devices

## [1.3.0] - 2025-12-07

### Added
- `centerDotHoverColor` option to customize center dot color when hovering over interactive elements
- `centerDotSize` now works in both outline mode and when `hideDefaultCursor` is enabled
- Improved center dot behavior: consistent opacity and transitions across all modes

### Changed
- **BREAKING**: Renamed `cursorDotColor` to `centerDotColor` for better clarity and consistency
- **BREAKING**: Renamed `pointer` option to `hoverEffect` for better clarity
- **BREAKING**: Renamed `AuraCursorPointerOptions` interface to `AuraCursorHoverEffectOptions`
- **BREAKING**: Removed `size` property from `hoverEffect` options (use `scale` to multiply base size instead)
- Improved prop naming for better React integration and clarity
- Center dot now uses consistent opacity and transition behavior in all modes
- Center dot in outline mode and when `hideDefaultCursor` is enabled now have identical behavior

### Fixed
- Fixed center dot not using `centerDotHoverColor` when hovering over interactive elements
- Fixed `centerDotSize` not being applied in outline mode
- Fixed center dot and cursor dot overlapping when both outline mode and `hideDefaultCursor` were enabled
- Improved center dot styling to ensure no unwanted borders or outlines

## [1.2.1] - 2025-12-07

### Fixed
- Fixed rollup plugin to always update TypeScript declaration files with latest types
- Ensured `hoverColor` and all interface properties are correctly included in build output

## [1.2.0] - 2025-12-07

### Added
- `hoverColor` option to set custom color when hovering over interactive elements
- Automatic cursor hiding when mouse leaves the browser window (e.g., address bar, outside viewport)
- Full TypeScript interface exports (`AuraCursorOptions`, `AuraCursorHoverEffectOptions`, `AuraCursorProps`) for better type compatibility
- Improved cursor visibility management in `interactiveOnly` mode - cursor hides when leaving interactive areas
- Updated README with live demo link and comprehensive TypeScript documentation

### Changed
- Improved type resolution for React components - fixed import paths in declaration files
- Enhanced cursor behavior to automatically hide when window loses focus

### Fixed
- Fixed TypeScript type resolution issues when importing interfaces
- Improved cursor visibility when switching between interactive and non-interactive elements

## [1.1.0] - 2025-12-07

### Added
- Outline mode redesigned: two separate circles - inner dot follows mouse instantly, outer circle follows with delay
- `centerDotColor` option to customize the center dot color in outline mode or when hideDefaultCursor is enabled
- Inner dot in outline mode increases size on hover over interactive elements
- Inner dot and outer circle border change to hover color when over interactive elements

### Changed
- Outline mode behavior: inner dot always follows mouse instantly, outer circle (border only) follows with delay
- Improved outline mode visual: cleaner separation between inner dot and outer border circle

## [1.0.4] - 2025-12-07

### Fixed
- Fixed TypeScript declaration files location - moved from `dist/src/` to `dist/` for better module resolution
- Fixed relative imports in TypeScript declaration files (`.d.ts`) to use package imports instead of relative paths
- Improved build process with new `moveDeclarationFilesPlugin` to properly organize declaration files

## [1.0.3] - 2025-12-07

### Fixed
- Fixed React import resolution issue where `react.esm.js` was trying to import `'./aura-cursor'` which doesn't exist in dist folder
- Added Rollup plugin to rewrite relative imports to package imports in React build output
- React components now correctly resolve `aura-cursor` package imports in Next.js and other bundlers

## [1.0.2] - 2025-12-07

### Added
- Native React support with hooks and components
- Separate entry points for vanilla JavaScript and React usage
- Updated documentation with React usage examples

### Changed
- Improved build configuration for better module resolution
- Updated ESLint configuration to v9

## [1.0.1] - 2024-12-07

### Fixed
- Updated repository URLs

## [1.0.0] - 2024-12-07

### Added
- Initial release
- Custom cursor with configurable size, color, opacity, and speed
- Smart detection of interactive elements (links, buttons, etc.)
- Hover effects with customizable styles when cursor is over interactive elements
- Outline mode with configurable border width
- Center dot indicator when default cursor is hidden
- Interactive-only mode
- Hide default cursor option
- TypeScript support with full type definitions
- Smooth animation with adaptive speed
- Support for ESM, CommonJS, and UMD formats

[Unreleased]: https://github.com/andrecb/aura-cursor/compare/v1.4.1...HEAD
[1.4.1]: https://github.com/andrecb/aura-cursor/compare/v1.4.0...v1.4.1
[1.4.0]: https://github.com/andrecb/aura-cursor/compare/v1.3.0...v1.4.0
[1.3.0]: https://github.com/andrecb/aura-cursor/compare/v1.2.1...v1.3.0
[1.2.1]: https://github.com/andrecb/aura-cursor/compare/v1.2.0...v1.2.1
[1.2.0]: https://github.com/andrecb/aura-cursor/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/andrecb/aura-cursor/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/andrecb/aura-cursor/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/andrecb/aura-cursor/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/andrecb/aura-cursor/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/andrecb/aura-cursor/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/andrecb/aura-cursor/releases/tag/v1.0.0

