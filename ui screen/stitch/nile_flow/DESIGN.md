# Design System Specification: High-Contrast Mobility

## 1. Overview & Creative North Star
**Creative North Star: The Resilient Navigator**

This design system is built to thrive in high-stakes, real-world environments. It moves beyond the "generic tech app" aesthetic to embrace an **Editorial Utility**—a style that combines the bold, authoritative clarity of a high-end newspaper with the frictionless flow of modern mobility. 

In the context of Sudan, reliability is the ultimate luxury. We break the "template" look by avoiding rigid grids and thin lines. Instead, we use **Intentional Asymmetry** and **Tonal Layering** to guide the eye. The interface feels grounded and "heavy" where it needs to be (buttons and status) and airy where it doesn't, ensuring high performance on low-bandwidth networks and high legibility under the desert sun.

---

## 2. Colors & Surface Architecture
We move away from flat UI by treating the screen as a series of physical layers.

### Color Tokens
- **Primary (`#00603e`):** A deep, authoritative "Enviro-Green." Use this for high-impact actions.
- **Primary Container (`#007b52`):** Used for large surface areas that require brand presence without the intensity of the pure Primary.
- **Surface Tiers:**
    - `surface`: `#f8f9fa` (The base canvas)
    - `surface_container_low`: `#f3f4f5` (Subtle grouping)
    - `surface_container_high`: `#e7e8e9` (Active selection or elevated cards)
    - `surface_container_highest`: `#e1e3e4` (Deepest contrast for nested elements)

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section content. Boundaries must be defined solely through background color shifts. For example, a driver’s wallet balance should sit in a `surface_container_highest` block against a `surface` background. This creates a cleaner, more premium look that reduces visual "noise" on low-resolution screens.

### The "Glass & Gradient" Rule
To prevent the app from feeling "cheap" or purely functional, apply a subtle **Signature Texture** to Hero CTAs and Status Banners:
- **Gradient:** Transition from `primary` (#00603e) to `primary_container` (#007b52) at a 135° angle.
- **Glassmorphism:** For floating action buttons or over-map elements, use `surface_container_lowest` with a 12px `backdrop-blur` and 80% opacity. This makes the UI feel integrated and sophisticated.

---

## 3. Typography: Editorial Authority
We utilize a pairing of **Plus Jakarta Sans** for character and **Inter** for pure utility.

| Level | Token | Font | Size | Intent |
| :--- | :--- | :--- | :--- | :--- |
| **Display** | `display-lg` | Plus Jakarta Sans | 3.5rem | Urgent status (e.g., "Driver Arrived") |
| **Headline** | `headline-md` | Plus Jakarta Sans | 1.75rem | Page titles and primary balances |
| **Title** | `title-lg` | Inter | 1.375rem | Zone selection and card headers |
| **Body** | `body-lg` | Inter | 1.0rem | User instructions and location names |
| **Label** | `label-md` | Inter | 0.75rem | Micro-data (ETA, Plate numbers) |

**Hierarchy Note:** Use wide tracking (letter-spacing) for `label-sm` in all-caps to create a premium "tag" look for metadata like "CASH ONLY" or "LOW BALANCE."

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are forbidden unless specified. We use **Tonal Stacking** to create a sense of height.

*   **The Layering Principle:** To lift a "Zone Selection" card, place a `surface_container_lowest` (#ffffff) card on top of a `surface_container_low` (#f3f4f5) background. 
*   **Ambient Shadows:** For floating elements (like a "Book Now" bar), use a shadow color derived from `on_surface` at 6% opacity with a 32px blur. It should feel like a soft glow, not a dark smudge.
*   **The Ghost Border:** If high-sunlight conditions make tonal shifts invisible, use a "Ghost Border": `outline_variant` (#bdc9c2) at **15% opacity**.

---

## 5. Components: Tactile Utility

### Buttons (The "Tap-First" Standard)
*   **Primary:** Uses the Primary Gradient (`#00603e` to `#007b52`). 
    *   *Shape:* `xl` rounding (1.5rem) for a friendly, modern feel.
    *   *Padding:* Scale `6` (2rem) horizontal, Scale `4` (1.4rem) vertical.
*   **Secondary:** `surface_container_highest` background with `on_surface` text. No border.

### Zone-Based Selection Cards
*   **Structure:** No dividers. Use Spacing Scale `4` (1.4rem) between cards.
*   **Active State:** Transition background to `primary_fixed` (#8df7c1) and add a `primary` 3px left-accent bar (not a full border).

### Status Indicators
*   **Searching:** A pulsating `surface_container_highest` background.
*   **Assigned:** `primary_container` background with `on_primary_container` typography.
*   **Cash Payment:** A persistent `tertiary` (#883c31) label for drivers, ensuring zero ambiguity on payment type.

### Input Fields
*   Avoid the "floating label" trend. Use a clear `label-md` *above* the field.
*   Background: `surface_container_low`.
*   Active State: Background shifts to `surface_container_lowest` with a 2px `primary` bottom-bar only.

---

## 6. Do's and Don'ts

### Do:
*   **Embrace Negative Space:** Use Spacing Scale `8` (2.75rem) to separate major functional groups.
*   **Prioritize Text over Icons:** In high-literacy variance areas, a "Search" button is better than just a magnifying glass.
*   **Use Tonal Shifts:** Distinguish the "Wallet" section from the "Map" section by changing the entire background from `surface` to `surface_container_low`.

### Don't:
*   **No 1px Lines:** Do not use dividers to separate list items. Use white space (`spacing-3`) or subtle background alternating.
*   **No Pure Black Shadows:** Never use `#000000` for shadows; it looks "dirty" against the vibrant green.
*   **No Heavy Map Assets:** If a map isn't strictly necessary for a step, use a high-contrast "Zone Card" to save user data and battery.

### Accessibility Note:
All text on `primary` or `tertiary` containers must be checked against a 4.5:1 contrast ratio. When in doubt, default to `on_surface` text on a light `surface_container`.