/**
 * Semantic design tokens for the mobile app.
 *
 * These tokens mirror the naming conventions used in web artifacts (index.css)
 * so that multi-artifact projects share a cohesive visual identity.
 *
 * Replace the placeholder values below with values that match the project's
 * brand. If a sibling web artifact exists, read its index.css and convert the
 * HSL values to hex so both artifacts use the same palette.
 *
 * To add dark mode, add a `dark` key with the same token names.
 * The useColors() hook will automatically pick it up.
 */

const colors = {
  light: {
    text: '#13202b',
    tint: '#d28a2e',

    background: '#f5f7f6',
    foreground: '#13202b',

    card: '#ffffff',
    cardForeground: '#13202b',

    primary: '#166b63',
    primaryForeground: '#ffffff',

    secondary: '#e8efed',
    secondaryForeground: '#24504b',

    muted: '#edf1ef',
    mutedForeground: '#6a7a78',

    accent: '#fff4e3',
    accentForeground: '#9a5f18',

    destructive: '#b84a49',
    destructiveForeground: '#ffffff',

    border: '#dbe4e0',
    input: '#cbd9d4',
  },

  dark: {
    text: '#eaf1ef',
    tint: '#e5a54d',
    background: '#101a1b',
    foreground: '#eaf1ef',
    card: '#172426',
    cardForeground: '#eaf1ef',
    primary: '#67b6a7',
    primaryForeground: '#10201e',
    secondary: '#213533',
    secondaryForeground: '#c9e1dc',
    muted: '#1d2b2c',
    mutedForeground: '#9bb0ac',
    accent: '#3e311f',
    accentForeground: '#f4c77e',
    destructive: '#e17a78',
    destructiveForeground: '#2b1010',
    border: '#2a3e3e',
    input: '#36514f',
  },

  radius: 16,
};

export default colors;
