import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { DiffNode } from '../../services/json-diff.service';

@Component({
  selector: 'app-json-tree',
  standalone: false,
  templateUrl: './json-tree.component.html',
  styleUrls: ['./json-tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JsonTreeComponent {
  @Input() node!: DiffNode;
  @Input() level: number = 0;
  @Input() side: 'left' | 'right' = 'right';
  @Output() toggle = new EventEmitter<void>();
  @Output() toggleAll = new EventEmitter<boolean>();

  get hasChildren(): boolean {
    return !!(this.node.children && this.node.children.length > 0);
  }

  get isExpandable(): boolean {
    return this.hasChildren;
  }

  get nodeClass(): string {
    return `diff-${this.node.type}`;
  }

  get displayKey(): string {
    if (!this.node.key) return '';
    const key = this.node.key;
    return /^\d+$/.test(key) ? `[${key}]` : key;
  }

  get valuePreview(): string {
    const value = this.side === 'left' && this.node.oldValue !== undefined 
      ? this.node.oldValue 
      : this.node.value;
    
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    const type = typeof value;
    if (type === 'string') {
      return `"${value.length > 50 ? value.substring(0, 50) + '...' : value}"`;
    }
    if (type === 'number' || type === 'boolean') {
      return String(value);
    }
    if (Array.isArray(value)) {
      return `Array(${value.length})`;
    }
    if (type === 'object') {
      const keys = Object.keys(value);
      return `Object {${keys.length}}`;
    }
    return String(value);
  }

  toggleExpand(): void {
    this.node.isExpanded = !this.node.isExpanded;
    this.toggle.emit();
  }

  toggleChildren(expand: boolean): void {
    this.toggleAll.emit(expand);
  }

  getIndentStyle(): { [key: string]: string } {
    return {
      'margin-left': `${this.level * 20}px`
    };
  }

  isArrayIndex(): boolean {
    return /^\d+$/.test(this.node.key);
  }
}
