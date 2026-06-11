import { Directive, ElementRef, HostListener, inject, output } from '@angular/core';

@Directive({
  selector: '[appOutsideClick]',
})
export class OutsideClickDirective {
  readonly appOutsideClick = output<void>();

  private readonly elementRef = inject(ElementRef<HTMLElement>);

  @HostListener('document:click', ['$event.target'])
  onClick(targetElement: EventTarget | null): void {
    const clickedInside =
      this.elementRef.nativeElement.contains(targetElement as Node | null);
    if (!clickedInside) {
      this.appOutsideClick.emit();
    }
  }
}
