import { Component, OnInit } from '@angular/core';
import { JsonDiffService, DiffResult, DiffNode } from './services/json-diff.service';
import { SampleDataService } from './services/sample-data.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: false,
  styleUrl: './app.css'
})
export class App implements OnInit {
  title = 'JSON Diff 可视化工具';
  
  leftJson: string = '';
  rightJson: string = '';
  diffResult: DiffResult | null = null;
  showDiff: boolean = false;
  viewMode: 'split' | 'unified' = 'split';
  
  constructor(
    private jsonDiffService: JsonDiffService,
    private sampleDataService: SampleDataService
  ) {}

  ngOnInit(): void {
    const sample = this.sampleDataService.getSample(0);
    if (sample) {
      this.leftJson = sample.left;
      this.rightJson = sample.right;
    }
  }

  onLeftJsonChange(value: string): void {
    this.leftJson = value;
  }

  onRightJsonChange(value: string): void {
    this.rightJson = value;
  }

  onLoadSample(data: { left: string; right: string }): void {
    this.leftJson = data.left;
    this.rightJson = data.right;
    this.showDiff = false;
    this.diffResult = null;
  }

  compareJson(): void {
    try {
      const leftObj = this.jsonDiffService.parseJson(this.leftJson);
      const rightObj = this.jsonDiffService.parseJson(this.rightJson);
      
      this.diffResult = this.jsonDiffService.compare(leftObj, rightObj);
      this.showDiff = true;
    } catch (e) {
      alert(`比较失败: ${(e as Error).message}`);
    }
  }

  swapJson(): void {
    const temp = this.leftJson;
    this.leftJson = this.rightJson;
    this.rightJson = temp;
    this.showDiff = false;
    this.diffResult = null;
  }

  clearAll(): void {
    this.leftJson = '';
    this.rightJson = '';
    this.showDiff = false;
    this.diffResult = null;
  }

  hasResult(): boolean {
    return this.diffResult !== null;
  }

  getSummary(): { added: number; removed: number; modified: number; unchanged: number } {
    return this.diffResult?.summary || { added: 0, removed: 0, modified: 0, unchanged: 0 };
  }

  toggleExpand(node: DiffNode, expand: boolean): void {
    this.setExpandRecursive(node, expand);
  }

  private setExpandRecursive(node: DiffNode, expand: boolean): void {
    node.isExpanded = expand;
    if (node.children) {
      for (const child of node.children) {
        this.setExpandRecursive(child, expand);
      }
    }
  }

  expandAll(): void {
    if (this.diffResult?.left) {
      this.toggleExpand(this.diffResult.left, true);
    }
    if (this.diffResult?.right && this.diffResult.right !== this.diffResult.left) {
      this.toggleExpand(this.diffResult.right, true);
    }
  }

  collapseAll(): void {
    if (this.diffResult?.left) {
      this.toggleExpand(this.diffResult.left, false);
    }
    if (this.diffResult?.right && this.diffResult.right !== this.diffResult.left) {
      this.toggleExpand(this.diffResult.right, false);
    }
  }

  setViewMode(mode: 'split' | 'unified'): void {
    this.viewMode = mode;
  }

  onToggleAllChildren(expand: boolean, node: DiffNode): void {
    this.toggleExpand(node, expand);
  }
}
