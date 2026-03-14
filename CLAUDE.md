# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

iFEED is a 2D pseudo-3D casual feeding game built with React, Vite, and TypeScript. Players throw food at animals arranged in grid formations by pulling down on a slingshot-style button. The game features 4 levels with increasing complexity (1x1, 3 animals in a line, 3x3, 4x4).

## Common Commands

```bash
npm install              # Install dependencies
npm run dev             # Start dev server on port 3000
npm run build           # Build for production
npm run build:pages     # Build for GitHub Pages with /iFEED/ base path
npm run preview         # Preview production build locally
npm run clean           # Clean dist folder
npm run lint            # Run TypeScript type check (noEmit)
```

## Environment Setup

Copy `.env.example` to `.env.local` and set:
- `GEMINI_API_KEY` - Required for Gemini AI API calls

## Architecture

### Phase-Based State Machine

The app flows through three main phases managed in `App.tsx`:
- **welcome**: Player selects region and gender (`WelcomeScreen`)
- **playing**: Main game loop (`GameScreen`)
- **result**: Win/lose screen with stats (`ResultScreen`)

### Game Loop (GameScreen.tsx)

The game component is the core of the application with ~900 lines containing:

**State Management:**
- Level progression (1-4)
- Animal entities with positions, hunger, status
- Food inventory per level
- Charging/drag mechanics for throwing
- Flying food animations and collision detection

**Throwing Mechanics:**
- Cartesian launch system: drag down to charge, release to throw
- `forceMultiplierY = 4.8`, `forceMultiplierX = 3.0`
- Fixed 0.8s flight time regardless of distance
- Collision uses circle-to-circle detection with aspect ratio correction

**Visual System:**
- Y-axis determines depth (lower y = closer = larger scale)
- Z-index derived from Y position for layering
- Global scale decreases as levels progress (0.85 at Lv4)

**Game Over Conditions:**
- Run out of food with hungry animals remaining
- No valid feeding actions possible and ad opportunity already used
- Wrong food makes animal sick (cannot be fed until cured)

### Level Generation (logic/levelGenerator.ts)

Procedural level system ensuring solvability:
- `buildBaseFeedingPlan()` - Calculates minimum food needed
- `generateSolvableInventory()` - Adds surplus + "trap" foods, verifies solvability via DFS
- `isSolvableWithoutAds()` - Memoized DFS to validate a state can reach win condition
- `hasAnyValidFeedAction()` - Checks if player has any possible move

Levels defined in `types.ts` with:
- Grid size (1x1, 1x3, 3x3, 4x4)
- Animal pool (subset of 8 animal types)
- Unlocked foods (subset of 6 food types)
- Hunger range, surplus ratio, trap food count

### Type System (types.ts)

Core game data structures:
- `FoodType`: carrot, bug, bone, greens, shrimp, feed
- `AnimalType`: frog, chicken, dog, sheep, turtle, cat, rabbit, fish
- `AnimalStatus`: hungry, sick, full
- `AnimalConfig`: Maps animals to food effects (value 1 or 2)
- `LEVEL_CONFIG`: Array of level definitions with `MAX_LEVEL = 4`

## Development Notes

### Tailwind CSS v4
Using `@tailwindcss/vite` plugin - styles defined in `src/index.css` with custom CSS variables for game colors.

### Motion Library
Uses `motion/react` (Framer Motion) for:
- Food flying animations
- UI transitions (level banners, feedback popups)
- AnimatePresence for enter/exit animations

### Pointer Events
Game uses Pointer Events API for unified touch/mouse handling on the slingshot button. `setPointerCapture()` is used to track drags outside button bounds.

### GitHub Pages Deployment
- Production builds use base path `/iFEED/` via `npm run build:pages`
- Deployed automatically via `.github/workflows/deploy-pages.yml`
- Vite config conditionally sets base path based on `VITE_BASE_PATH` env var

### Mobile-First Layout
- Safe area insets handled with `env(safe-area-inset-*)`
- Container max-width 440px, centered on desktop
- Touch actions disabled on game area (`touch-none`)

### Debugging
- Check `processedFoodIdsRef` for collision timing issues
- Visual scale multiplier adjusts emoji sizes based on screen width
- Hit radius ~9.8% of screen width varies by level
