# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.1.0] - 2025-01-XX

### Added
- Outline mode redesigned: two separate circles - inner dot follows mouse instantly, outer circle follows with delay
- `cursorDotColor` option to customize the center dot color in outline mode
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
- Pointer hover effects with customizable styles
- Outline mode with configurable border width
- Center dot indicator when default cursor is hidden
- Interactive-only mode
- Hide default cursor option
- TypeScript support with full type definitions
- Smooth animation with adaptive speed
- Support for ESM, CommonJS, and UMD formats

[Unreleased]: https://github.com/andrecb/aura-cursor/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/andrecb/aura-cursor/compare/v1.0.4...v1.1.0
[1.0.4]: https://github.com/andrecb/aura-cursor/compare/v1.0.3...v1.0.4
[1.0.3]: https://github.com/andrecb/aura-cursor/compare/v1.0.2...v1.0.3
[1.0.2]: https://github.com/andrecb/aura-cursor/compare/v1.0.1...v1.0.2
[1.0.1]: https://github.com/andrecb/aura-cursor/compare/v1.0.0...v1.0.1
[1.0.0]: https://github.com/andrecb/aura-cursor/releases/tag/v1.0.0

