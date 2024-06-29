import { Plugin, Editor } from 'obsidian';

export default class ColorConverterPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: 'convert-to-rgb',
      name: 'Convert to RGB',
      editorCallback: (editor: Editor) => this.convertColor(editor, 'rgb')
    });

    this.addCommand({
      id: 'convert-to-hex',
      name: 'Convert to HEX',
      editorCallback: (editor: Editor) => this.convertColor(editor, 'hex')
    });

    this.addCommand({
      id: 'convert-to-hsl',
      name: 'Convert to HSL',
      editorCallback: (editor: Editor) => this.convertColor(editor, 'hsl')
    });
  }

  convertColor(editor: Editor, format: 'rgb' | 'hex' | 'hsl') {
    const selection = editor.getSelection();
    const converted = this.performColorConversion(selection, format);
    editor.replaceSelection(converted);
  }

  performColorConversion(color: string, format: 'rgb' | 'hex' | 'hsl'): string {
    switch (format) {
      case 'rgb':
        return this.convertToRGB(color);
      case 'hex':
        return this.convertToHEX(color);
      case 'hsl':
        return this.convertToHSL(color);
      default:
        return "Invalid conversion format";
    }
  }

  convertToRGB(color: string): string {
    if (/^(\\#|&num;)?[0-9A-F]{6}$/i.test(color)) {
      return this.hexToRgb(color);
    } else if (/^hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)$/i.test(color)) {
      const [h, s, l] = color.match(/\d+/g) as string[];
      return this.hslToRgb(parseInt(h), parseInt(s), parseInt(l));
    } else {
      return "Invalid color format";
    }
  }

  convertToHEX(color: string): string {
    if (/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i.test(color)) {
      const [r, g, b] = color.match(/\d+/g) as string[];
      return this.rgbToHex(parseInt(r), parseInt(g), parseInt(b));
    } else if (/^hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)$/i.test(color)) {
      const [h, s, l] = color.match(/\d+/g) as string[];
      const rgb = this.hslToRgb(parseInt(h), parseInt(s), parseInt(l));
      const [r, g, b] = rgb.match(/\d+/g) as string[];
      return this.rgbToHex(parseInt(r), parseInt(g), parseInt(b));
    } else if (/^(\\#|&num;)?[0-9A-F]{6}$/i.test(color)) {
      const hex = color.replace(/(\\#|&num;)/g, "");
      return "\\#" + hex.toUpperCase();
    } else {
      return "Invalid color format";
    }
  }

  convertToHSL(color: string): string {
    if (/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/i.test(color)) {
      const [r, g, b] = color.match(/\d+/g) as string[];
      return this.rgbToHsl(parseInt(r), parseInt(g), parseInt(b));
    } else if (/^(\\#|&num;)?[0-9A-F]{6}$/i.test(color)) {
      const rgb = this.hexToRgb(color);
      const [r, g, b] = rgb.match(/\d+/g) as string[];
      return this.rgbToHsl(parseInt(r), parseInt(g), parseInt(b));
    } else {
      return "Invalid color format";
    }
  }

  // Helper functions
  hexToRgb(hex: string): string {
    hex = hex.replace(/(\\#|&num;)/g, '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgb(${r}, ${g}, ${b})`;
  }

  hslToRgb(h: number, s: number, l: number): string {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n: number) =>
      l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return `rgb(${Math.round(255 * f(0))}, ${Math.round(255 * f(8))}, ${Math.round(255 * f(4))})`;
  }

  rgbToHex(r: number, g: number, b: number): string {
    return "\\#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  }

  rgbToHsl(r: number, g: number, b: number): string {
    r /= 255;
    g /= 255;
    b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        case b: h = (r - g) / d + 4; break;
      }
      h /= 6;
    }

    // Ensure h, s, and l are numbers before rounding
    const hDegrees = isNaN(h) ? 0 : Math.round(h * 360);
    const sPercent = isNaN(s) ? 0 : Math.round(s * 100);
    const lPercent = isNaN(l) ? 0 : Math.round(l * 100);

    return `hsl(${hDegrees}, ${sPercent}%, ${lPercent}%)`;
  }
}