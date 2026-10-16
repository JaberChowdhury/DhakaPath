import { createTheme, MantineColorsTuple } from '@mantine/core';

// Custom Dhaka Transit Teal & Emerald Palette
const dhakaTeal: MantineColorsTuple = [
  '#e6fffa',
  '#b2f5ea',
  '#81e6d9',
  '#4fd1c5',
  '#38b2ac',
  '#319795',
  '#285e61',
  '#234e52',
  '#1d4044',
  '#13292b',
];

const dhakaOrange: MantineColorsTuple = [
  '#fffaf0',
  '#feebc8',
  '#fbd38d',
  '#f6ad55',
  '#ed8936',
  '#dd6b20',
  '#c05621',
  '#9c4221',
  '#7b341e',
  '#652b19',
];

export const theme = createTheme({
  primaryColor: 'teal',
  colors: {
    dhakaTeal,
    dhakaOrange,
  },
  fontFamily: "'Plus Jakarta Sans', 'Noto Sans Bengali', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontFamilyMonospace: 'JetBrains Mono, Menlo, Monaco, Consolas, monospace',
  headings: {
    fontFamily: "'Plus Jakarta Sans', 'Noto Sans Bengali', -apple-system, BlinkMacSystemFont, sans-serif",
    fontWeight: '700',
  },
  defaultRadius: 'md',
  cursorType: 'pointer',
});
