const PALETTES = [
  ['#1e3c72', '#2a5298'], // Deep Blue
  ['#000046', '#1CB5E0'], // Ocean
  ['#11998e', '#38ef7d'], // Emerald
  ['#8E2DE2', '#4A00E0'], // Purple
  ['#ff9966', '#ff5e62'], // Warm Orange
  ['#4CA1AF', '#C4E0E5'], // Soft Teal
  ['#232526', '#414345'], // Dark Slate
  ['#b92b27', '#1565C0'], // Red Blue
];

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function generateCover(title: string, author: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 450;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Select palette based on title hash
  const hash = hashString(title);
  const palette = PALETTES[hash % PALETTES.length];

  // Draw gradient background
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, palette[0]);
  gradient.addColorStop(1, palette[1]);
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Add a subtle border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 10;
  ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);

  // Setup text styling
  ctx.textAlign = 'center';
  ctx.fillStyle = 'white';

  // Draw Title
  ctx.font = 'bold 28px sans-serif';
  const words = title.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > canvas.width - 40 && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  // Center title vertically based on number of lines
  const titleLineHeight = 36;
  const startY = (canvas.height / 2) - ((lines.length * titleLineHeight) / 2) - 20;

  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, startY + (i * titleLineHeight));
  });

  // Draw Author
  ctx.font = 'italic 18px serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.fillText(author, canvas.width / 2, canvas.height - 50);

  return canvas.toDataURL('image/png');
}

export async function generateCoverBlob(title: string, author: string): Promise<Blob> {
  const dataUrl = generateCover(title, author);
  const res = await fetch(dataUrl);
  return await res.blob();
}
