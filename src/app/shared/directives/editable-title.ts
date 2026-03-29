import {
  Directive,
  ElementRef,
  HostListener,
  inject,
  input,
  output,
  Renderer2,
} from '@angular/core';

@Directive({
  selector: '[appEditableTitle]',
})
export class EditableTitle {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  // Input para habilitar/deshabilitar la edición
  editableEnabled = input<boolean>(true);

  // Emitimos el nuevo título al confirmar
  titleChanged = output<string>();

  private isEditing = false;
  private originalText = '';

  @HostListener('mouseenter')
  onMouseEnter() {
    if (!this.editableEnabled() || this.isEditing) return;

    if (this.editableEnabled()) this.renderer.addClass(this.el.nativeElement, 'cursor-pointer');
    this.renderer.addClass(this.el.nativeElement, 'border-b');
    this.renderer.addClass(this.el.nativeElement, 'border-dashed');
    this.renderer.addClass(this.el.nativeElement, 'border-slate-400');
    this.renderer.addClass(this.el.nativeElement, 'text-slate-100');
  }

  @HostListener('mouseleave')
  onMouseLeave() {
    if (this.isEditing) return;

    this.renderer.removeClass(this.el.nativeElement, 'cursor-pointer');
    this.renderer.removeClass(this.el.nativeElement, 'border-b');
    this.renderer.removeClass(this.el.nativeElement, 'border-dashed');
    this.renderer.removeClass(this.el.nativeElement, 'border-slate-400');
    this.renderer.removeClass(this.el.nativeElement, 'text-slate-100');
  }

  @HostListener('click')
  onClick() {
    if (!this.editableEnabled() || this.isEditing) return;

    this.isEditing = true;
    this.originalText = this.el.nativeElement.innerText.trim();

    this.startEditing();
  }

  private startEditing() {
    const input = this.renderer.createElement('input');

    // Estilos rápidos para que coincida con tu diseño de Tailwind
    this.renderer.setAttribute(input, 'value', this.originalText);
    this.renderer.addClass(input, 'bg-slate-700');
    this.renderer.addClass(input, 'text-white');
    this.renderer.addClass(input, 'outline-none');
    this.renderer.addClass(input, 'rounded');
    this.renderer.addClass(input, 'px-1');
    this.renderer.addClass(input, 'w-full');

    // Limpiamos el span y metemos el input
    this.el.nativeElement.innerHTML = '';
    this.renderer.appendChild(this.el.nativeElement, input);

    input.focus();
    input.select();

    // Eventos del input
    this.renderer.listen(input, 'keydown', (event: KeyboardEvent) => {
      if (event.key === 'Enter') {
        this.confirmEdit(input.value);
      } else if (event.key === 'Escape') {
        this.cancelEdit();
      }
    });

    // Si hace click fuera confirmamos
    this.renderer.listen(input, 'blur', () => {
      if (this.isEditing) this.confirmEdit(input.value);
    });
  }

  private confirmEdit(newValue: string) {
    this.isEditing = false;
    const finalValue = newValue.trim() || this.originalText;
    this.el.nativeElement.innerText = finalValue;
    this.titleChanged.emit(finalValue);
  }

  private cancelEdit() {
    this.isEditing = false;
    this.el.nativeElement.innerText = this.originalText;
  }
}
