import { Injectable } from '@angular/core';

export interface DiffNode {
  key: string;
  path: string;
  type: 'added' | 'removed' | 'modified' | 'unchanged';
  value: any;
  oldValue?: any;
  children?: DiffNode[];
  isExpanded: boolean;
}

export interface DiffResult {
  left: DiffNode | null;
  right: DiffNode | null;
  summary: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class JsonDiffService {
  private getType(value: any): string {
    if (value === null) return 'null';
    if (Array.isArray(value)) return 'array';
    return typeof value;
  }

  private isObject(value: any): boolean {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  private isArray(value: any): boolean {
    return Array.isArray(value);
  }

  private buildPath(parentPath: string, key: string | number): string {
    if (parentPath === '') {
      return String(key);
    }
    return typeof key === 'number' ? `${parentPath}[${key}]` : `${parentPath}.${key}`;
  }

  private compareValues(oldVal: any, newVal: any, path: string, key: string | number): DiffNode {
    const fullPath = this.buildPath(path, key);
    const oldType = this.getType(oldVal);
    const newType = this.getType(newVal);

    if (oldType !== newType) {
      return {
        key: String(key),
        path: fullPath,
        type: 'modified',
        value: newVal,
        oldValue: oldVal,
        isExpanded: true
      };
    }

    if (oldVal === newVal) {
      return {
        key: String(key),
        path: fullPath,
        type: 'unchanged',
        value: newVal,
        isExpanded: true
      };
    }

    if (this.isObject(oldVal) && this.isObject(newVal)) {
      return this.compareObjects(oldVal, newVal, path, key);
    }

    if (this.isArray(oldVal) && this.isArray(newVal)) {
      return this.compareArrays(oldVal, newVal, path, key);
    }

    return {
      key: String(key),
      path: fullPath,
      type: 'modified',
      value: newVal,
      oldValue: oldVal,
      isExpanded: true
    };
  }

  private compareObjects(oldObj: Record<string, any>, newObj: Record<string, any>, path: string, key: string | number): DiffNode {
    const fullPath = this.buildPath(path, key);
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    const children: DiffNode[] = [];
    let hasChanges = false;

    for (const k of allKeys) {
      const oldHas = Object.prototype.hasOwnProperty.call(oldObj, k);
      const newHas = Object.prototype.hasOwnProperty.call(newObj, k);

      if (!oldHas) {
        hasChanges = true;
        children.push({
          key: k,
          path: this.buildPath(fullPath, k),
          type: 'added',
          value: newObj[k],
          isExpanded: true
        });
      } else if (!newHas) {
        hasChanges = true;
        children.push({
          key: k,
          path: this.buildPath(fullPath, k),
          type: 'removed',
          value: oldObj[k],
          isExpanded: true
        });
      } else {
        const child = this.compareValues(oldObj[k], newObj[k], fullPath, k);
        if (child.type !== 'unchanged') {
          hasChanges = true;
        }
        children.push(child);
      }
    }

    return {
      key: String(key),
      path: fullPath,
      type: hasChanges ? 'modified' : 'unchanged',
      value: newObj,
      oldValue: oldObj,
      children,
      isExpanded: true
    };
  }

  private compareArrays(oldArr: any[], newArr: any[], path: string, key: string | number): DiffNode {
    const fullPath = this.buildPath(path, key);
    const maxLen = Math.max(oldArr.length, newArr.length);
    const children: DiffNode[] = [];
    let hasChanges = false;

    for (let i = 0; i < maxLen; i++) {
      const oldHas = i < oldArr.length;
      const newHas = i < newArr.length;

      if (!oldHas) {
        hasChanges = true;
        children.push({
          key: String(i),
          path: this.buildPath(fullPath, i),
          type: 'added',
          value: newArr[i],
          isExpanded: true
        });
      } else if (!newHas) {
        hasChanges = true;
        children.push({
          key: String(i),
          path: this.buildPath(fullPath, i),
          type: 'removed',
          value: oldArr[i],
          isExpanded: true
        });
      } else {
        const child = this.compareValues(oldArr[i], newArr[i], fullPath, i);
        if (child.type !== 'unchanged') {
          hasChanges = true;
        }
        children.push(child);
      }
    }

    return {
      key: String(key),
      path: fullPath,
      type: hasChanges ? 'modified' : 'unchanged',
      value: newArr,
      oldValue: oldArr,
      children,
      isExpanded: true
    };
  }

  private countChanges(node: DiffNode | null): { added: number; removed: number; modified: number; unchanged: number } {
    const result = { added: 0, removed: 0, modified: 0, unchanged: 0 };
    
    if (!node) return result;

    if (node.type === 'added') {
      result.added++;
    } else if (node.type === 'removed') {
      result.removed++;
    } else if (node.type === 'modified') {
      if (!node.children || node.children.length === 0) {
        result.modified++;
      }
    } else {
      if (!node.children || node.children.length === 0) {
        result.unchanged++;
      }
    }

    if (node.children) {
      for (const child of node.children) {
        const childCounts = this.countChanges(child);
        result.added += childCounts.added;
        result.removed += childCounts.removed;
        result.modified += childCounts.modified;
        result.unchanged += childCounts.unchanged;
      }
    }

    return result;
  }

  compare(oldJson: any, newJson: any): DiffResult {
    if (oldJson === undefined && newJson === undefined) {
      return {
        left: null,
        right: null,
        summary: { added: 0, removed: 0, modified: 0, unchanged: 0 }
      };
    }

    if (oldJson === undefined) {
      const rightNode: DiffNode = {
        key: '',
        path: '',
        type: 'added',
        value: newJson,
        isExpanded: true
      };
      const summary = this.countChanges(rightNode);
      return {
        left: null,
        right: rightNode,
        summary
      };
    }

    if (newJson === undefined) {
      const leftNode: DiffNode = {
        key: '',
        path: '',
        type: 'removed',
        value: oldJson,
        isExpanded: true
      };
      const summary = this.countChanges(leftNode);
      return {
        left: leftNode,
        right: null,
        summary
      };
    }

    const result = this.compareValues(oldJson, newJson, '', '');
    const summary = this.countChanges(result);

    return {
      left: result,
      right: result,
      summary
    };
  }

  parseJson(text: string): any {
    if (!text || text.trim() === '') {
      return undefined;
    }
    return JSON.parse(text.trim());
  }

  formatJson(value: any, indent: number = 2): string {
    if (value === undefined) return '';
    return JSON.stringify(value, null, indent);
  }
}
