/**
 * ChapterCheck - Readability & Pacing Analyzer for Authors
 * Pure client-side JavaScript engine.
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const chapterInput = document.getElementById('chapter-input');
  const liveCounter = document.getElementById('live-counter');
  const analyzeBtn = document.getElementById('analyze-btn');
  const loadSampleBtn = document.getElementById('load-sample-btn');
  const clearBtn = document.getElementById('clear-btn');
  const alertBox = document.getElementById('alert-box');
  const alertMessage = document.getElementById('alert-message');

  const resultsSection = document.getElementById('results-section');
  const fleschScoreVal = document.getElementById('flesch-score-value');
  const scoreRingFill = document.getElementById('score-ring-fill');
  const scorePointer = document.getElementById('score-pointer');
  const difficultyTitle = document.getElementById('difficulty-level-title');
  const difficultyDesc = document.getElementById('difficulty-description');

  const metricWordCount = document.getElementById('metric-word-count');
  const metricSentenceCount = document.getElementById('metric-sentence-count');
  const metricAvgWords = document.getElementById('metric-avg-words');
  const metricAvgSyllables = document.getElementById('metric-avg-syllables');

  const tabHardestBtn = document.getElementById('tab-hardest-btn');
  const tabInteractiveBtn = document.getElementById('tab-interactive-btn');
  const tabHardestContent = document.getElementById('tab-hardest-content');
  const tabInteractiveContent = document.getElementById('tab-interactive-content');

  const hardSentencesList = document.getElementById('hard-sentences-list');
  const interactiveTextDisplay = document.getElementById('interactive-text-display');

  const copySummaryBtn = document.getElementById('copy-summary-btn');
  const scrollTopBtn = document.getElementById('scroll-top-btn');

  // Sample Chapter Excerpt (Rich narrative prose with varied pacing)
  const SAMPLE_CHAPTER = `The thunderstorm had raged since midnight, casting jagged silver flashes across the ancestral study of Blackwood Manor. Lord Alistair stood by the stained-glass window, nursing an amber glass of single-malt whisky while contemplating the enigmatic letter resting upon his mahogany desk.

Outside, the unrelenting rain hammered against the ancient slate roof with rhythmic ferocity. Each thunderous rumble seemed to reverberate through the heavy oak floorboards, echoing the deep-seated apprehension that had plagued his thoughts throughout the preceding fortnight.

He picked up the parchment. The ink was faded, yet the distinctive handwriting of his long-lost brother remained unmistakable. Its cryptic message warned of an imminent conspiracy within the Royal Geographical Society—a plot so audacious that its revelation would undoubtedly shatter the fragile peace between the rival academic factions.

A sudden knock at the library door startled him. Before he could speak, the heavy brass latch clicked, and Eleanor stepped silently into the dim room, her dark cloak glistening with raindrops.`;

  // ==========================================
  // Text Processing & NLP Utilities
  // ==========================================

  /**
   * Accurate English Syllable Counter algorithm
   */
  function countSyllablesInWord(word) {
    word = word.toLowerCase().trim().replace(/[^a-z]/g, '');
    if (!word) return 0;
    if (word.length <= 3) return 1;

    // Remove common non-syllable endings
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');

    // Match vowel groups
    const vowelGroups = word.match(/[aeiouy]{1,2}/g);
    const count = vowelGroups ? vowelGroups.length : 1;

    return Math.max(1, count);
  }

  /**
   * Tokenize text into words
   */
  function getWords(text) {
    const tokens = text.match(/[A-Za-z0-9'’-]+/g) || [];
    return tokens.filter(w => w.trim().length > 0);
  }

  /**
   * Split text into clean sentences, preserving structure
   */
  function getSentences(text) {
    if (!text || !text.trim()) return [];

    // Clean multiple linebreaks into spaces or sentence markers
    const cleaned = text.replace(/[\r\n]+/g, ' ');

    // Match sentences based on punctuation followed by space/end, handling common abbreviations
    // Refined regex for sentence boundaries
    const rawSentences = cleaned.match(/[^.!?]+[.!?]+["'’]?|[^.!?]+$/g) || [];

    const finalSentences = [];
    let buffer = '';

    const abbreviations = ['mr', 'mrs', 'ms', 'dr', 'prof', 'sr', 'jr', 'vs', 'etc', 'st', 'inc', 'ltd', 'e.g', 'i.e'];

    for (let i = 0; i < rawSentences.length; i++) {
      const seg = rawSentences[i].trim();
      if (!seg) continue;

      buffer += (buffer ? ' ' : '') + seg;

      // Check if last word before period is an abbreviation
      const lastWordMatch = buffer.match(/\b([A-Za-z]+)\.$/);
      if (lastWordMatch && abbreviations.includes(lastWordMatch[1].toLowerCase())) {
        // Continue buffering, don't split yet
        continue;
      }

      const wordCount = getWords(buffer).length;
      if (wordCount >= 2) {
        finalSentences.push(buffer);
        buffer = '';
      }
    }

    if (buffer.trim() && getWords(buffer).length > 0) {
      finalSentences.push(buffer.trim());
    }

    return finalSentences;
  }

  /**
   * Identify complex words (3+ syllables or >= 9 letters)
   */
  function isComplexWord(word) {
    const cleanWord = word.replace(/[^a-zA-Z]/g, '');
    if (cleanWord.length < 5) return false;
    const syllables = countSyllablesInWord(cleanWord);
    return syllables >= 3 || cleanWord.length >= 9;
  }

  /**
   * Flesch Reading Ease Formula
   * FRE = 206.835 - (1.015 * ASL) - (84.6 * ASW)
   */
  function calculateFleschScore(totalWords, totalSentences, totalSyllables) {
    if (totalWords === 0 || totalSentences === 0) return 0;

    const asl = totalWords / totalSentences;
    const asw = totalSyllables / totalWords;

    const score = 206.835 - (1.015 * asl) - (84.6 * asw);
    // Clamp between 0 and 100
    return Math.min(100, Math.max(0, Math.round(score * 10) / 10));
  }

  /**
   * Get readability difficulty level description & gradient mapping
   */
  function getDifficultyLevel(fleschScore) {
    if (fleschScore >= 90) {
      return {
        title: "Very Easy",
        grade: "5th Grade Level",
        desc: "Extremely clear and conversational. Effortless to read for all audiences, including children and non-native English speakers.",
        color: "#059669"
      };
    } else if (fleschScore >= 80) {
      return {
        title: "Easy",
        grade: "6th Grade Level",
        desc: "Conversational, brisk fiction style. Very readable and engaging for middle-grade and general audiences.",
        color: "#10b981"
      };
    } else if (fleschScore >= 70) {
      return {
        title: "Fairly Easy",
        grade: "7th Grade Level",
        desc: "Clear prose with natural sentence variation. Ideal for commercial fiction, thrillers, and young adult books.",
        color: "#8b5cf6"
      };
    } else if (fleschScore >= 60) {
      return {
        title: "Standard",
        grade: "8th & 9th Grade Level",
        desc: "Balanced literary style. Standard difficulty for mainstream trade fiction, popular non-fiction, and bestsellers.",
        color: "#7c3aed"
      };
    } else if (fleschScore >= 50) {
      return {
        title: "Fairly Difficult",
        grade: "10th to 12th Grade Level",
        desc: "Rich, dense narrative or technical prose. Demands active reader concentration. Common in high fantasy, historical fiction, or analytical work.",
        color: "#f59e0b"
      };
    } else if (fleschScore >= 30) {
      return {
        title: "Difficult",
        grade: "College Level",
        desc: "Complex sentence architecture and sophisticated vocabulary. Suited for academic writing or classical literary fiction.",
        color: "#ea580c"
      };
    } else {
      return {
        title: "Very Confusing / Dense",
        grade: "College Graduate Level",
        desc: "Extremely heavy, intricate syntax and high syllable density. May fatigue casual fiction readers.",
        color: "#e11d48"
      };
    }
  }

  /**
   * Calculate Sentence Difficulty Score for ranking hardest sentences
   * Factors:
   * 1. Word count (length)
   * 2. Syllable density (average syllables per word in sentence)
   * 3. Complex words count
   * 4. Sentence length penalty (> 25 words)
   */
  function evaluateSentenceDifficulty(sentenceText) {
    const words = getWords(sentenceText);
    if (words.length === 0) return { score: 0, wordsCount: 0, syllables: 0, complexWords: [] };

    let totalSyllables = 0;
    const complexWords = [];

    words.forEach(w => {
      const syl = countSyllablesInWord(w);
      totalSyllables += syl;
      if (isComplexWord(w)) {
        complexWords.push(w);
      }
    });

    const wordsCount = words.length;
    const avgSyllablesPerWord = totalSyllables / wordsCount;
    
    // Formula tuned for author pacing & difficulty detection
    let score = (wordsCount * 1.2) + (avgSyllablesPerWord * 18) + (complexWords.length * 6);
    if (wordsCount > 25) {
      score += (wordsCount - 25) * 1.5;
    }

    return {
      sentence: sentenceText,
      score: Math.round(score * 10) / 10,
      wordsCount,
      totalSyllables,
      avgSyllablesPerWord: (totalSyllables / wordsCount).toFixed(2),
      complexWords: [...new Set(complexWords)] // Unique complex words
    };
  }

  // ==========================================
  // Event Handlers & Core Logic
  // ==========================================

  // Live character/word counter
  chapterInput.addEventListener('input', updateLiveCounter);

  function updateLiveCounter() {
    const text = chapterInput.value;
    const words = getWords(text).length;
    const chars = text.length;
    liveCounter.textContent = `${words.toLocaleString()} words | ${chars.toLocaleString()} characters`;
    
    if (words > 0) {
      alertBox.classList.add('hidden');
    }
  }

  // Load sample text
  loadSampleBtn.addEventListener('click', () => {
    chapterInput.value = SAMPLE_CHAPTER.trim();
    updateLiveCounter();
    runAnalysis();
  });

  // Clear text
  clearBtn.addEventListener('click', () => {
    chapterInput.value = '';
    updateLiveCounter();
    alertBox.classList.add('hidden');
    resultsSection.classList.add('hidden');
  });

  // Analyze button click
  analyzeBtn.addEventListener('click', runAnalysis);

  function runAnalysis() {
    const text = chapterInput.value.trim();
    const words = getWords(text);

    // Friendly check for minimum text requirement
    if (words.length < 15) {
      alertMessage.textContent = words.length === 0
        ? "Please paste or type your chapter text in the box above before analyzing."
        : `Your text only contains ${words.length} words. Please enter at least 15 words for a meaningful chapter analysis.`;
      alertBox.classList.remove('hidden');
      resultsSection.classList.add('hidden');
      return;
    }

    alertBox.classList.add('hidden');

    // Perform analysis
    const sentences = getSentences(text);
    const totalWords = words.length;
    const totalSentences = Math.max(1, sentences.length);

    let totalSyllables = 0;
    words.forEach(w => {
      totalSyllables += countSyllablesInWord(w);
    });

    const fleschScore = calculateFleschScore(totalWords, totalSentences, totalSyllables);
    const difficulty = getDifficultyLevel(fleschScore);
    const avgWordsPerSentence = (totalWords / totalSentences).toFixed(1);
    const avgSyllablesPerWord = (totalSyllables / totalWords).toFixed(2);

    // Update Overview UI
    fleschScoreVal.textContent = fleschScore;
    difficultyTitle.textContent = difficulty.title;
    difficultyDesc.innerHTML = `<strong>${difficulty.grade}</strong> — ${difficulty.desc}`;
    
    // Animate score ring fill
    // Circumference of r=58 circle is ~364.4
    const circumference = 364.4;
    const offset = circumference - (fleschScore / 100) * circumference;
    scoreRingFill.style.strokeDashoffset = offset;
    scoreRingFill.style.stroke = difficulty.color;

    // Update slider pointer location (0 to 100)
    scorePointer.style.left = `${Math.min(98, Math.max(2, fleschScore))}%`;

    // Update Key Metric Cards
    metricWordCount.textContent = totalWords.toLocaleString();
    metricSentenceCount.textContent = totalSentences.toLocaleString();
    metricAvgWords.textContent = avgWordsPerSentence;
    metricAvgSyllables.textContent = avgSyllablesPerWord;

    // Analyze Sentence Difficulties to identify top 5 hardest sentences
    const evaluatedSentences = sentences.map(s => evaluateSentenceDifficulty(s));
    
    // Sort descending by difficulty score
    const sortedSentences = [...evaluatedSentences].sort((a, b) => b.score - a.score);
    const topHardest = sortedSentences.slice(0, 5);

    // Render Hardest Sentences List (Tab 1)
    renderHardestSentencesList(topHardest);

    // Render Interactive Manuscript View (Tab 2)
    renderInteractiveManuscript(text, sentences, topHardest);

    // Show Results & Smooth Scroll
    resultsSection.classList.remove('hidden');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /**
   * Render the cards for top 5 hardest sentences
   */
  function renderHardestSentencesList(topHardest) {
    hardSentencesList.innerHTML = '';

    if (topHardest.length === 0) {
      hardSentencesList.innerHTML = '<p class="text-muted">No sentences analyzed.</p>';
      return;
    }

    topHardest.forEach((item, index) => {
      const rank = index + 1;
      const card = document.createElement('div');
      card.className = 'sentence-card';
      card.setAttribute('data-rank', rank);

      const complexWordsHtml = item.complexWords.length > 0
        ? item.complexWords.map(w => `<span class="complex-word-tag">${escapeHtml(w)}</span>`).join(' ')
        : '<em style="color: var(--slate-400);">None detected</em>';

      card.innerHTML = `
        <div class="sentence-header">
          <span class="rank-badge rank-${rank}">#${rank} Hardest Sentence</span>
          <div class="sentence-stats-pills">
            <span><strong>${item.wordsCount}</strong> words</span>
            <span>•</span>
            <span><strong>${item.avgSyllablesPerWord}</strong> syl/word</span>
          </div>
        </div>
        <div class="sentence-text">"${escapeHtml(item.sentence)}"</div>
        <div class="sentence-complex-words">
          <strong>Complex words:</strong> ${complexWordsHtml}
        </div>
      `;

      // Click card to switch to manuscript tab and highlight sentence
      card.addEventListener('click', () => {
        switchTab('interactive');
        const targetMark = interactiveTextDisplay.querySelector(`mark[data-rank="${rank}"]`);
        if (targetMark) {
          targetMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetMark.style.outline = '3px solid var(--primary-600)';
          setTimeout(() => {
            targetMark.style.outline = 'none';
          }, 2000);
        }
      });

      hardSentencesList.appendChild(card);
    });
  }

  /**
   * Render manuscript text with top 5 hardest sentences wrapped in <mark> tags
   */
  function renderInteractiveManuscript(rawText, sentences, topHardest) {
    // Map each sentence to its rank if it is in topHardest
    const hardestMap = new Map();
    topHardest.forEach((item, idx) => {
      hardestMap.set(item.sentence.trim(), idx + 1);
    });

    let htmlOutput = escapeHtml(rawText);

    // Replace top hardest sentences with <mark> tags safely
    topHardest.forEach((item, idx) => {
      const rank = idx + 1;
      const targetStr = escapeHtml(item.sentence);
      
      if (htmlOutput.includes(targetStr)) {
        const replacement = `<mark class="hard-sentence" data-rank="${rank}" title="Rank #${rank} Hardest Sentence (${item.wordsCount} words, ${item.avgSyllablesPerWord} syl/word)">${targetStr}</mark>`;
        htmlOutput = htmlOutput.replace(targetStr, replacement);
      }
    });

    interactiveTextDisplay.innerHTML = htmlOutput;

    // Add click listeners to mark tags
    const marks = interactiveTextDisplay.querySelectorAll('mark.hard-sentence');
    marks.forEach(mark => {
      mark.addEventListener('click', () => {
        const rank = mark.getAttribute('data-rank');
        switchTab('hardest');
        const targetCard = hardSentencesList.querySelector(`.sentence-card[data-rank="${rank}"]`);
        if (targetCard) {
          targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
          targetCard.style.borderColor = 'var(--primary-600)';
          setTimeout(() => {
            targetCard.style.borderColor = 'var(--slate-200)';
          }, 2000);
        }
      });
    });
  }

  // ==========================================
  // Tab Navigation
  // ==========================================
  tabHardestBtn.addEventListener('click', () => switchTab('hardest'));
  tabInteractiveBtn.addEventListener('click', () => switchTab('interactive'));

  function switchTab(tabName) {
    if (tabName === 'hardest') {
      tabHardestBtn.classList.add('active');
      tabInteractiveBtn.classList.remove('active');
      tabHardestContent.classList.remove('hidden');
      tabInteractiveContent.classList.add('hidden');
    } else {
      tabInteractiveBtn.classList.add('active');
      tabHardestBtn.classList.remove('active');
      tabInteractiveContent.classList.remove('hidden');
      tabHardestContent.classList.add('hidden');
    }
  }

  // ==========================================
  // Helper Tools
  // ==========================================

  // Copy Summary Report
  copySummaryBtn.addEventListener('click', () => {
    const wordCount = metricWordCount.textContent;
    const sentenceCount = metricSentenceCount.textContent;
    const avgWords = metricAvgWords.textContent;
    const score = fleschScoreVal.textContent;
    const title = difficultyTitle.textContent;

    const summaryText = `ChapterCheck Readability Report:
----------------------------------------
• Flesch Reading Ease Score: ${score} (${title})
• Total Word Count: ${wordCount}
• Total Sentence Count: ${sentenceCount}
• Average Words per Sentence: ${avgWords}

Analyzed 100% locally with ChapterCheck for Authors.`;

    navigator.clipboard.writeText(summaryText).then(() => {
      const originalText = copySummaryBtn.innerHTML;
      copySummaryBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        Copied to Clipboard!
      `;
      setTimeout(() => {
        copySummaryBtn.innerHTML = originalText;
      }, 2500);
    });
  });

  // Scroll to top
  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  // Utility to escape HTML strings
  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
