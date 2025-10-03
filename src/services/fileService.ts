import { saveAs } from 'file-saver';
import type { TextSegment } from '../types';

export class FileService {
  static generateHtmlContent(title: string, segments: TextSegment[]): string {
    const segmentsHtml = segments.map(segment => {
      const color = segment.isUserInput ? '#22c55e' : '#000000';
      return `<span style="color: ${color};">${this.escapeHtml(segment.text)}</span>`;
    }).join(' ');

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.escapeHtml(title)}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
        }
        h1 {
            color: #333;
            border-bottom: 2px solid #eee;
            padding-bottom: 10px;
        }
        .content {
            margin-top: 20px;
            white-space: pre-wrap;
        }
        .user-input {
            color: #22c55e;
        }
        .whisper-input {
            color: #000000;
        }
        .metadata {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            font-size: 0.9em;
            color: #666;
        }
    </style>
</head>
<body>
    <h1>${this.escapeHtml(title)}</h1>
    <div class="content">
        ${segmentsHtml}
    </div>
    <div class="metadata">
        <p>Generated on: ${new Date().toLocaleString()}</p>
        <p>Total segments: ${segments.length}</p>
    </div>
</body>
</html>`;
  }

  static saveAsHtml(title: string, segments: TextSegment[]): void {
    const htmlContent = this.generateHtmlContent(title, segments);
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const filename = `${this.sanitizeFilename(title)}_${new Date().toISOString().split('T')[0]}.html`;
    saveAs(blob, filename);
  }

  static async loadFromHtml(file: File): Promise<{ title: string; segments: TextSegment[] }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const htmlContent = event.target?.result as string;
          const parsed = this.parseHtmlContent(htmlContent);
          resolve(parsed);
        } catch (error) {
          reject(new Error('Failed to parse HTML file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file);
    });
  }

  private static parseHtmlContent(htmlContent: string): { title: string; segments: TextSegment[] } {
    // Create a temporary DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // Extract title
    const titleElement = doc.querySelector('h1');
    const title = titleElement ? titleElement.textContent || 'Untitled' : 'Untitled';
    
    // Extract content
    const contentElement = doc.querySelector('.content');
    if (!contentElement) {
      throw new Error('Invalid HTML structure');
    }
    
    const segments: TextSegment[] = [];
    const spans = contentElement.querySelectorAll('span');
    
    spans.forEach((span, index) => {
      const text = span.textContent || '';
      const color = span.style.color;
      const isUserInput = color === 'rgb(34, 197, 94)' || color === '#22c55e';
      
      if (text.trim()) {
        segments.push({
          id: `loaded_${Date.now()}_${index}`,
          text: text.trim(),
          isUserInput,
          timestamp: Date.now()
        });
      }
    });
    
    return { title, segments };
  }

  private static escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  private static sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-z0-9]/gi, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .toLowerCase() || 'untitled';
  }
}

export const fileService = new FileService();