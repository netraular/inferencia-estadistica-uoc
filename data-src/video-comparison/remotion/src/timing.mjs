export const frameAt = (seconds, fps = 30) => Math.round(seconds * fps);

export function captionLines(text, limit = 66) {
  const words = text.split(' ');
  if (text.length <= limit) return [text];
  let best = null;
  for (let split = 1; split < words.length; split++) {
    const lines = [words.slice(0, split).join(' '), words.slice(split).join(' ')];
    if (lines.every(line => line.length <= limit)) {
      const score = Math.abs(lines[0].length - lines[1].length);
      if (!best || score < best.score) best = {lines, score};
    }
  }
  if (!best) throw new Error('Caption exceeds the two-line budget');
  return best.lines;
}