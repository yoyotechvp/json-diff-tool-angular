import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DiffNode } from '../../services/json-diff.service';

@Component({
  selector: 'app-json-tree',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './json-tree.component.html',
  styleUrls: ['./json-tree.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class JsonTreeComponent {
  @Input() node!: DiffNode;
  @Input() level: number = 0;
  @Input() side: 'left' | 'right' = 'right';

  constructor(private cdr: ChangeDetectorRef) {}

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

  get currentValue(): any {
    return this.side === 'left' && this.node.oldValue !== undefined 
      ? this.node.oldValue 
      : this.node.value;
  }

  get showValueDiff(): boolean {
    return this.node.type === 'modified' && 
           !this.hasChildren && 
           this.node.oldValue !== undefined && 
           JSON.stringify(this.node.oldValue) !== JSON.stringify(this.node.value);
  }

  get oldValuePreview(): string {
    return this.formatValue(this.node.oldValue);
  }

  get newValuePreview(): string {
    return this.formatValue(this.node.value);
  }

  get valuePreview(): string {
    return this.formatValue(this.currentValue);
  }

  private formatValue(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    
    const type = typeof value;
    if (type === 'string') {
      return `"${value.length > 100 ? value.substring(0, 100) + '...' : value}"`;
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
    if (!this.hasChildren) return;
    this.node.isExpanded = !this.node.isExpanded;
    this.cdr.markForCheck();
  }

  toggleChildren(expand: boolean): void {
    this.setExpandRecursive(this.node, expand);
    this.cdr.markForCheck();
  }

  private setExpandRecursive(node: DiffNode, expand: boolean): void {
    if (node.children && node.children.length > 0) {
      node.isExpanded = expand;
      for (const child of node.children) {
        this.setExpandRecursive(child, expand);
      }
    }
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
