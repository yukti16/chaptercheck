# ChapterCheck - Readability Analyzer for Authors

**ChapterCheck** is a free, modern, browser-based web application for authors to analyze book chapters for readability, sentence length variation, and pacing.

## Features

- **Flesch Reading Ease Score**: Automatically computes readability score and maps it to target audience grade levels (Middle Grade, YA, Trade Fiction, Academic, etc.).
- **Pacing & Metric Cards**: Displays total word count, total sentence count, average words per sentence, and average syllables per word.
- **Top 5 Hardest Sentences Identification**: Evaluates sentence difficulty based on length, complex words (3+ syllables or 9+ letters), and syllable density.
- **Dual Analysis Views**:
  1. *Hardest Sentences List*: Detailed cards showing rank, word count, syllable density, and flagged complex vocabulary.
  2. *Interactive Manuscript Reader*: Color-coded inline highlighting of the 5 hardest sentences in the chapter text.
- **100% Private & Browser-Based**: All processing happens entirely inside your browser using client-side JavaScript. No text is uploaded or transmitted to any remote server.
- **Responsive Design**: Polished soft purple and white aesthetic designed for desktop, tablet, and mobile screens.

---

## How to Run Locally

### Option 1: Direct File Open (Zero Dependencies)
Simply double-click `index.html` or drag and drop `index.html` into any web browser (Chrome, Firefox, Edge, Safari).

### Option 2: Python Local Server
If you have Python installed, open your terminal in the `chaptercheck` directory and run:
```bash
python -m http.server 8000
```
Then navigate to `http://localhost:8000` in your web browser.

### Option 3: Node.js / npx
Using Node.js:
```bash
npx serve .
```
or
```bash
npx http-server .
```

---

## Free Deployment Options

ChapterCheck consists purely of static `HTML`, `CSS`, and `JavaScript`, making it ready for instant zero-cost hosting on any static web host:

### 1. GitHub Pages (Recommended)
1. Push this folder to a GitHub repository.
2. Go to **Settings > Pages** in your repository.
3. Under **Source**, select `main` branch and `/ (root)` folder.
4. Click **Save**. Your site will be live at `https://<your-username>.github.io/<repo-name>/`.

### 2. Vercel
1. Install Vercel CLI (`npm i -g vercel`) or import your repository at [vercel.com](https://vercel.com).
2. Run `vercel` in the project directory.

### 3. Netlify
1. Drag and drop the `chaptercheck` project folder directly into [app.netlify.com/drop](https://app.netlify.com/drop).
2. Your site will be live instantly with an SSL certificate.

### 4. Cloudflare Pages
1. Connect your GitHub repository to Cloudflare Pages.
2. Build setting: Leave build command empty, root directory set to `/`.
