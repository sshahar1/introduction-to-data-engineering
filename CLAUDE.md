# Introduction to Data Engineering - Claude Code Guide

## Development Commands

### Common Development Tasks
- **Start development server**: `npm run develop` (runs `gatsby develop`)
- **Build for production**: `npm run build` (runs `gatsby build`)
- **Clean cache**: `npm run clean` (runs `gatsby clean`)
- **Format code**: `npm run format` (runs `prettier --write "src/**/*.js"`)
- **Install husky hooks**: `npm run prepare` (runs `husky`)

### Development Workflow
1. Start development: `npm run develop`
2. Make changes to source files in `src/`
3. Code is automatically formatted on commit via husky pre-commit hook
4. Build for production: `npm run build`
5. Preview production build: `npm run serve` (after building)

## Project Structure

### Key Directories
- `src/slides/` - Markdown slides for the presentation (processed by gatsby-transformer-remark)
- `src/components/` - React components used in slides
- `src/layouts/` - Layout components
- `src/pages/` - Page components
- `src/resources/` - Static assets (images, etc.)
- `src/templates/` - Template components for markdown processing

### Key Configuration Files
- `gatsby-config.js` - Main Gatsby configuration with plugins
- `package.json` - Dependencies and scripts
- `.husky/pre-commit` - Pre-commit hook running prettier

### Key Dependencies
- **gatsby**: ^5.16.1 (static site generator)
- **gatsby-transformer-remark**: ^6.16.0 (markdown processing)
- **gatsby-remark-images**: ^7.12.3 (image processing in markdown)
- **gatsby-plugin-offline**: ^6.16.0 (PWA support)
- **gatsby-adapter-netlify**: ^1.4.0 (Netlify deployment)
- **react**: ^18.1.0, **react-dom**: ^18.1.0
- **react-helmet**: ^6.1.0 (document head management)
- **react-swipeable**: ^6.1.2 (touch/swipe support)
- **react-transition-group**: ^4.3.0 (animations)
- **highlight.js**: ^10.7.3 (syntax highlighting)
- **prop-types**: ^15.8.1 (React prop validation)
- **eslint**: ^9.26.0** (linting)
- **prettier**: ^3.3.3 (code formatting)
- **typescript**: ^4.0.0 (type checking - dev dependency)

## Development Guidelines

### Code Formatting
- JavaScript files are automatically formatted on commit via husky + prettier
- Manual formatting: `npm run format`
- ESLint is configured but not automatically run on commit

### Slide Creation
- Slides are markdown files in `src/slides/`
- Images can be placed in `src/resources/` and referenced in markdown
- Use standard markdown syntax for content
- Use HTML/JSX within markdown for interactive components
- Image processing is handled by `gatsby-remark-images`

### Component Usage
- Reusable components go in `src/components/`
- Layout wrappers go in `src/layouts/`
- Page-specific components go in `src/pages/`
- Use React Helmet (`react-helmet`) for managing document head
- Use react-swipeable for touch/swipe interactions on slides
- Use react-transition-group for slide transitions

### Image Handling
- Images in markdown are processed by `gatsby-remark-images`
- Configured with maxWidth: 1920px in gatsby-config.js
- Place static images in `src/resources/` and reference relatively
- Responsive images are generated automatically

### Deployment
- Configured for Netlify via `gatsby-adapter-netlify`
- Build command: `gatsby build`
- Publish directory: `public/` (default Gatsby output)

## Troubleshooting

### Common Issues
1. **Image processing issues**: Ensure images are in `src/resources/` or referenced correctly in markdown
2. **Build failures**: Run `npm run clean` then `npm run build` to clear cache
3. **Formatting issues**: Run `npm run format` to auto-format JavaScript files
4. **Dependency issues**: Delete `node_modules` and `package-lock.json`, then run `npm install`

### Development Server
- Default URL: http://localhost:8000
- GraphQL IDE: http://localhost:8000/___graphql
- Hot reloading is enabled during development

## Slide Navigation
- Use left/right arrows or swipe gestures to navigate between slides
- Presentation includes touch-friendly navigation via react-swipeable
- Slide transitions use react-transition-group for smooth animations