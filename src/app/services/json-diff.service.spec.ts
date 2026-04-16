import { TestBed } from '@angular/core/testing';
import { JsonDiffService, DiffNode, DiffResult } from './json-diff.service';

describe('JsonDiffService', () => {
  let service: JsonDiffService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JsonDiffService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('parseJson', () => {
    it('should parse valid JSON', () => {
      const json = '{"name": "test", "value": 123}';
      const result = service.parseJson(json);
      expect(result).toEqual({ name: 'test', value: 123 });
    });

    it('should return undefined for empty string', () => {
      expect(service.parseJson('')).toBeUndefined();
      expect(service.parseJson('   ')).toBeUndefined();
    });

    it('should throw error for invalid JSON', () => {
      expect(() => service.parseJson('invalid json')).toThrow();
    });
  });

  describe('formatJson', () => {
    it('should format JSON with indentation', () => {
      const obj = { name: 'test', value: 123 };
      const result = service.formatJson(obj, 2);
      expect(result).toContain('"name": "test"');
      expect(result).toContain('"value": 123');
    });

    it('should return empty string for undefined', () => {
      expect(service.formatJson(undefined)).toBe('');
    });
  });

  describe('compare - basic values', () => {
    it('should return unchanged for identical primitives', () => {
      const result = service.compare('test', 'test');
      expect(result.left?.type).toBe('unchanged');
      expect(result.summary.unchanged).toBe(1);
    });

    it('should return modified for different primitives', () => {
      const result = service.compare('old', 'new');
      expect(result.left?.type).toBe('modified');
      expect(result.summary.modified).toBe(1);
    });

    it('should return modified for type changes', () => {
      const result = service.compare('123', 123);
      expect(result.left?.type).toBe('modified');
    });

    it('should handle null values', () => {
      const result = service.compare(null, null);
      expect(result.left?.type).toBe('unchanged');
    });
  });

  describe('compare - objects', () => {
    it('should detect added property', () => {
      const oldObj = { name: 'test' };
      const newObj = { name: 'test', newProp: 'added' };
      const result = service.compare(oldObj, newObj);
      
      expect(result.summary.added).toBe(1);
      const addedChild = result.left?.children?.find(c => c.type === 'added');
      expect(addedChild).toBeDefined();
      expect(addedChild?.key).toBe('newProp');
    });

    it('should detect removed property', () => {
      const oldObj = { name: 'test', oldProp: 'removed' };
      const newObj = { name: 'test' };
      const result = service.compare(oldObj, newObj);
      
      expect(result.summary.removed).toBe(1);
      const removedChild = result.left?.children?.find(c => c.type === 'removed');
      expect(removedChild).toBeDefined();
      expect(removedChild?.key).toBe('oldProp');
    });

    it('should detect modified property', () => {
      const oldObj = { name: 'old' };
      const newObj = { name: 'new' };
      const result = service.compare(oldObj, newObj);
      
      expect(result.summary.modified).toBe(1);
      const modifiedChild = result.left?.children?.find(c => c.type === 'modified');
      expect(modifiedChild).toBeDefined();
      expect(modifiedChild?.oldValue).toBe('old');
      expect(modifiedChild?.value).toBe('new');
    });

    it('should mark parent as modified when children change', () => {
      const oldObj = { nested: { prop: 'old' } };
      const newObj = { nested: { prop: 'new' } };
      const result = service.compare(oldObj, newObj);
      
      expect(result.left?.type).toBe('modified');
      expect(result.left?.hasNestedChanges).toBe(true);
    });

    it('should return unchanged for identical objects', () => {
      const obj = { name: 'test', value: 123, nested: { deep: true } };
      const result = service.compare(obj, { ...obj, nested: { ...obj.nested } });
      
      expect(result.left?.type).toBe('unchanged');
      expect(result.summary.unchanged).toBe(3);
    });
  });

  describe('compare - arrays', () => {
    it('should detect added array element', () => {
      const oldArr = [1, 2];
      const newArr = [1, 2, 3];
      const result = service.compare(oldArr, newArr);
      
      expect(result.summary.added).toBe(1);
      const addedChild = result.left?.children?.find(c => c.type === 'added');
      expect(addedChild?.value).toBe(3);
    });

    it('should detect removed array element', () => {
      const oldArr = [1, 2, 3];
      const newArr = [1, 2];
      const result = service.compare(oldArr, newArr);
      
      expect(result.summary.removed).toBe(1);
    });

    it('should detect modified array element', () => {
      const oldArr = [1, 'old', 3];
      const newArr = [1, 'new', 3];
      const result = service.compare(oldArr, newArr);
      
      expect(result.summary.modified).toBe(1);
    });

    it('should handle nested arrays', () => {
      const oldArr = [[1, 2], [3, 4]];
      const newArr = [[1, 2, 3], [5, 4]];
      const result = service.compare(oldArr, newArr);
      
      expect(result.left?.type).toBe('modified');
      expect(result.summary.added).toBe(1);
      expect(result.summary.modified).toBe(1);
    });
  });

  describe('compare - complex scenarios', () => {
    it('should handle undefined values', () => {
      const result1 = service.compare(undefined, { test: 'data' });
      expect(result1.left).toBeNull();
      expect(result1.right?.type).toBe('added');
      
      const result2 = service.compare({ test: 'data' }, undefined);
      expect(result2.left?.type).toBe('removed');
      expect(result2.right).toBeNull();
      
      const result3 = service.compare(undefined, undefined);
      expect(result3.left).toBeNull();
      expect(result3.right).toBeNull();
      expect(result3.summary.total).toBe(0);
    });

    it('should handle deeply nested structures', () => {
      const oldObj = {
        level1: {
          level2: {
            level3: {
              value: 'old',
              array: [1, 2, 3]
            }
          }
        }
      };
      const newObj = {
        level1: {
          level2: {
            level3: {
              value: 'new',
              array: [1, 4, 3]
            }
          }
        }
      };
      
      const result = service.compare(oldObj, newObj);
      
      expect(result.left?.type).toBe('modified');
      expect(result.left?.hasNestedChanges).toBe(true);
      expect(result.summary.modified).toBeGreaterThan(0);
    });

    it('should calculate correct summary counts', () => {
      const oldObj = {
        removed: 'gone',
        modified: 'old',
        unchanged: 'same',
        nested: {
          removed: 'gone',
          addedLater: 'will stay'
        }
      };
      const newObj = {
        added: 'new',
        modified: 'new',
        unchanged: 'same',
        nested: {
          added: 'new',
          addedLater: 'will stay'
        }
      };
      
      const result = service.compare(oldObj, newObj);
      
      expect(result.summary.added).toBe(2);
      expect(result.summary.removed).toBe(2);
      expect(result.summary.modified).toBe(1);
      expect(result.summary.unchanged).toBe(2);
    });
  });

  describe('node expansion', () => {
    it('should set node expanded state', () => {
      const node: DiffNode = {
        key: 'test',
        path: 'test',
        type: 'unchanged',
        value: 'test',
        isExpanded: true,
        depth: 0,
        hasNestedChanges: false,
        children: [
          {
            key: 'child',
            path: 'test.child',
            type: 'unchanged',
            value: 'child',
            isExpanded: true,
            depth: 1,
            hasNestedChanges: false
          }
        ]
      };

      service.setNodeExpanded(node, false, false);
      expect(node.isExpanded).toBe(false);
      expect(node.children?.[0].isExpanded).toBe(true);

      service.setNodeExpanded(node, true, true);
      expect(node.isExpanded).toBe(true);
      expect(node.children?.[0].isExpanded).toBe(true);
    });

    it('should expand to specific depth', () => {
      const node: DiffNode = {
        key: 'root',
        path: '',
        type: 'modified',
        value: {},
        isExpanded: false,
        depth: 0,
        hasNestedChanges: true,
        children: [
          {
            key: 'level1',
            path: 'level1',
            type: 'modified',
            value: {},
            isExpanded: false,
            depth: 1,
            hasNestedChanges: true,
            children: [
              {
                key: 'level2',
                path: 'level1.level2',
                type: 'modified',
                value: {},
                isExpanded: false,
                depth: 2,
                hasNestedChanges: true,
                children: [
                  {
                    key: 'level3',
                    path: 'level1.level2.level3',
                    type: 'unchanged',
                    value: 'test',
                    isExpanded: false,
                    depth: 3,
                    hasNestedChanges: false
                  }
                ]
              }
            ]
          }
        ]
      };

      service.expandToDepth(node, 2);
      
      expect(node.isExpanded).toBe(true);
      expect(node.children?.[0].isExpanded).toBe(true);
      expect(node.children?.[0].children?.[0].isExpanded).toBe(true);
      expect(node.children?.[0].children?.[0].children?.[0].isExpanded).toBe(false);
    });
  });

  describe('performance metrics', () => {
    it('should track comparison time', () => {
      const largeObj = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `item ${i}`,
        data: { nested: { value: i * 2 } }
      }));
      
      const result = service.compare(largeObj, largeObj);
      
      expect(result.performance.compareTime).toBeGreaterThanOrEqual(0);
      expect(result.performance.nodeCount).toBeGreaterThan(0);
      expect(result.performance.maxDepth).toBeGreaterThan(0);
    });

    it('should calculate total summary', () => {
      const result = service.compare({ a: 1 }, { b: 2 });
      
      expect(result.summary.total).toBe(
        result.summary.added + 
        result.summary.removed + 
        result.summary.modified + 
        result.summary.unchanged
      );
    });
  });

  describe('auto expansion strategy', () => {
    it('should auto expand changed nodes within depth limit', () => {
      const oldObj = {
        unchanged: 'same',
        changed: {
          deep: {
            value: 'old'
          }
        }
      };
      const newObj = {
        unchanged: 'same',
        changed: {
          deep: {
            value: 'new'
          }
        }
      };
      
      const result = service.compare(oldObj, newObj, 2);
      
      const rootNode = result.left;
      expect(rootNode?.isExpanded).toBe(true);
      
      const changedNode = rootNode?.children?.find(c => c.key === 'changed');
      expect(changedNode?.isExpanded).toBe(true);
      
      const deepNode = changedNode?.children?.find(c => c.key === 'deep');
      expect(deepNode?.isExpanded).toBeDefined();
    });

    it('should not auto expand beyond depth limit', () => {
      const oldObj = { level1: { level2: { level3: { value: 'old' } } } };
      const newObj = { level1: { level2: { level3: { value: 'new' } } } };
      
      const result = service.compare(oldObj, newObj, 1);
      
      const level1 = result.left?.children?.[0];
      const level2 = level1?.children?.[0];
      const level3 = level2?.children?.[0];
      
      expect(result.left?.isExpanded).toBe(true);
      expect(level1?.isExpanded).toBe(true);
      if (level2?.depth && level2.depth > 1) {
        expect(level2?.isExpanded).toBe(false);
      }
    });
  });

  describe('sorting behavior', () => {
    it('should sort children by change type (removed > modified > added > unchanged)', () => {
      const oldObj = {
        unchanged: 'same',
        added: 'will be added',
        removed: 'will be removed',
        modified: 'old'
      };
      const newObj = {
        unchanged: 'same',
        modified: 'new',
        newItem: 'added'
      };
      
      const result = service.compare(oldObj, newObj);
      const children = result.left?.children || [];
      
      const types = children.map(c => c.type);
      
      const removedIndex = types.indexOf('removed');
      const modifiedIndex = types.indexOf('modified');
      const addedIndex = types.findIndex(t => t === 'added');
      const unchangedIndex = types.indexOf('unchanged');
      
      expect(removedIndex).toBeLessThan(modifiedIndex);
      expect(modifiedIndex).toBeLessThan(addedIndex);
      expect(addedIndex).toBeLessThan(unchangedIndex);
    });
  });

  describe('hasNestedChanges flag', () => {
    it('should set hasNestedChanges to true when any child has changes', () => {
      const oldObj = { parent: { child: 'old', same: 'value' } };
      const newObj = { parent: { child: 'new', same: 'value' } };
      
      const result = service.compare(oldObj, newObj);
      const parentNode = result.left?.children?.[0];
      
      expect(parentNode?.hasNestedChanges).toBe(true);
      expect(result.left?.hasNestedChanges).toBe(true);
    });

    it('should set hasNestedChanges to false for unchanged nodes without changes', () => {
      const oldObj = { parent: { child: 'same' } };
      const newObj = { parent: { child: 'same' } };
      
      const result = service.compare(oldObj, newObj);
      const parentNode = result.left?.children?.[0];
      
      expect(parentNode?.hasNestedChanges).toBe(false);
      expect(result.left?.hasNestedChanges).toBe(false);
    });
  });
});
