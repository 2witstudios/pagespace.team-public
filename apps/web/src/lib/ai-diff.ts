import { distance } from 'fastest-levenshtein';

const SEARCH_WINDOW = 80;
const SIMILARITY_THRESHOLD = 0.5;

interface Diff {
  startLine: number;
  original: string;
  replacement: string;
}

interface MatchResult {
  index: number;
  similarity: number;
}

function getSimilarity(s1: string, s2: string): number {
  const maxLength = Math.max(s1.length, s2.length);
  if (maxLength === 0) return 1.0;
  return 1.0 - distance(s1, s2) / maxLength;
}

function fuzzySearch(
  searchLines: string[],
  sourceLines: string[],
  startLine: number
): MatchResult | null {
  const trimmedSearchLines = searchLines.map(l => l.trim());
  const searchBlock = trimmedSearchLines.join('\n');
  let bestMatch: MatchResult = { index: -1, similarity: 0 };

  // Fix: Convert 1-based startLine to 0-based for proper window calculation
  const start = Math.max(0, (startLine - 1) - SEARCH_WINDOW);
  const end = Math.min(sourceLines.length - searchLines.length, (startLine - 1) + SEARCH_WINDOW);

  for (let i = start; i <= end; i++) {
    const sourceSlice = sourceLines.slice(i, i + searchLines.length);
    const trimmedSourceSlice = sourceSlice.map(l => l.trim());
    const sourceBlock = trimmedSourceSlice.join('\n');
    const similarity = getSimilarity(searchBlock, sourceBlock);

    if (similarity > bestMatch.similarity) {
      bestMatch = { index: i, similarity };
    }

    if (similarity === 1) {
      return bestMatch; // Exact match found
    }
  }

  return bestMatch.similarity > SIMILARITY_THRESHOLD ? bestMatch : null;
}

function parseAiDiff(diffXml: string): Diff | null {
  try {
    const xmlStartIndex = diffXml.indexOf('<ai-diff>');
    if (xmlStartIndex === -1) {
      console.error('No <ai-diff> tag found in the response.');
      return null;
    }
    const xmlEndIndex = diffXml.lastIndexOf('</ai-diff>');
    if (xmlEndIndex === -1) {
      console.error('No closing </ai-diff> tag found in the response.');
      return null;
    }
    const extractedXml = diffXml.substring(xmlStartIndex, xmlEndIndex + '</ai-diff>'.length);

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(extractedXml, 'application/xml');

    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
      console.error('XML parsing error:', parserError.textContent);
      return null;
    }

    const originalNode = xmlDoc.querySelector('original');
    const replacementNode = xmlDoc.querySelector('replacement');

    if (!originalNode || !replacementNode) {
      return null;
    }

    const startLineAttr = originalNode.getAttribute('start_line');
    const startLine = startLineAttr ? parseInt(startLineAttr, 10) : 1;

    const original = originalNode.textContent || '';
    const replacement = replacementNode.textContent || '';

    return { startLine, original, replacement };
  } catch (error) {
    console.error('Error parsing AI diff:', error);
    return null;
  }
}

function getIndentation(line: string): string {
  const match = line.match(/^\s*/);
  return match ? match[0] : '';
}

export function applyAiDiff(
  originalContent: string,
  diffXml: string
): { newContent: string; isApproximateMatch: boolean } | { error: string; details?: string } | null {
  console.log('--- Applying AI Diff ---');
  
  const diff = parseAiDiff(diffXml);
  if (!diff) {
    console.error('Failed to parse AI diff XML.');
    return { error: 'Invalid AI diff format', details: 'The AI response does not contain valid <ai-diff> XML.' };
  }
  console.log('Parsed Diff:', diff);

  const { startLine, original, replacement } = diff;

  if (original.trim() === 'No content available.') {
    return { newContent: replacement, isApproximateMatch: false };
  }

  const sourceLines = originalContent.split('\n');
  
  // Special handling for empty/blank documents
  if (originalContent.trim() === '' || sourceLines.every(line => line.trim() === '')) {
    console.log('Empty document detected, bypassing fuzzy search');
    return { newContent: replacement, isApproximateMatch: false };
  }
  
  const searchLines = original.split('\n');
  if (searchLines.length > 0 && searchLines[0].trim() === '') {
    searchLines.shift();
  }
  if (searchLines.length > 0 && searchLines[searchLines.length - 1].trim() === '') {
    searchLines.pop();
  }
  console.log('Search Lines:', searchLines);

  // Additional check: if we're searching for only whitespace in a non-empty document
  if (searchLines.every(line => line.trim() === '')) {
    console.log('Searching for whitespace-only content, using direct replacement');
    return { newContent: replacement, isApproximateMatch: false };
  }

  const replacementLines = replacement.split('\n');
  if (replacementLines.length > 0 && replacementLines[0].trim() === '') {
    replacementLines.shift();
  }
  if (replacementLines.length > 0 && replacementLines[replacementLines.length - 1].trim() === '') {
    replacementLines.pop();
  }
  console.log('Replacement Lines:', replacementLines);

  const match = fuzzySearch(searchLines, sourceLines, startLine);

  if (!match) {
    console.error('Fuzzy search failed to find a match.');
    return { error: 'Content not found', details: 'Unable to locate the original content in the document. The content may have been modified.' };
  }
  console.log('Fuzzy Search Match:', match);

  const { index, similarity } = match;
  const isApproximateMatch = similarity < 1.0;
  console.log(`Match found at index ${index} with similarity ${similarity}.`);

  const baseIndentation = getIndentation(sourceLines[index]);
  const indentedReplacementLines = replacementLines.map(line => {
    return line.trim() === '' ? '' : baseIndentation + line;
  });
  console.log('Indented Replacement Lines:', indentedReplacementLines);

  const newContent = [
    ...sourceLines.slice(0, index),
    ...indentedReplacementLines,
    ...sourceLines.slice(index + searchLines.length),
  ].join('\n');

  console.log('--- AI Diff Applied Successfully ---');
  return { newContent, isApproximateMatch };
}

export function isValidAiDiff(content: string): boolean {
  return content.includes('<ai-diff>') && content.includes('</ai-diff>');
}

export function extractValidXml(content: string): string | null {
  const regex = /<ai-diff>([\s\S]*?)<\/ai-diff>/;
  const match = content.match(regex);
  if (match && match[0]) {
    // Ensure the captured group is not just whitespace
    if (match[1] && match[1].trim().length > 0) {
      return match[0];
    }
  }
  return null;
}