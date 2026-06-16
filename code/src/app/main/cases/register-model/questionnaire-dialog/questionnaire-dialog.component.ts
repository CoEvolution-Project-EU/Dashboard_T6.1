import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule
} from '@angular/forms';

import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef
} from '@angular/material/dialog';

/** One questionnaire question. */
interface QuestionnaireQuestion {
  key: string;
  /** Section title shown immediately *before* this question (acts as header). */
  section?: string;
  label: string;
  /**
   * - 'radio'           single choice from `options`
   * - 'text'            free text answer
   * - 'multi-checkbox'  several checkboxes from `items` plus an optional
   *                     mutually-exclusive "None of these apply" toggle
   */
  type: 'radio' | 'text' | 'multi-checkbox';
  options?: string[];
  items?: string[];
  noneOption?: string;
  /** Optional helper text shown when the answer matches `triggerValue`. */
  guidance?: {
    /** 'Yes' for radio; 'any' to trigger when any multi-checkbox item is on. */
    triggerValue: string;
    text: string;
  };
}

export interface QuestionnaireDialogData {
  answers?: Record<string, unknown>;
}

@Component({
  selector: 'app-questionnaire-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatRadioModule,
    MatCheckboxModule,
    MatTooltipModule,
    MatDialogModule
  ],
  templateUrl: './questionnaire-dialog.component.html',
  styleUrl: './questionnaire-dialog.component.scss'
})
export class QuestionnaireDialogComponent {

  private fb = inject(FormBuilder);
  private dialogRef = inject(MatDialogRef<QuestionnaireDialogComponent>);
  private data = inject<QuestionnaireDialogData>(MAT_DIALOG_DATA, { optional: true });

  /**
   * Real GDPR + AI ACT questionnaire. Each question may belong to a section
   * (shown as a header before it), and can optionally surface guidance text
   * once the user selects a triggering answer.
   */
  readonly questions: QuestionnaireQuestion[] = [
    // ── GDPR ────────────────────────────────────────────────────────────────
    {
      key: 'processes_personal_data',
      section: 'GDPR',
      label:
        'Do you process any Personal Data? ' +
        '(e.g., names, business emails, physical addresses, customer IDs, IP addresses, or phone numbers)',
      type: 'radio',
      options: ['Yes', 'No'],
      guidance: {
        triggerValue: 'Yes',
        text:
          'Processing of personal data must be lawful. You must identify and document your ' +
          'specific legal basis under Article 6(1) of the GDPR.'
      }
    },
    {
      key: 'special_categories',
      label:
        'Do you process Special Categories of Personal Data? Please check any that apply ' +
        '(or pick the "None" option below).',
      type: 'multi-checkbox',
      items: [
        'Health related Data',
        'Biometric Data (when processed solely to identify a human being) or Genetic Data',
        'Racial or ethnic origin Data',
        'Data concerning a person\'s sex life or sexual orientation',
        'Data revealing political opinions, religious or philosophical beliefs',
        'Trade-union membership data'
      ],
      noneOption: 'None of these apply',
      guidance: {
        triggerValue: 'any',
        text:
          'Mandatory Legal Dual-Requirement. If you checked any of the sensitive data boxes above, ' +
          'you must have a primary lawful basis under Article 6(1) AND you must also qualify under ' +
          'one of the specific, valid legal exceptions allowing the processing of sensitive data ' +
          'as described in Article 9(2) of the GDPR.'
      }
    },

    // ── AI ACT ──────────────────────────────────────────────────────────────
    {
      key: 'aiact_safety_component',
      section: 'AI ACT',
      label:
        'Is this AI system intended to be used as a safety component of a product, or is the ' +
        'AI system itself a product, covered by the Union harmonization legislation listed in ' +
        'Annex I of the EU AI Act?',
      type: 'radio',
      options: ['Yes', 'No'],
      guidance: {
        triggerValue: 'Yes',
        text:
          'Potential high-risk trigger: Under Article 6(1) your system may be classified as a ' +
          'High-Risk AI System. In this case, the strict requirements of Chapter III of the ' +
          'EU AI Act apply.'
      }
    },
    {
      key: 'aiact_high_risk_areas',
      label:
        'Does the intended scope or use case of this AI system fall under any of the following High-Risk Areas?',
      type: 'multi-checkbox',
      items: [
        'Biometrics (uses permitted under relevant law)',
        'Critical infrastructure: AI systems intended to be used as safety components in the management and operation of critical digital infrastructure, road traffic, or in the supply of water, gas, heating or electricity.',
        'Education and vocational training',
        'Employment, workers\' management and access to self-employment',
        'Access to and enjoyment of essential private services and essential public services and benefits',
        'Law enforcement (uses permitted under relevant law)',
        'Migration, asylum and border control management (uses permitted under relevant Union or national law)',
        'Administration of justice and democratic processes'
      ],
      noneOption: 'None of these areas apply',
      guidance: {
        triggerValue: 'any',
        text:
          'Potential high-risk trigger: If yes, the system may be classified as a High-Risk AI System ' +
          'and subject to Chapter III requirements of the AI ACT, if its specific intended purpose ' +
          'also matches one of the detailed use cases explicitly listed under that section in Annex III ' +
          'of the AI ACT.'
      }
    }
  ];

