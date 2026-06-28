/**
 * YN-UDP Conditional Logic Component
 * Panel for adding show/hide conditions to canvas elements
 * Integrates with Properties sidebar in CanvasEditor
 */

import React, { useState, useCallback } from 'react';
import {
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ChevronDown,
  AlertCircle,
  Zap,
  HelpCircle,
  X,
  Copy,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Condition {
  id: string;
  field: string;
  operator: ConditionOperator;
  value: string;
  logic: 'AND' | 'OR';
}

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'greater_than'
  | 'less_than'
  | 'is_empty'
  | 'is_not_empty';

export interface ConditionalRule {
  conditions: Condition[];
  action: 'show' | 'hide';
}

interface ConditionalLogicProps {
  rule: ConditionalRule | null;
  onChange: (rule: ConditionalRule | null) => void;
  availableFields: string[];
  objectType: string;
  objectLabel?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const OPERATORS: { value: ConditionOperator; label: string; needsValue: boolean }[] = [
  { value: 'equals', label: 'Equals', needsValue: true },
  { value: 'not_equals', label: 'Not Equals', needsValue: true },
  { value: 'contains', label: 'Contains', needsValue: true },
  { value: 'not_contains', label: 'Does Not Contain', needsValue: true },
  { value: 'greater_than', label: 'Greater Than', needsValue: true },
  { value: 'less_than', label: 'Less Than', needsValue: true },
  { value: 'is_empty', label: 'Is Empty', needsValue: false },
  { value: 'is_not_empty', label: 'Is Not Empty', needsValue: false },
];

const COMMON_FIELDS = [
  'gender',
  'class_name',
  'section_name',
  'category',
  'religion',
  'blood_group',
  'result',
  'conduct',
  'nationality',
  'admission_no',
  'father_name',
  'mother_name',
  'student_photo',
  'designation',
  'department',
];

// ─── Component ────────────────────────────────────────────────────────────────

const ConditionalLogic: React.FC<ConditionalLogicProps> = ({
  rule,
  onChange,
  availableFields,
  objectType,
  objectLabel,
}) => {
  const [showHelp, setShowHelp] = useState(false);

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Initialize rule if none exists
  const initializeRule = () => {
    onChange({
      conditions: [
        {
          id: generateId(),
          field: availableFields[0] || 'gender',
          operator: 'equals',
          value: '',
          logic: 'AND',
        },
      ],
      action: 'show',
    });
  };

  // Add a new condition
  const addCondition = () => {
    if (!rule) return;
    const newCondition: Condition = {
      id: generateId(),
      field: availableFields[0] || 'gender',
      operator: 'equals',
      value: '',
      logic: 'AND',
    };
    onChange({
      ...rule,
      conditions: [...rule.conditions, newCondition],
    });
  };

  // Update a condition
  const updateCondition = (id: string, updates: Partial<Condition>) => {
    if (!rule) return;
    onChange({
      ...rule,
      conditions: rule.conditions.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      ),
    });
  };

  // Remove a condition
  const removeCondition = (id: string) => {
    if (!rule) return;
    const remaining = rule.conditions.filter((c) => c.id !== id);
    if (remaining.length === 0) {
      onChange(null); // Remove all conditions = remove rule
    } else {
      onChange({ ...rule, conditions: remaining });
    }
  };

  // Toggle action
  const toggleAction = () => {
    if (!rule) return;
    onChange({
      ...rule,
      action: rule.action === 'show' ? 'hide' : 'show',
    });
  };

  // Remove all conditions
  const clearAll = () => {
    onChange(null);
  };

  // All fields (merged from template + common)
  const allFields = [...new Set([...availableFields, ...COMMON_FIELDS])].sort();

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-gray-700">Conditional Logic</span>
        </div>
        <button
          onClick={() => setShowHelp(!showHelp)}
          className="p-1 hover:bg-gray-100 rounded transition"
          title="Help"
        >
          <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
        </button>
      </div>

      {/* Help Box */}
      {showHelp && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-800 space-y-1">
          <p className="font-medium">How it works:</p>
          <ul className="list-disc pl-4 space-y-0.5">
            <li>Add conditions to show/hide this element based on data</li>
            <li>Example: Show "Daughter of" text only if gender = Female</li>
            <li>Conditions are evaluated during bulk PDF generation</li>
            <li>Use AND/OR to combine multiple conditions</li>
          </ul>
          <p className="font-medium mt-2">Text syntax (alternative):</p>
          <code className="block bg-blue-100 p-1 rounded mt-1">
            {'{{#if gender === "Female"}}Daughter{{else}}Son{{/if}} of {{father_name}}'}
          </code>
        </div>
      )}

      {/* No Rule - Add Button */}
      {!rule && (
        <button
          onClick={initializeRule}
          className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition"
        >
          <Plus className="w-4 h-4" />
          Add Condition
        </button>
      )}

      {/* Active Rule */}
      {rule && (
        <div className="space-y-3">
          {/* Action Toggle */}
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <span className="text-xs text-gray-500">When conditions are met:</span>
            <button
              onClick={toggleAction}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition ${
                rule.action === 'show'
                  ? 'bg-green-100 text-green-700 hover:bg-green-200'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              {rule.action === 'show' ? (
                <>
                  <Eye className="w-3 h-3" /> Show
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3" /> Hide
                </>
              )}
            </button>
            <span className="text-xs text-gray-500">this {objectType}</span>
          </div>

          {/* Conditions List */}
          <div className="space-y-2">
            {rule.conditions.map((condition, index) => (
              <div key={condition.id} className="space-y-1">
                {/* Logic connector (AND/OR) between conditions */}
                {index > 0 && (
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() =>
                        updateCondition(rule.conditions[index - 1].id, {
                          logic: rule.conditions[index - 1].logic === 'AND' ? 'OR' : 'AND',
                        })
                      }
                      className={`px-3 py-0.5 rounded-full text-xs font-bold transition ${
                        rule.conditions[index - 1].logic === 'AND'
                          ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
                          : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                      }`}
                    >
                      {rule.conditions[index - 1].logic}
                    </button>
                  </div>
                )}

                {/* Condition Row */}
                <div className="flex items-center gap-1.5 p-2 bg-white border border-gray-200 rounded-lg group">
                  {/* Field */}
                  <select
                    value={condition.field}
                    onChange={(e) => updateCondition(condition.id, { field: e.target.value })}
                    className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-gray-50 focus:ring-1 focus:ring-indigo-500"
                  >
                    <optgroup label="Template Fields">
                      {availableFields.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Common Fields">
                      {COMMON_FIELDS.filter((f) => !availableFields.includes(f)).map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </optgroup>
                  </select>

                  {/* Operator */}
                  <select
                    value={condition.operator}
                    onChange={(e) =>
                      updateCondition(condition.id, { operator: e.target.value as ConditionOperator })
                    }
                    className="w-28 px-2 py-1.5 text-xs border border-gray-200 rounded-md bg-gray-50 focus:ring-1 focus:ring-indigo-500"
                  >
                    {OPERATORS.map((op) => (
                      <option key={op.value} value={op.value}>
                        {op.label}
                      </option>
                    ))}
                  </select>

                  {/* Value */}
                  {OPERATORS.find((op) => op.value === condition.operator)?.needsValue && (
                    <input
                      type="text"
                      value={condition.value}
                      onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                      placeholder="Value..."
                      className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-gray-200 rounded-md focus:ring-1 focus:ring-indigo-500"
                    />
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => removeCondition(condition.id)}
                    className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                    title="Remove condition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add More / Clear */}
          <div className="flex items-center justify-between">
            <button
              onClick={addCondition}
              className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Condition
            </button>
            <button
              onClick={clearAll}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500"
            >
              <X className="w-3 h-3" />
              Clear All
            </button>
          </div>

          {/* Preview */}
          <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800">
              <strong>Rule:</strong>{' '}
              {rule.action === 'show' ? 'Show' : 'Hide'} "{objectLabel || objectType}" when{' '}
              {rule.conditions.map((c, i) => (
                <span key={c.id}>
                  {i > 0 && (
                    <span className="font-bold"> {rule.conditions[i - 1].logic} </span>
                  )}
                  <code className="bg-amber-100 px-1 rounded">
                    {c.field} {c.operator.replace('_', ' ')} {c.value ? `"${c.value}"` : ''}
                  </code>
                </span>
              ))}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Inline Conditional Text Editor ───────────────────────────────────────────

interface ConditionalTextEditorProps {
  text: string;
  onChange: (text: string) => void;
}

/**
 * Helper component for editing text with inline conditional syntax
 * Shows a visual editor for {{#if}}...{{else}}...{{/if}} blocks
 */
export const ConditionalTextEditor: React.FC<ConditionalTextEditorProps> = ({
  text,
  onChange,
}) => {
  const [showInsert, setShowInsert] = useState(false);
  const [insertField, setInsertField] = useState('gender');
  const [insertOperator, setInsertOperator] = useState('===');
  const [insertValue, setInsertValue] = useState('');
  const [insertTrueText, setInsertTrueText] = useState('');
  const [insertFalseText, setInsertFalseText] = useState('');

  const insertConditional = () => {
    const conditional = insertFalseText
      ? `{{#if ${insertField} ${insertOperator} "${insertValue}"}}${insertTrueText}{{else}}${insertFalseText}{{/if}}`
      : `{{#if ${insertField} ${insertOperator} "${insertValue}"}}${insertTrueText}{{/if}}`;

    onChange(text + conditional);
    setShowInsert(false);
    setInsertValue('');
    setInsertTrueText('');
    setInsertFalseText('');
  };

  const insertLoop = () => {
    const loop = `{{#each marks}}{{subject}} - {{obtained}}/{{max}}\n{{/each}}`;
    onChange(text + loop);
  };

  // Highlight conditional blocks in the text display
  const highlightedText = text
    .replace(/\{\{#if .+?\}\}/g, '<span class="bg-green-200 px-0.5 rounded">$&</span>')
    .replace(/\{\{else\}\}/g, '<span class="bg-yellow-200 px-0.5 rounded">$&</span>')
    .replace(/\{\{\/if\}\}/g, '<span class="bg-green-200 px-0.5 rounded">$&</span>')
    .replace(/\{\{#each .+?\}\}/g, '<span class="bg-blue-200 px-0.5 rounded">$&</span>')
    .replace(/\{\{\/each\}\}/g, '<span class="bg-blue-200 px-0.5 rounded">$&</span>');

  return (
    <div className="space-y-2">
      {/* Text Area */}
      <textarea
        value={text}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full px-3 py-2 text-sm font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
        placeholder="Type text with {{placeholders}} and {{#if}} conditions..."
      />

      {/* Quick Insert Buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setShowInsert(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-green-100 text-green-700 rounded-md hover:bg-green-200 transition"
        >
          <Zap className="w-3 h-3" /> Insert IF
        </button>
        <button
          onClick={insertLoop}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition"
        >
          <Copy className="w-3 h-3" /> Insert LOOP
        </button>
      </div>

      {/* Insert Conditional Dialog */}
      {showInsert && (
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700">Insert Conditional</span>
            <button onClick={() => setShowInsert(false)} className="p-0.5 hover:bg-gray-200 rounded">
              <X className="w-3 h-3 text-gray-400" />
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <input
              value={insertField}
              onChange={(e) => setInsertField(e.target.value)}
              placeholder="field"
              className="px-2 py-1 text-xs border rounded"
            />
            <select
              value={insertOperator}
              onChange={(e) => setInsertOperator(e.target.value)}
              className="px-2 py-1 text-xs border rounded"
            >
              <option value="===">equals</option>
              <option value="!==">not equals</option>
              <option value=">">greater than</option>
              <option value="<">less than</option>
            </select>
            <input
              value={insertValue}
              onChange={(e) => setInsertValue(e.target.value)}
              placeholder="value"
              className="px-2 py-1 text-xs border rounded"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input
              value={insertTrueText}
              onChange={(e) => setInsertTrueText(e.target.value)}
              placeholder="Text if TRUE"
              className="px-2 py-1 text-xs border rounded"
            />
            <input
              value={insertFalseText}
              onChange={(e) => setInsertFalseText(e.target.value)}
              placeholder="Text if FALSE (optional)"
              className="px-2 py-1 text-xs border rounded"
            />
          </div>
          <button
            onClick={insertConditional}
            disabled={!insertField || !insertValue || !insertTrueText}
            className="w-full py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700 disabled:opacity-50"
          >
            Insert
          </button>
          <p className="text-xs text-gray-500">
            Preview:{' '}
            <code className="bg-gray-100 px-1 rounded">
              {`{{#if ${insertField} ${insertOperator} "${insertValue}"}}${insertTrueText}${
                insertFalseText ? `{{else}}${insertFalseText}` : ''
              }{{/if}}`}
            </code>
          </p>
        </div>
      )}
    </div>
  );
};

// ─── Utility: Apply Conditions to Canvas ──────────────────────────────────────

/**
 * Apply conditional rules to all canvas objects for a given data record
 * Returns the canvas JSON with hidden objects removed
 */
export function applyConditionalLogic(canvasJSON: any, data: Record<string, any>): any {
  if (!canvasJSON?.objects) return canvasJSON;

  const processedObjects = canvasJSON.objects.filter((obj: any) => {
    if (!obj.conditionalRule) return true;

    const { conditions, action } = obj.conditionalRule as ConditionalRule;
    if (!conditions || conditions.length === 0) return true;

    const conditionsMet = evaluateConditions(conditions, data);
    return action === 'show' ? conditionsMet : !conditionsMet;
  });

  return { ...canvasJSON, objects: processedObjects };
}

/**
 * Evaluate a set of conditions
 */
function evaluateConditions(conditions: Condition[], data: Record<string, any>): boolean {
  let result = checkCondition(conditions[0], data);

  for (let i = 1; i < conditions.length; i++) {
    const prevLogic = conditions[i - 1].logic;
    const current = checkCondition(conditions[i], data);
    result = prevLogic === 'AND' ? result && current : result || current;
  }

  return result;
}

function checkCondition(condition: Condition, data: Record<string, any>): boolean {
  const fieldValue = String(data[condition.field] ?? '');
  const compareValue = condition.value;

  switch (condition.operator) {
    case 'equals':
      return fieldValue === compareValue;
    case 'not_equals':
      return fieldValue !== compareValue;
    case 'contains':
      return fieldValue.toLowerCase().includes(compareValue.toLowerCase());
    case 'not_contains':
      return !fieldValue.toLowerCase().includes(compareValue.toLowerCase());
    case 'greater_than':
      return Number(fieldValue) > Number(compareValue);
    case 'less_than':
      return Number(fieldValue) < Number(compareValue);
    case 'is_empty':
      return !fieldValue || fieldValue === '';
    case 'is_not_empty':
      return !!fieldValue && fieldValue !== '';
    default:
      return true;
  }
}

export default ConditionalLogic;
