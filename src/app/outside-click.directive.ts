import { Directive, ElementRef, HostListener, Output, EventEmitter } from '@angular/core';

@Directive({
    selector: '[outsideClick]',
    standalone: false
})
export class OutsideClickDirective {
  @Output()
  outsideClick = new EventEmitter();

  constructor(private _elementRef: ElementRef) {
  }

  @HostListener('document:click', ['$event.target'])
  public onClick(targetElement: any) {
    const clickedInside = this._elementRef.nativeElement.contains(targetElement);
    if (!clickedInside) {
      this.outsideClick.emit(true);
    } else {
      this.outsideClick.emit(false);
    }
  }
}
