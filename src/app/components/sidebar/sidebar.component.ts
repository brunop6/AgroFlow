import { Component, Output, EventEmitter, HostBinding } from '@angular/core';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss']
})
export class SidebarComponent {
  @Output() openConfigDialogEvent = new EventEmitter<void>();

  isCollapsed = false;
  @HostBinding('class.collapsed')
  get collapsed(): boolean {
    return this.isCollapsed;
  }

  triggerOpenConfigDialog(): void {
    this.openConfigDialogEvent.emit();
  }

  toggleSidebar(): void {
    this.isCollapsed = !this.isCollapsed;
  }
}