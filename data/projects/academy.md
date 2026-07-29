# Academy - Tools for Students & Researchers

A free, browser-only toolbox aimed at students, researchers, and anyone who works with text, PDFs, and data on a daily basis. Every tool runs entirely in the browser - no uploads, no accounts, no tracking. Open a page, do the thing, close the tab.

The collection lives at [academy.html](academy.html) and bundles 20 single-purpose utilities that I kept needing while writing, reviewing, and reading academic material.

## Why it exists

Most online "free" tools fall into one of three traps: they upload your file to a server you don't control, they paywall the export step, or they bury the actual tool under ads. Academy is the answer I wanted for myself - a flat list of fast, focused utilities that work offline once the page is loaded.

## What's inside

### PDF
- **PDF Merge** - combine multiple PDFs in a chosen order.
- **PDF Split** - extract a page range into a new PDF.
- **PDF → Text** - pull plain text out of a PDF.
- **OCR** - recognize text in scanned images or image-only PDFs.

### Writing & reading
- **Markdown Preview** - live render Markdown side-by-side with the source.
- **LaTeX Preview** - render LaTeX math in the browser.
- **Readability** - score a piece of writing for grade level and clarity.
- **Word Counter** - words, characters, sentences, reading time.
- **Keyword Extractor** - pull salient terms from a block of text.
- **Text Utilities** - case conversion, trimming, line operations, sorting.

### Research
- **DOI Lookup** - resolve a DOI to its full citation metadata.
- **Literature Search** - quick search across academic databases.

### Data & dev
- **Diff** - compare two texts side-by-side.
- **JSON Viewer** - pretty-print and explore JSON.
- **Regex Tester** - test regular expressions with live highlights.
- **Hash & Encode** - md5/sha hashes, base64, URL encoding.
- **Statistics** - descriptive stats on a pasted column of numbers.
- **Unit Converter** - common engineering and scientific units.
- **Random** - random numbers, picks, shuffles.
- **QR** - generate a QR code from text or a URL.

## How it's built

Plain HTML, CSS, and JavaScript. No build step, no framework, no backend. Each tool is a single HTML file under [tools/](tools/) so it can be opened directly from the filesystem if you ever lose internet. PDF work uses pdf.js, OCR uses Tesseract.js, and math rendering uses KaTeX - all loaded from a CDN and then cached.

## Status

Live and in regular use. New tools get added whenever I find myself doing the same fiddly thing twice.
