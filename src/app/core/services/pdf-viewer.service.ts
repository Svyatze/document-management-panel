import { Injectable, Inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Observable, from, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import PSPDFKit from 'pspdfkit';

@Injectable({
  providedIn: 'root'
})
export class PdfViewerService {
  private instance: any = null;
  private containerRef: HTMLElement | null = null;

  constructor(@Inject(DOCUMENT) private document: Document) {}

  public loadDocument(containerRef: HTMLElement, documentUrl: string): Observable<any> {
    this.containerRef = containerRef;

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
    ).pipe(
      catchError(error => {
        console.error('Error loading PDF document:', error);
        return of(null);
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
        }
      }
    } catch (error) {
      console.warn('Error disposing PSPDFKit instance:', error);
    } finally {
      this.instance = null;

      if (this.containerRef && this.document.body.contains(this.containerRef)) {
        while (this.containerRef.firstChild) {
          this.containerRef.removeChild(this.containerRef.firstChild);
        }
      }
      this.containerRef = null;
    }
  }
}
