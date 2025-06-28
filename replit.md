# NEHORAI Portfolio Website

## Project Overview
A cutting-edge Gen AI video portfolio website for Nehorai, showcasing professional multimedia content creation with advanced technological integrations and personalized branding.

**Current Status**: Refactored to standalone Vite + React frontend for static deployment

## Architecture
- **Frontend**: Vite + React with TypeScript
- **Styling**: Tailwind CSS with custom animations
- **UI Components**: Radix UI components with shadcn/ui
- **Animations**: Framer Motion
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for caching
- **Build Tool**: Vite for fast development and building
- **Deployment**: Ready for static hosting (Vercel, Netlify, etc.)

## Key Features
- Responsive design with dark/light theme support
- Multilingual support (Hebrew default, English toggle)
- YouTube video integration with modal player
- Horizontal scroll video carousels
- WhatsApp integration for contact
- Animated UI components and background
- NEHORAI branding throughout

## Recent Changes (June 28, 2025)
✓ Removed server/ and shared/ folders - no backend needed
✓ Created standalone client/ directory with complete Vite setup
✓ Updated vite.config.ts for standalone frontend
✓ Created client/package.json with frontend-only dependencies  
✓ Added vercel.json for deployment configuration
✓ Simplified queryClient.ts - removed server dependencies
✓ Updated all file paths and imports for standalone structure

## File Structure
```
/
├── client/                    # Standalone frontend
│   ├── src/
│   │   ├── components/       # React components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utility libraries
│   │   ├── pages/           # Page components
│   │   ├── App.tsx          # Main app component
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Global styles
│   ├── index.html           # HTML template
│   ├── package.json         # Frontend dependencies
│   ├── vite.config.ts       # Vite configuration
│   ├── tailwind.config.ts   # Tailwind configuration
│   └── tsconfig.json        # TypeScript configuration
├── attached_assets/          # Static assets
├── vercel.json              # Deployment configuration
└── replit.md               # Project documentation
```

## Deployment Instructions
1. **Local Development**: `cd client && npm install && npm run dev`
2. **Build**: `cd client && npm run build`
3. **Vercel Deployment**: Uses vercel.json configuration
4. **Other Platforms**: Serve `client/dist` after build

## User Preferences
- Dark theme as default
- Hebrew as primary language
- NEHORAI branding consistency
- Clean, modern UI with smooth animations
- Mobile-first responsive design

## Next Steps
- Test YouTube embed functionality
- Verify all page functionality works correctly
- Confirm deployment readiness