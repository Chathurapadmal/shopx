declare module "jspdf" {
  export default class jsPDF {
    constructor(options?: { unit?: string; format?: number[] });
    addImage(imageData: string, format: string, x: number, y: number, width: number, height: number): void;
    save(filename: string): void;
  }
}

declare module "html2canvas" {
  export default function html2canvas(element: HTMLElement, options?: any): Promise<HTMLCanvasElement>;
}
