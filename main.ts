import { Plugin, Editor } from 'obsidian';

export default class ColorConverterPlugin extends Plugin {
  async onload() {
    this.addCommand({
      id: 'convert-to-rgb',
      name: 'Convert to RGB/RGBA',
      editorCallback: (editor: Editor) => this.convertColor(editor, 'rgb')
    });

    this.addCommand({
      id: 'convert-to-hex',
      name: 'Convert to HEX',
      editorCallback: (editor: Editor) => this.convertColor(editor, 'hex')
    });

    this.addCommand({
      id: 'convert-to-hsl',
      name: 'Convert to HSL/HSLA',
      editorCallback: (editor: Editor) => this.convertColor(editor, 'hsl')
    });
  }

  convertColor(editor: Editor, format: 'rgb' | 'hex' | 'hsl') {
    try {
      const selection = editor.getSelection();
      if (!selection) {
        console.error('No text selected');
        return;
      }
      console.log(`Converting to ${format}. Selected text: "${selection}"`);
      const converted = this.performColorConversion(selection, format);
      console.log(`Converted result: "${converted}"`);
      editor.replaceSelection(converted);
    } catch (error) {
      console.error('Error converting color:', error);
    }
  }

  performColorConversion(color: string, format: 'rgb' | 'hex' | 'hsl'): string {
    if (!color || typeof color !== 'string') {
      return "Invalid input: color must be a non-empty string";
    }

    color = color.replace(/^\\/, '').trim();
    
    if (/^(#|&num;)?[0-9A-Fa-f]{3,4}$/i.test(color)) {
      color = this.expandShorthandHex(color);
    }

    switch (format) {
      case 'rgb':
        return this.convertToRGBorRGBA(color);
      case 'hex':
        return this.convertToHEX(color);
      case 'hsl':
        return this.convertToHSLorHSLA(color);
      default:
        return "Invalid conversion format";
    }
  }

  convertToHEX(color: string): string {
    let result: string;
    if (/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.test(color)) {
      const [r, g, b, a] = color.match(/[\d.]+/g) as string[];
      result = this.rgbOrRgbaToHex(parseInt(r), parseInt(g), parseInt(b), a ? parseFloat(a) : undefined);
    } else if (/^hsla?\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)$/i.test(color)) {
      const [h, s, l, a] = color.match(/[\d.]+/g) as string[];
      const rgb = this.hslOrHslaToRgbOrRgba(parseInt(h), parseFloat(s), parseFloat(l), a ? parseFloat(a) : undefined);
      const [r, g, b, alpha] = rgb.match(/[\d.]+/g) as string[];
      result = this.rgbOrRgbaToHex(parseInt(r), parseInt(g), parseInt(b), alpha ? parseFloat(alpha) : undefined);
    } else if (/^(#|&num;)?[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/i.test(color)) {
      const hex = color.replace(/(#|&num;)/g, "");
      result = "#" + hex.toUpperCase();
    } else {
      return "Invalid color format";
    }
    return '\\' + result;  // Add escape character
  }

  expandShorthandHex(hex: string): string {
    hex = hex.replace(/(#|&num;)/g, '');
    if (hex.length === 3 || hex.length === 4) {
      return '#' + hex.split('').map(char => char + char).join('');
    }
    return '#' + hex;
  }

  convertToHSLorHSLA(color: string): string {
    if (/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.test(color)) {
      const [r, g, b, a] = color.match(/[\d.]+/g) as string[];
      return this.rgbOrRgbaToHslOrHsla(parseInt(r), parseInt(g), parseInt(b), a ? parseFloat(a) : undefined);
    } else if (/^(#|&num;)?[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/i.test(color)) {
      const rgb = this.hexToRgbOrRgba(color);
      const [r, g, b, a] = rgb.match(/[\d.]+/g) as string[];
      return this.rgbOrRgbaToHslOrHsla(parseInt(r), parseInt(g), parseInt(b), a ? parseFloat(a) : undefined);
    } else if (/^hsla?\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)$/i.test(color)) {
      return color; // Already in HSL/HSLA format
    } else {
      return "Invalid color format";
    }
  }

  convertToRGBorRGBA(color: string): string {
    if (/^(#|&num;)?[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/i.test(color)) {
      return this.hexToRgbOrRgba(color);
    } else if (/^hsla?\(\s*(\d+)\s*,\s*([\d.]+)%\s*,\s*([\d.]+)%\s*(?:,\s*([\d.]+)\s*)?\)$/i.test(color)) {
      const [h, s, l, a] = color.match(/[\d.]+/g) as string[];
      return this.hslOrHslaToRgbOrRgba(parseInt(h), parseFloat(s), parseFloat(l), a ? parseFloat(a) : undefined);
    } else if (/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.test(color)) {
      return color; // Already in RGB/RGBA format
    } else {
      return "Invalid color format";
    }
  }

  // Helper functions

  hexToRgbOrRgba(hex: string): string {
    hex = hex.replace(/^(\\#|#|&num;)/g, '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    if (hex.length === 8) {
      const a = (parseInt(hex.substring(6, 8), 16) / 255).toFixed(2);
      return `rgba(${r}, ${g}, ${b}, ${a})`;
    }
    return `rgb(${r}, ${g}, ${b})`;
  }

  hslOrHslaToRgbOrRgba(h: number, s: number, l: number, a?: number): string {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const chroma = s * Math.min(l, 1 - l);
    const f = (n: number) =>
      l - chroma * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const rgb = [
      Math.round(255 * f(0)),
      Math.round(255 * f(8)),
      Math.round(255 * f(4))
    ];
    return a !== undefined 
      ? `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${a.toFixed(2)})`
      : `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
  }

  rgbOrRgbaToHex(r: number, g: number, b: number, a?: number): string {
    const toHex = (value: number) => value.toString(16).padStart(2, '0');
    const hex = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    return a !== undefined ? hex + toHex(Math.round(a * 255)) : hex;
  }

  rgbOrRgbaToHslOrHsla(r: number, g: number, b: number, a?: number): string {
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

    const hDegrees = Math.round(h * 360);
    const sPercent = Math.round(s * 100);
    const lPercent = Math.round(l * 100);

    return a !== undefined
      ? `hsla(${hDegrees}, ${sPercent}%, ${lPercent}%, ${a.toFixed(2)})`
      : `hsl(${hDegrees}, ${sPercent}%, ${lPercent}%)`;
  }
}