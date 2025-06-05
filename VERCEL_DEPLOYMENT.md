# Vercel Deployment Guide

## Fixes Applied

### 1. Fixed `vercel.json` Configuration Error
**Problem**: Vercel error: "If `rewrites`, `redirects`, `headers`, `cleanUrls` or `trailingSlash` are used, then `routes` cannot be present."

**Solution**: 
- Replaced deprecated `routes` property with `rewrites`
- Updated property names from `src`/`dest` to `source`/`destination`
- Added cache optimization headers for static assets

### 2. Updated Project Structure
The project now uses React with Webpack build system:
- **Source files**: `src/` directory
- **Public assets**: `public/` directory  
- **Build output**: `dist/` directory
- **Main entry**: `src/index.js`

### 3. Build Configuration
- **Build command**: `npm run build` (runs webpack in production mode)
- **Output directory**: `dist`
- **Static assets**: Copied from `public/` to `dist/` during build

### 4. Key Files Updated
- `vercel.json`: Fixed routing and added cache headers
- `webpack.config.js`: Added CopyWebpackPlugin for static assets
- `package.json`: Added copy-webpack-plugin dependency

## Deployment Process

1. **Local testing**:
   ```bash
   npm run build
   npm run preview
   ```

2. **Vercel deployment**:
   - Automatic deployment from GitHub pushes
   - Uses `vercel.json` configuration
   - Builds with Node.js 18+ and npm 9+

## Important Notes

- The `seismic-config.js` file is copied from `public/` to `dist/` during build
- All routes fall back to `index.html` for React Router compatibility
- Security headers are applied to all responses
- Static assets have 1-year cache headers for performance

## Troubleshooting

If deployment fails:
1. Check that `dist/` directory is created after build
2. Verify `seismic-config.js` exists in `public/` directory
3. Ensure all dependencies are listed in `package.json`
4. Check Vercel build logs for specific errors 