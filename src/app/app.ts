import { Component, OnInit, ChangeDetectorRef, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JsonTreeComponent } from './components/json-tree/json-tree.component';
import { JsonInputComponent } from './components/json-input/json-input.component';
import { JsonDiffService, DiffResult, DiffNode } from './services/json-diff.service';
import { SampleDataService } from './services/sample-data.service';

interface RawDiffData {
  leftJson: string;
  rightJson: string;
  maxAutoExpandDepth: number;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    JsonTreeComponent,
    JsonInputComponent
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  title = 'JSON Diff 可视化工具';
  
  readonly leftJson = signal('');
  readonly rightJson = signal('');
  readonly rawDiffData = signal<RawDiffData | null>(null);
  readonly showOnlyChanges = signal(false);
  readonly diffResult = signal<DiffResult | null>(null);
  readonly showDiff = signal(false);
  readonly viewMode = signal<'split' | 'unified'>('split');
  readonly treeVersion = signal(0);

  readonly summary = computed(() => {
    const result = this.diffResult();
    return result?.summary || { added: 0, removed: 0, modified: 0, unchanged: 0, total: 0 };
  });

  readonly performance = computed(() => {
    const result = this.diffResult();
    return result?.performance || { compareTime: 0, nodeCount: 0, maxDepth: 0 };
  });

  constructor(
    private jsonDiffService: JsonDiffService,
    private sampleDataService: SampleDataService,
    private cdr: ChangeDetectorRef
  ) {
    effect(() => {
      const rawData = this.rawDiffData();
      const onlyChanges = this.showOnlyChanges();
      if (rawData && this.showDiff()) {
        this.doCompare(rawData);
      }
    });
  }

  ngOnInit(): void {
    const sample = this.sampleDataService.getSample(0);
    if (sample) {
      this.leftJson.set(sample.left);
      this.rightJson.set(sample.right);
    }
  }

  onLeftJsonChange(value: string): void {
    this.leftJson.set(value);
  }

  onRightJsonChange(value: string): void {
    this.rightJson.set(value);
  }

  onLoadSample(data: { left: string; right: string }): void {
    this.leftJson.set(data.left);
    this.rightJson.set(data.right);
    this.showDiff.set(false);
    this.diffResult.set(null);
    this.rawDiffData.set(null);
  }

  compareJson(): void {
    try {
      const leftText = this.leftJson();
      const rightText = this.rightJson();
      
      this.rawDiffData.set({
        leftJson: leftText,
        rightJson: rightText,
        maxAutoExpandDepth: 2
      });
      
      this.doCompare(this.rawDiffData()!);
      this.showDiff.set(true);
    } catch (e) {
      alert(`比较失败: ${(e as Error).message}`);
    }
  }

  private doCompare(rawData: RawDiffData): void {
    const leftObj = this.jsonDiffService.parseJson(rawData.leftJson);
    const rightObj = this.jsonDiffService.parseJson(rawData.rightJson);
    
    const result = this.jsonDiffService.compare(
      leftObj, 
      rightObj, 
      rawData.maxAutoExpandDepth,
      this.showOnlyChanges()
    );
    this.diffResult.set(result);
  }

  toggleShowOnlyChanges(): void {
    this.showOnlyChanges.update(v => !v);
  }

  swapJson(): void {
    const temp = this.leftJson();
    this.leftJson.set(this.rightJson());
    this.rightJson.set(temp);
    this.showDiff.set(false);
    this.diffResult.set(null);
    this.rawDiffData.set(null);
  }

  clearAll(): void {
    this.leftJson.set('');
    this.rightJson.set('');
    this.showDiff.set(false);
    this.diffResult.set(null);
    this.rawDiffData.set(null);
  }

  expandAll(): void {
    const result = this.diffResult();
    if (!result) return;

    if (result.left) {
      this.setExpandedFast(result.left, true);
    }
    if (result.right) {
      this.setExpandedFast(result.right, true);
    }
    
    this.treeVersion.update(v => v + 1);
  }

  collapseAll(): void {
    const result = this.diffResult();
    if (!result) return;

    if (result.left) {
      this.setExpandedFast(result.left, false);
    }
    if (result.right) {
      this.setExpandedFast(result.right, false);
    }
    
    this.treeVersion.update(v => v + 1);
  }

  private setExpandedFast(node: DiffNode, expanded: boolean): void {
    const stack: DiffNode[] = [node];
    
    while (stack.length > 0) {
      const current = stack.pop()!;
      current.isExpanded = expanded;
      
      if (current.children && current.children.length > 0) {
        for (let i = current.children.length - 1; i >= 0; i--) {
          stack.push(current.children[i]);
        }
      }
    }
  }

  setViewMode(mode: 'split' | 'unified'): void {
    this.viewMode.set(mode);
  }
}
