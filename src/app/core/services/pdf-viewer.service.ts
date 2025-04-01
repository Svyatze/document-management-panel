import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Observable, from } from 'rxjs';

import PSPDFKit from 'pspdfkit';

@Injectable({
  providedIn: 'root'
})
export class PdfViewerService {
  private instance: any = null;

  constructor(@Inject(DOCUMENT) private document: Document) {}

  public loadDocument(containerRef: HTMLElement, documentUrl: string): Observable<any> {
    const window = this.document.defaultView;
    const baseUrl = `${window?.location.protocol}//${window?.location.host}/assets/pspdfkit/`;

    return from(
      (PSPDFKit as any).load({
        container: containerRef,
        document: documentUrl,
        baseUrl: baseUrl,
        toolbarItems: [
          { type: 'sidebar-thumbnails' },
          { type: 'sidebar-document-outline' },
          { type: 'sidebar-annotations' },
          { type: 'pager' },
          { type: 'zoom-out' },
          { type: 'zoom-in' },
          { type: 'zoom-mode' },
          { type: 'spacer' },
          { type: 'text-highlighter' },
          { type: 'ink' },
          { type: 'stamp' },
          { type: 'note' },
          { type: 'ink-eraser' },
          { type: 'print' },
          { type: 'export-pdf' }
        ]
      }).then((instance: any) => {
        this.instance = instance;
        return instance;
      })
    );
  }

  public unloadDocument(): void {
    try {
      if (this.instance) {
        if (typeof this.instance.dispose === 'function') {
          this.instance.dispose();
        } else if (typeof this.instance.unload === 'function') {
          this.instance.unload();
        } else {
          console.warn('Could not find dispose or unload method on PSPDFKit instance');
        }
        this.instance = null;
      }
    } catch (error) {
      console.error('Error unloading PSPDFKit:', error);
      this.instance = null;
    }
  }
}