  form: FormGroup;

  constructor() {
    const group: Record<string, unknown> = {};
    for (const q of this.questions) {
      const existing = this.data?.answers?.[q.key];

      if (q.type === 'radio' || q.type === 'text') {
        group[q.key] = [(existing as string) ?? ''];
      } else if (q.type === 'multi-checkbox') {
        const sub: Record<string, unknown[]> = {};
        const items = q.items ?? [];
        for (let i = 0; i < items.length; i++) {
          const wasChecked = this.wasItemChecked(existing, items[i]);
          sub[`item_${i}`] = [wasChecked];
        }
        sub['__none'] = [this.wasNoneChecked(existing)];
        group[q.key] = this.fb.group(sub);
      }
    }
    this.form = this.fb.group(group);

    // Wire up mutual-exclusion behaviour for multi-checkboxes:
    // - turning ON any item turns OFF the "none" toggle.
    // - turning ON "none" turns OFF all the items.
    for (const q of this.questions) {
      if (q.type !== 'multi-checkbox') continue;
      const sub = this.form.get(q.key) as FormGroup;
      if (!sub) continue;
      const none = sub.get('__none');
      const itemControls = (q.items ?? []).map((_, i) => sub.get(`item_${i}`));

      none?.valueChanges.subscribe(value => {
        if (value === true) {
          itemControls.forEach(c => c?.setValue(false, { emitEvent: false }));
        }
      });
      itemControls.forEach(c => c?.valueChanges.subscribe(value => {
        if (value === true && none?.value === true) {
          none.setValue(false, { emitEvent: false });
        }
      }));
    }
  }

  private wasItemChecked(existing: unknown, item: string): boolean {
    if (!existing || typeof existing !== 'object') return false;
    const obj = existing as { selected?: string[] };
    return Array.isArray(obj.selected) && obj.selected.includes(item);
  }

  private wasNoneChecked(existing: unknown): boolean {
    if (!existing || typeof existing !== 'object') return false;
    const obj = existing as { none?: boolean };
    return !!obj.none;
  }

  /** Show the optional guidance text for a question? */
  shouldShowGuidance(q: QuestionnaireQuestion): boolean {
    if (!q.guidance) return false;
    const control = this.form.get(q.key);
    if (!control) return false;
    const value: any = control.value;

    if (q.type === 'radio') {
      return value === q.guidance.triggerValue;
    }
    if (q.type === 'multi-checkbox' && q.guidance.triggerValue === 'any') {
      const items = q.items ?? [];
      for (let i = 0; i < items.length; i++) {
        if (value?.[`item_${i}`]) return true;
      }
    }
    return false;
  }

  save(): void {
    const raw = this.form.value as Record<string, any>;
    const answers: Record<string, unknown> = {};

    for (const q of this.questions) {
      const v = raw[q.key];

      if (q.type === 'radio' || q.type === 'text') {
        if (v !== null && v !== undefined && String(v).trim() !== '') {
          answers[q.key] = v;
        }
      } else if (q.type === 'multi-checkbox') {
        const obj = v || {};
        if (obj['__none']) {
          answers[q.key] = { selected: [], none: true };
        } else {
          const selected: string[] = [];
          (q.items ?? []).forEach((item, i) => {
            if (obj[`item_${i}`]) selected.push(item);
          });
          if (selected.length > 0) {
            answers[q.key] = { selected, none: false };
          }
        }
      }
    }

    this.dialogRef.close(answers);
  }

  cancel(): void {
    this.dialogRef.close(null);
  }
}
