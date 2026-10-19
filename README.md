# MobiDocs

**Documents, made workable.**

MobiDocs is a browser-first document and image workspace for PDF editing, OCR, and file conversion. The product is designed to process files locally in the user's browser wherever practical, without uploading document contents to MobiWave servers or retaining user files.

## Product principles

- **Privacy by default:** local-first processing; no account or cloud storage required for core tools.
- **Useful document tools:** PDF utilities, OCR, image editing, and format conversion in one clean workspace.
- **Honest capabilities:** explain when a conversion changes layout or requires text recognition.
- **Accessible and responsive:** designed for desktop and mobile browsers.

## Initial stack

- React + TypeScript + Vite
- PDF.js for PDF rendering and inspection
- pdf-lib for supported PDF edits and exports
- Tesseract.js for in-browser OCR
- Browser APIs and dedicated client-side libraries for image operations

## Development

```bash
npm install
npm run dev
```

## Privacy notes

Core workflows should not transmit uploaded file bytes to an application backend. Avoid analytics that capture document names, contents, OCR output, or other user file data. Clearly disclose any future feature that requires a remote service before the user submits a file.

## Status

Early foundation. Feature availability and conversion fidelity will be documented as each workflow is implemented.
