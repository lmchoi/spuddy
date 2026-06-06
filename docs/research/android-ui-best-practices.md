# Android UI Design Best Practices (Material 3)

This document summarizes the core UI design recommendations for Android applications based on the [Material 3 (M3)](https://m3.material.io/) design system.

## 1. Typography
Material 3 uses a type scale with 15 baseline styles. Always use **`sp` (Scale-independent Pixels)** for font sizes to respect user accessibility settings.

| Role | Size | Font Size (sp) | Weight | Line Height (sp) |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | L / M / S | 57 / 45 / 36 | Regular | 64 / 52 / 44 |
| **Headline**| L / M / S | 32 / 28 / 24 | Regular | 40 / 36 / 32 |
| **Title**   | L / M / S | 22 / 16 / 14 | Medium* | 28 / 24 / 20 |
| **Body**    | L / M / S | 16 / 14 / 12 | Regular | 24 / 20 / 16 |
| **Label**   | L / M / S | 14 / 12 / 11 | Medium  | 20 / 16 / 16 |

*\*Title Large uses Regular weight.*

- **Guideline:** [Material 3 Typography](https://m3.material.io/styles/typography/overview)

## 2. Assets & Icons
- **Vector Graphics:** Use `VectorDrawable` (SVG) for icons and simple illustrations.
- **Image Formats:** Prefer **WebP** for photographic content; use PNG only if WebP is unsupported or for specific transparency needs.
- **Icon Sizes:**
  - Standard System Icon: **24 x 24 dp**
  - Small Icon (e.g., in Chips): **18 x 18 dp**
- **Density:** Define all dimensions in **`dp` (Density-independent Pixels)**.

- **Guideline:** [Material Symbols](https://m3.material.io/styles/icons/overview)

## 3. Layout & Spacing
- **8dp Grid:** Align all components and spacing to an **8dp square grid**. Small alignments (icons/text) can use a **4dp grid**.
- **Touch Targets:** Minimum size is **48 x 48 dp**. Even if the icon is smaller, the interactive area must be at least 48dp.
- **Breakpoints:**
  - **Compact (Mobile):** < 600dp (4 columns, 16dp margins)
  - **Medium (Foldables):** 600–839dp (12 columns, 24dp margins)
  - **Expanded (Tablets):** 840dp+ (12 columns, 24dp margins)

- **Guideline:** [Material 3 Layout](https://m3.material.io/foundations/layout/applying-layout)

## 4. Accessibility
- **Color Contrast:** 
  - Small text (<18sp): **4.5:1** minimum.
  - Large text (18sp+): **3:1** minimum.
- **Dynamic Color:** Use M3 color tokens (e.g., `surfaceVariant`, `onPrimary`) instead of hardcoded hex values to support user themes.
- **Content Descriptions:** Provide `contentDescription` for all non-text elements for screen readers.

- **Guideline:** [Material 3 Accessibility](https://m3.material.io/foundations/accessibility/overview)

## 5. Official Resources
- [Material 3 Design Site](https://m3.material.io/)
- [Material Theme Builder](https://m3.material.io/theme-builder)
- [Android Developer Design Guides](https://developer.android.com/design)
