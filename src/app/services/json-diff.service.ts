import { Injectable } from '@angular/core';

export type DiffType = 'added' | 'removed' | 'modified' | 'unchanged';

export interface DiffNode {
  key: string;
  path: string;
  type: DiffType;
  value: any;
  oldValue?: any;
  children?: DiffNode[];
  isExpanded: boolean;
  depth: number;
  hasNestedChanges: boolean;
  isPlaceholder?: boolean;
}

export interface DiffResult {
  left: DiffNode | null;
  right: DiffNode | null;
  summary: {
    added: number;
    removed: number;
    modified: number;
    unchanged: number;
    total: number;
  };
  performance: {
    compareTime: number;
    nodeCount: number;
    maxDepth: number;
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

  private buildPath(parentPath: string, key: string | number): string {
    if (parentPath === '') {
      return String(key);
    }
    return typeof key === 'number' ? `${parentPath}[${key}]` : `${parentPath}.${key}`;
  }

  private shouldExpandNode(node: DiffNode, maxAutoExpandDepth: number = 3): boolean {
    if (node.depth > maxAutoExpandDepth) {
      return false;
    }
    return node.type !== 'unchanged' || node.hasNestedChanges;
  }

  compare(oldJson: any, newJson: any, maxAutoExpandDepth: number = 3): DiffResult {
    const startTime = performance.now();
    
    if (oldJson === undefined && newJson === undefined) {
      return {
        left: null,
        right: null,
        summary: { added: 0, removed: 0, modified: 0, unchanged: 0, total: 0 },
        performance: { compareTime: 0, nodeCount: 0, maxDepth: 0 }
      };
    }

    let unifiedResult: DiffNode | null = null;
    let maxDepth = 0;
    let nodeCount = 0;

    const countNodes = (node: DiffNode): void => {
      nodeCount++;
      if (node.depth > maxDepth) {
        maxDepth = node.depth;
      }
      if (node.children) {
        for (const child of node.children) {
          countNodes(child);
        }
      }
    };

    if (oldJson === undefined) {
      unifiedResult = this.createAddedNode(newJson, '', 0);
    } else if (newJson === undefined) {
      unifiedResult = this.createRemovedNode(oldJson, '', 0);
    } else {
      unifiedResult = this.compareValues(oldJson, newJson, '', '', 0);
    }

    if (unifiedResult) {
      this.applyExpandStrategy(unifiedResult, maxAutoExpandDepth);
      countNodes(unifiedResult);
    }

    const summary = this.countChanges(unifiedResult);
    const compareTime = performance.now() - startTime;

    let leftResult: DiffNode | null = null;
    let rightResult: DiffNode | null = null;

    if (unifiedResult) {
      if (unifiedResult.type === 'added') {
        leftResult = null;
        rightResult = this.cloneNodeForSide(unifiedResult, 'right');
      } else if (unifiedResult.type === 'removed') {
        leftResult = this.cloneNodeForSide(unifiedResult, 'left');
        rightResult = null;
      } else {
        leftResult = this.cloneNodeForSide(unifiedResult, 'left');
        rightResult = this.cloneNodeForSide(unifiedResult, 'right');
      }
    }

    return {
      left: leftResult,
      right: rightResult,
      summary: {
        ...summary,
        total: summary.added + summary.removed + summary.modified + summary.unchanged
      },
      performance: {
        compareTime,
        nodeCount,
        maxDepth
      }
    };
  }

  private cloneNodeForSide(node: DiffNode, side: 'left' | 'right'): DiffNode {
    const isPlaceholder = (side === 'left' && node.type === 'added') || 
                          (side === 'right' && node.type === 'removed');

    const cloned: DiffNode = {
      key: node.key,
      path: node.path,
      type: node.type,
      value: node.value,
      oldValue: node.oldValue,
      isExpanded: node.isExpanded,
      depth: node.depth,
      hasNestedChanges: node.hasNestedChanges,
      isPlaceholder: isPlaceholder,
      children: undefined
    };

    if (node.children) {
      cloned.children = node.children.map(child => this.cloneNodeForSide(child, side));
    }

    return cloned;
  }

  private createAddedNode(value: any, path: string, depth: number): DiffNode {
    const hasChildren = this.isObject(value) || Array.isArray(value);
    const children: DiffNode[] = [];
    
    if (hasChildren) {
      const items = Array.isArray(value) ? value : Object.keys(value);
      for (let i = 0; i < items.length; i++) {
        const key = Array.isArray(value) ? i : items[i];
        const childValue = Array.isArray(value) ? value[i] : value[key as string];
        const childPath = this.buildPath(path, key);
        children.push(this.createAddedNode(childValue, childPath, depth + 1));
      }
    }

    return {
      key: '',
      path,
      type: 'added',
      value,
      children: children.length > 0 ? children : undefined,
      isExpanded: depth < 3,
      depth,
      hasNestedChanges: true
    };
  }

  private createRemovedNode(value: any, path: string, depth: number): DiffNode {
    const hasChildren = this.isObject(value) || Array.isArray(value);
    const children: DiffNode[] = [];
    
    if (hasChildren) {
      const items = Array.isArray(value) ? value : Object.keys(value);
      for (let i = 0; i < items.length; i++) {
        const key = Array.isArray(value) ? i : items[i];
        const childValue = Array.isArray(value) ? value[i] : value[key as string];
        const childPath = this.buildPath(path, key);
        children.push(this.createRemovedNode(childValue, childPath, depth + 1));
      }
    }

    return {
      key: '',
      path,
      type: 'removed',
      value,
      children: children.length > 0 ? children : undefined,
      isExpanded: depth < 3,
      depth,
      hasNestedChanges: true
    };
  }

  private compareValues(
    oldVal: any, 
    newVal: any, 
    path: string, 
    key: string | number, 
    depth: number
  ): DiffNode {
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
        isExpanded: false,
        depth,
        hasNestedChanges: false
      };
    }

