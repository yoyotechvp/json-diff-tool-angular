import { Component, OnInit, ChangeDetectorRef, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { JsonTreeComponent } from './components/json-tree/json-tree.component';
import { JsonInputComponent } from './components/json-input/json-input.component';
import { JsonDiffService, DiffResult, DiffNode } from './services/json-diff.service';
import { SampleDataService } from './services/sample-data.service';

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
  readonly diffResult = signal<DiffResult | null>(null);
  readonly showDiff = signal(false);
  readonly viewMode = signal<'split' | 'unified'>('split');

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
  ) {}

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
  }

  compareJson(): void {
    try {
      const leftObj = this.jsonDiffService.parseJson(this.leftJson());
      const rightObj = this.jsonDiffService.parseJson(this.rightJson());
      
      const result = this.jsonDiffService.compare(leftObj, rightObj, 2);
      this.diffResult.set(result);
      this.showDiff.set(true);
    } catch (e) {
      alert(`比较失败: ${(e as Error).message}`);
    }
  }

  swapJson(): void {
    const temp = this.leftJson();
    this.leftJson.set(this.rightJson());
    this.rightJson.set(temp);
    this.showDiff.set(false);
    this.diffResult.set(null);
  }

  clearAll(): void {
    this.leftJson.set('');
    this.rightJson.set('');
    this.showDiff.set(false);
    this.diffResult.set(null);
  }

  expandAll(): void {
    const result = this.diffResult();
    if (!result) return;

    if (result.left) {
      this.jsonDiffService.setNodeExpanded(result.left, true, true);
    }
    if (result.right) {
      this.jsonDiffService.setNodeExpanded(result.right, true, true);
    }
    
    this.diffResult.set({ ...result });
    this.cdr.markForCheck();
  }

  collapseAll(): void {
    const result = this.diffResult();
    if (!result) return;

    if (result.left) {
      this.jsonDiffService.setNodeExpanded(result.left, false, true);
    }
    if (result.right) {
      this.jsonDiffService.setNodeExpanded(result.right, false, true);
    }
    
    this.diffResult.set({ ...result });
    this.cdr.markForCheck();
  }

  setViewMode(mode: 'split' | 'unified'): void {
    this.viewMode.set(mode);
  }
}
