import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SampleDataService } from '../../services/sample-data.service';

@Component({
  selector: 'app-json-input',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './json-input.component.html',
  styleUrls: ['./json-input.component.css']
})
export class JsonInputComponent {
  @Input() label: string = 'JSON';
  @Input() value: string = '';
  @Input() side: 'left' | 'right' = 'right';
  @Output() valueChange = new EventEmitter<string>();
  @Output() loadSample = new EventEmitter<{ left: string; right: string }>();

  validationError: string | null = null;
  samples: { name: string; left: string; right: string }[];

  constructor(private sampleDataService: SampleDataService) {
    this.samples = sampleDataService.getSamples();
  }

  onTextChange(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    this.value = textarea.value;
    this.validateJson(this.value);
    this.valueChange.emit(this.value);
  }

  validateJson(text: string): boolean {
    if (!text || text.trim() === '') {
      this.validationError = null;
      return true;
    }
    try {
      JSON.parse(text.trim());
      this.validationError = null;
      return true;
    } catch (e) {
      this.validationError = `JSON 格式错误: ${(e as Error).message}`;
      return false;
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = (e.target as FileReader).result as string;
      this.value = content;
      this.validateJson(this.value);
      this.valueChange.emit(this.value);
    };
    reader.readAsText(file);
    input.value = '';
  }

  formatJson(): void {
    if (!this.value || !this.validateJson(this.value)) return;
    
    try {
      const parsed = JSON.parse(this.value.trim());
      this.value = JSON.stringify(parsed, null, 2);
      this.valueChange.emit(this.value);
    } catch (e) {
      // 验证已经通过，这里不应该会出错
    }
  }

  minifyJson(): void {
    if (!this.value || !this.validateJson(this.value)) return;
    
    try {
      const parsed = JSON.parse(this.value.trim());
      this.value = JSON.stringify(parsed);
      this.valueChange.emit(this.value);
    } catch (e) {
      // 验证已经通过，这里不应该会出错
    }
  }

  clearAll(): void {
    this.value = '';
    this.validationError = null;
    this.valueChange.emit(this.value);
  }

  copyToClipboard(): void {
    if (!this.value) return;
    navigator.clipboard.writeText(this.value).catch(() => {
      // 失败时静默处理
    });
  }

  loadSampleData(index: number): void {
    const sample = this.sampleDataService.getSample(index);
    if (sample) {
      this.loadSample.emit({ left: sample.left, right: sample.right });
    }
  }

  get isValid(): boolean {
    return this.validationError === null;
  }

  get isEmpty(): boolean {
    return !this.value || this.value.trim() === '';
  }
}
