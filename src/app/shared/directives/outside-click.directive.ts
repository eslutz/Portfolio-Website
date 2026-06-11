import { Directive, ElementRef, HostListener, inject, output } from '@angular/core';

@Directive({
  selector: '[appOutsideClick]',
})
export class OutsideClickDirective {
  readonly appOutsideClick = output<void>();

  private readonly elementRef = inject(ElementRef<HTMLElement>);

  @HostListener('document:click', ['$event.target'])
  onClick(targetElement: HTMLElement): void {
    const clickedInside =
      this.elementRef.nativeElement.contains(targetElement);
    if (!clickedInside) {
      this.appOutsideClick.emit();
    }
  }
}
