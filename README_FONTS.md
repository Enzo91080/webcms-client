## Fonts

This project is configured with **two fonts**:

- **Open Sans** (default text font)
- **Akrobat** (display font for titles)

### 1) Put your Akrobat file

Place the file here:

`src/assets/akrobat/Akrobat-Black.otf`

(Only the Black weight (900) is configured by default.)

### 2) Use the fonts in components

- Default (text): `font-sans`
- Display (titles): `font-display`

Examples:

```tsx
<h1 className="font-display font-black text-4xl">Titre Akrobat</h1>
<p className="font-sans">Texte Open Sans</p>
```

### 3) Install deps

```bash
npm install
npm run dev
```
