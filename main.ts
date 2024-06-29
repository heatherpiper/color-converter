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
    const selection = editor.getSelection();
    const converted = this.performColorConversion(selection, format);
    editor.replaceSelection(converted);
  }

  performColorConversion(color: string, format: 'rgb' | 'hex' | 'hsl'): string {
    switch (format) {
      case 'rgb':
        return this.convertToRGBA(color);
      case 'hex':
        return this.convertToHEX(color);
      case 'hsl':
        return this.convertToHSLA(color);
      default:
        return "Invalid conversion format";
    }
  }

  convertToRGBA(color: string): string {
    if (/^(#|&num;)?[0-9A-F]{6}([0-9A-F]{2})?$/i.test(color)) {
      return this.hexToRgba(color);
    } else if (/^hsla?\((\d+),\s*([\d.]+)%,\s*([\d.]+)%(?:,\s*([\d.]+))?\)$/i.test(color)) {
      const [h, s, l, a = "1"] = color.match(/[\d.]+/g) as string[];
      return this.hslaToRgba(parseInt(h), parseInt(s), parseInt(l), parseFloat(a));
    } else if (/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/i.test(color)) {
      return color.replace(/^rgb/, 'rgba').replace(/\)$/, ',1)');
    } else {
      return "Invalid color format";
    }
  }

  convertToHEX(color: string): string {
    if (/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/i.test(color)) {
      const [r, g, b, a = "1"] = color.match(/[\d.]+/g) as string[];
      return this.rgbaToHex(parseInt(r), parseInt(g), parseInt(b), parseFloat(a));
    } else if (/^hsla?\((\d+),\s*([\d.]+)%,\s*([\d.]+)%(?:,\s*([\d.]+))?\)$/i.test(color)) {
      const [h, s, l, a = "1"] = color.match(/[\d.]+/g) as string[];
      const rgba = this.hslaToRgba(parseInt(h), parseInt(s), parseInt(l), parseFloat(a));
      const [r, g, b, alpha] = rgba.match(/[\d.]+/g) as string[];
      return this.rgbaToHex(parseInt(r), parseInt(g), parseInt(b), parseFloat(alpha));
    } else if (/^(#|&num;)?[0-9A-F]{6}([0-9A-F]{2})?$/i.test(color)) {
      const hex = color.replace(/(#|&num;)/g, "");
      return "#" + hex.padEnd(8, 'F').toUpperCase();
    } else {
      return "Invalid color format";
    }
  }

  convertToHSLA(color: string): string {
    if (/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/i.test(color)) {
      const [r, g, b, a = "1"] = color.match(/[\d.]+/g) as string[];
      return this.rgbaToHsla(parseInt(r), parseInt(g), parseInt(b), parseFloat(a));
    } else if (/^(#|&num;)?[0-9A-F]{6}([0-9A-F]{2})?$/i.test(color)) {
      const rgba = this.hexToRgba(color);
      const [r, g, b, a] = rgba.match(/[\d.]+/g) as string[];
      return this.rgbaToHsla(parseInt(r), parseInt(g), parseInt(b), parseFloat(a));
    } else if (/^hsla?\((\d+),\s*([\d.]+)%,\s*([\d.]+)%(?:,\s*([\d.]+))?\)$/i.test(color)) {
      return color.replace(/^hsl/, 'hsla').replace(/\)$/, ',1)');
    } else {
      return "Invalid color format";
    }
  }

  // Helper functions
  hexToRgba(hex: string): string {
    hex = hex.replace(/(#|&num;)/g, '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const a = hex.length === 8 ? (parseInt(hex.substring(6, 8), 16) / 255).toFixed(2) : "1";
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  hslaToRgba(h: number, s: number, l: number, a: number): string {
    s /= 100;
    l /= 100;
    const k = (n: number) => (n + h / 30) % 12;
    const chroma = s * Math.min(l, 1 - l);
    const f = (n: number) =>
      l - chroma * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return `rgba(${Math.round(255 * f(0))}, ${Math.round(255 * f(8))}, ${Math.round(255 * f(4))}, ${a})`;
  }

  rgbaToHex(r: number, g: number, b: number, a: number): string {
    const alphaHex = Math.round(a * 255).toString(16).padStart(2, '0');
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase() + alphaHex.toUpperCase();
  }

  rgbaToHsla(r: number, g: number, b: number, a: number): string {
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

    const hDegrees = isNaN(h) ? 0 : Math.round(h * 360);
    const sPercent = isNaN(s) ? 0 : Math.round(s * 100);
    const lPercent = isNaN(l) ? 0 : Math.round(l * 100);

    return `hsla(${hDegrees}, ${sPercent}%, ${lPercent}%, ${a})`;
  }
}