import { JsonDiffService, DiffNode, DiffResult } from './json-diff.service';

describe('JsonDiffService', () => {
  let service: JsonDiffService;

  beforeEach(() => {
    service = new JsonDiffService();
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
    });

    it('should detect removed property', () => {
      const oldObj = { name: 'test', oldProp: 'removed' };
      const newObj = { name: 'test' };
      const result = service.compare(oldObj, newObj);
      
      expect(result.summary.removed).toBe(1);
    });

    it('should detect modified property', () => {
      const oldObj = { name: 'old' };
      const newObj = { name: 'new' };
      const result = service.compare(oldObj, newObj);
      
      expect(result.summary.modified).toBe(1);
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
    });
  });

  describe('compare - complex scenarios', () => {
    it('should handle undefined values', () => {
      const result1 = service.compare(undefined, { test: 'data' });
      expect(result1.left).toBeNull();
      
      const result2 = service.compare({ test: 'data' }, undefined);
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
    });
  });

  describe('performance metrics', () => {
    it('should track comparison time', () => {
      const largeObj1 = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `item ${i}`,
        data: { nested: { value: i * 2 } }
      }));
      const largeObj2 = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        name: `item ${i}`,
        data: { nested: { value: i * 2 } }
      }));
      
      const result = service.compare(largeObj1, largeObj2);
      
      expect(result.performance.compareTime).toBeGreaterThanOrEqual(0);
      expect(result.performance.nodeCount).toBeGreaterThan(0);
      expect(result.performance.maxDepth).toBeGreaterThanOrEqual(0);
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
    });
  });

  describe('sorting behavior', () => {
    it('should sort children by change type (removed > modified > added > unchanged) in unified view', () => {
      const oldObj = {
        unchanged: 'same',
        removed: 'will be removed',
        modified: 'old'
      };
      const newObj = {
        unchanged: 'same',
        modified: 'new',
        added: 'new property'
      };
      
      const result = service.compare(oldObj, newObj);
      
      const leftChildren = result.left?.children || [];
      const rightChildren = result.right?.children || [];
      
      const leftTypes = leftChildren.map(c => c.type);
      const rightTypes = rightChildren.map(c => c.type);
      
      const leftRemovedIndex = leftTypes.indexOf('removed');
      const leftModifiedIndex = leftTypes.indexOf('modified');
      const leftUnchangedIndex = leftTypes.indexOf('unchanged');
      
      const rightModifiedIndex = rightTypes.indexOf('modified');
      const rightAddedIndex = rightTypes.indexOf('added');
      const rightUnchangedIndex = rightTypes.indexOf('unchanged');
      
      expect(leftRemovedIndex).toBeLessThan(leftModifiedIndex);
      expect(leftModifiedIndex).toBeLessThan(leftUnchangedIndex);
      
      expect(rightModifiedIndex).toBeLessThan(rightAddedIndex);
      expect(rightAddedIndex).toBeLessThan(rightUnchangedIndex);
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

  describe('split view support', () => {
    it('should mark added nodes as placeholder in left view', () => {
      const oldObj = { kept: 'value' };
      const newObj = { kept: 'value', added: 'new' };
      
      const result = service.compare(oldObj, newObj);
      
      const leftChildren = result.left?.children || [];
      const addedNode = leftChildren.find(c => c.type === 'added');
      const keptNode = leftChildren.find(c => c.type === 'unchanged');
      
      expect(addedNode).toBeDefined();
      expect(addedNode?.isPlaceholder).toBe(true);
      expect(keptNode?.isPlaceholder).toBe(false);
    });

    it('should mark removed nodes as placeholder in right view', () => {
      const oldObj = { kept: 'value', removed: 'gone' };
      const newObj = { kept: 'value' };
      
      const result = service.compare(oldObj, newObj);
      
      const rightChildren = result.right?.children || [];
      const removedNode = rightChildren.find(c => c.type === 'removed');
      const keptNode = rightChildren.find(c => c.type === 'unchanged');
      
      expect(removedNode).toBeDefined();
      expect(removedNode?.isPlaceholder).toBe(true);
      expect(keptNode?.isPlaceholder).toBe(false);
    });

    it('should keep both views independent with proper placeholder marking', () => {
      const oldObj = { removed: 'gone', kept: 'value' };
      const newObj = { kept: 'value', added: 'new' };
      
      const result = service.compare(oldObj, newObj);
      
      const leftChildren = result.left?.children || [];
      const rightChildren = result.right?.children || [];
      
      const leftRemoved = leftChildren.find(c => c.type === 'removed');
      const leftAdded = leftChildren.find(c => c.type === 'added');
      
      const rightRemoved = rightChildren.find(c => c.type === 'removed');
      const rightAdded = rightChildren.find(c => c.type === 'added');
      
      expect(leftRemoved?.isPlaceholder).toBe(false);
      expect(leftAdded?.isPlaceholder).toBe(true);
      
      expect(rightRemoved?.isPlaceholder).toBe(true);
      expect(rightAdded?.isPlaceholder).toBe(false);
    });
  });
});