    if (oldVal === newVal) {
      return {
        key: String(key),
        path: fullPath,
        type: 'unchanged',
        value: newVal,
        isExpanded: false,
        depth,
        hasNestedChanges: false
      };
    }

    if (this.isObject(oldVal) && this.isObject(newVal)) {
      return this.compareObjects(oldVal, newVal, path, key, depth);
    }

    if (Array.isArray(oldVal) && Array.isArray(newVal)) {
      return this.compareArrays(oldVal, newVal, path, key, depth);
    }

    return {
      key: String(key),
      path: fullPath,
      type: 'modified',
      value: newVal,
      oldValue: oldVal,
      isExpanded: false,
      depth,
      hasNestedChanges: false
    };
  }

  private compareObjects(
    oldObj: Record<string, any>, 
    newObj: Record<string, any>, 
    path: string, 
    key: string | number, 
    depth: number
  ): DiffNode {
    const fullPath = this.buildPath(path, key);
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);
    const children: DiffNode[] = [];
    let hasChanges = false;
    let hasNestedChanges = false;

    for (const k of allKeys) {
      const oldHas = Object.prototype.hasOwnProperty.call(oldObj, k);
      const newHas = Object.prototype.hasOwnProperty.call(newObj, k);

      if (!oldHas) {
        hasChanges = true;
        hasNestedChanges = true;
        children.push({
          key: k,
          path: this.buildPath(fullPath, k),
          type: 'added',
          value: newObj[k],
          isExpanded: false,
          depth: depth + 1,
          hasNestedChanges: false
        });
      } else if (!newHas) {
        hasChanges = true;
        hasNestedChanges = true;
        children.push({
          key: k,
          path: this.buildPath(fullPath, k),
          type: 'removed',
          value: oldObj[k],
          isExpanded: false,
          depth: depth + 1,
          hasNestedChanges: false
        });
      } else {
        const child = this.compareValues(oldObj[k], newObj[k], fullPath, k, depth + 1);
        if (child.type !== 'unchanged' || child.hasNestedChanges) {
          hasChanges = true;
          if (child.hasNestedChanges || child.type !== 'unchanged') {
            hasNestedChanges = true;
          }
        }
        children.push(child);
      }
    }

    children.sort((a, b) => {
      const typeOrder: Record<DiffType, number> = {
        'removed': 0,
        'modified': 1,
        'added': 2,
        'unchanged': 3
      };
      return typeOrder[a.type] - typeOrder[b.type];
    });

    return {
      key: String(key),
      path: fullPath,
      type: hasChanges ? 'modified' : 'unchanged',
      value: newObj,
      oldValue: oldObj,
      children: children.length > 0 ? children : undefined,
      isExpanded: false,
      depth,
      hasNestedChanges
    };
  }

  private compareArrays(
    oldArr: any[], 
    newArr: any[], 
    path: string, 
    key: string | number, 
    depth: number
  ): DiffNode {
    const fullPath = this.buildPath(path, key);
    const maxLen = Math.max(oldArr.length, newArr.length);
    const children: DiffNode[] = [];
    let hasChanges = false;
    let hasNestedChanges = false;

    for (let i = 0; i < maxLen; i++) {
      const oldHas = i < oldArr.length;
      const newHas = i < newArr.length;

      if (!oldHas) {
        hasChanges = true;
        hasNestedChanges = true;
        children.push({
          key: String(i),
          path: this.buildPath(fullPath, i),
          type: 'added',
          value: newArr[i],
          isExpanded: false,
          depth: depth + 1,
          hasNestedChanges: false
        });
      } else if (!newHas) {
        hasChanges = true;
        hasNestedChanges = true;
        children.push({
          key: String(i),
          path: this.buildPath(fullPath, i),
          type: 'removed',
          value: oldArr[i],
          isExpanded: false,
          depth: depth + 1,
          hasNestedChanges: false
        });
      } else {
        const child = this.compareValues(oldArr[i], newArr[i], fullPath, i, depth + 1);
        if (child.type !== 'unchanged' || child.hasNestedChanges) {
          hasChanges = true;
          hasNestedChanges = true;
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
      children: children.length > 0 ? children : undefined,
      isExpanded: false,
      depth,
      hasNestedChanges
    };
  }

  private applyExpandStrategy(node: DiffNode, maxAutoExpandDepth: number): void {
    node.isExpanded = this.shouldExpandNode(node, maxAutoExpandDepth);
    
    if (node.children) {
      for (const child of node.children) {
        this.applyExpandStrategy(child, maxAutoExpandDepth);
      }
    }
  }

  private countChanges(node: DiffNode | null): { 
    added: number; 
    removed: number; 
    modified: number; 
    unchanged: number 
  } {
    const result = { added: 0, removed: 0, modified: 0, unchanged: 0 };
    
    if (!node) return result;

    const hasChildren = node.children && node.children.length > 0;

    if (node.type === 'added') {
      if (!hasChildren) result.added++;
    } else if (node.type === 'removed') {
      if (!hasChildren) result.removed++;
    } else if (node.type === 'modified') {
      if (!hasChildren) result.modified++;
    } else {
      if (!hasChildren) result.unchanged++;
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

  setNodeExpanded(node: DiffNode, expanded: boolean, recursive: boolean = false): void {
    node.isExpanded = expanded;
    if (recursive && node.children) {
      for (const child of node.children) {
        this.setNodeExpanded(child, expanded, recursive);
      }
    }
  }

  expandToDepth(node: DiffNode, targetDepth: number): void {
    if (node.depth <= targetDepth) {
      node.isExpanded = true;
    }
    if (node.children) {
      for (const child of node.children) {
        this.expandToDepth(child, targetDepth);
      }
    }
  }
}
