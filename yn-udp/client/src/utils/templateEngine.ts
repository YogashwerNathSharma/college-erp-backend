/**
 * YN-UDP Template Engine
 * Handles placeholder replacement, conditional logic, and loop evaluation
 * Used during bulk PDF generation to fill templates with actual data
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Condition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'is_empty' | 'is_not_empty';
  value: string;
  logic: 'AND' | 'OR'; // how this condition connects to next
}

export interface ConditionalRule {
  conditions: Condition[];
  action: 'show' | 'hide';
}

export interface CanvasObjectWithConditions {
  id?: string;
  type: string;
  text?: string;
  src?: string;
  objects?: CanvasObjectWithConditions[];
  conditionalRule?: ConditionalRule;
  [key: string]: any;
}

export interface TemplateData {
  [key: string]: any;
}

// ─── Placeholder Replacement ──────────────────────────────────────────────────

/**
 * Replace simple {{field}} placeholders in a string with actual data
 */
export function replacePlaceholders(text: string, data: TemplateData): string {
  if (!text || typeof text !== 'string') return text;

  // Replace simple {{field}} placeholders
  let result = text.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (match, fieldPath) => {
    const value = getNestedValue(data, fieldPath);
    if (value === undefined || value === null) return '';
    return String(value);
  });

  // Process conditional blocks: {{#if field === "value"}}content{{else}}altContent{{/if}}
  result = processConditionals(result, data);

  // Process loops: {{#each items}}...{{/each}}
  result = processLoops(result, data);

  return result;
}

/**
 * Get nested value from object using dot notation
 * e.g., getNestedValue({student: {name: "John"}}, "student.name") → "John"
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    if (current === undefined || current === null) return undefined;
    return current[key];
  }, obj);
}

// ─── Conditional Logic Processing ─────────────────────────────────────────────

/**
 * Process {{#if ...}}...{{else}}...{{/if}} blocks in text
 */
export function processConditionals(text: string, data: TemplateData): string {
  // Pattern: {{#if field operator "value"}}trueContent{{else}}falseContent{{/if}}
  // Also supports: {{#if field === "value"}}content{{/if}} (no else)
  const ifElseRegex = /\{\{#if\s+(.+?)\}\}([\s\S]*?)\{\{else\}\}([\s\S]*?)\{\{\/if\}\}/g;
  const ifOnlyRegex = /\{\{#if\s+(.+?)\}\}([\s\S]*?)\{\{\/if\}\}/g;

  // Process if-else blocks first
  let result = text.replace(ifElseRegex, (match, condition, trueContent, falseContent) => {
    const conditionResult = evaluateConditionExpression(condition.trim(), data);
    return conditionResult ? trueContent : falseContent;
  });

  // Then process if-only blocks
  result = result.replace(ifOnlyRegex, (match, condition, content) => {
    const conditionResult = evaluateConditionExpression(condition.trim(), data);
    return conditionResult ? content : '';
  });

  return result;
}

/**
 * Evaluate a condition expression like: gender === "Female" or age > 18
 */
export function evaluateConditionExpression(expression: string, data: TemplateData): boolean {
  // Pattern: field operator "value" or field operator value
  const patterns = [
    /^(\w+(?:\.\w+)*)\s*(===|!==|==|!=|>=|<=|>|<)\s*"([^"]*)"$/,
    /^(\w+(?:\.\w+)*)\s*(===|!==|==|!=|>=|<=|>|<)\s*'([^']*)'$/,
    /^(\w+(?:\.\w+)*)\s*(===|!==|==|!=|>=|<=|>|<)\s*(\S+)$/,
  ];

  for (const pattern of patterns) {
    const match = expression.match(pattern);
    if (match) {
      const [, field, operator, value] = match;
      const fieldValue = getNestedValue(data, field);
      return compareValues(fieldValue, operator, value);
    }
  }

  // Simple truthy check: {{#if fieldName}}
  const simpleField = expression.trim();
  const value = getNestedValue(data, simpleField);
  return !!value && value !== '' && value !== '0' && value !== 'false';
}

/**
 * Compare two values with an operator
 */
function compareValues(fieldValue: any, operator: string, compareValue: string): boolean {
  const strFieldValue = String(fieldValue ?? '');
  const numFieldValue = Number(fieldValue);
  const numCompareValue = Number(compareValue);

  switch (operator) {
    case '===':
    case '==':
      return strFieldValue === compareValue;
    case '!==':
    case '!=':
      return strFieldValue !== compareValue;
    case '>':
      return numFieldValue > numCompareValue;
    case '<':
      return numFieldValue < numCompareValue;
    case '>=':
      return numFieldValue >= numCompareValue;
    case '<=':
      return numFieldValue <= numCompareValue;
    default:
      return false;
  }
}

// ─── Loop Processing ──────────────────────────────────────────────────────────

/**
 * Process {{#each items}}...{{/each}} loops in text
 */
export function processLoops(text: string, data: TemplateData): string {
  const eachRegex = /\{\{#each\s+(\w+(?:\.\w+)*)\}\}([\s\S]*?)\{\{\/each\}\}/g;

  return text.replace(eachRegex, (match, arrayField, template) => {
    const items = getNestedValue(data, arrayField);
    if (!Array.isArray(items)) return '';

    return items.map((item, index) => {
      // Replace {{field}} within loop with item properties
      let itemResult = template.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (m: string, field: string) => {
        // Special variables
        if (field === '@index') return String(index);
        if (field === '@number') return String(index + 1);
        if (field === '@first') return index === 0 ? 'true' : '';
        if (field === '@last') return index === items.length - 1 ? 'true' : '';

        // Try item property first, then parent data
        const itemValue = getNestedValue(item, field);
        if (itemValue !== undefined) return String(itemValue);
        const parentValue = getNestedValue(data, field);
        if (parentValue !== undefined) return String(parentValue);
        return '';
      });

      return itemResult;
    }).join('');
  });
}

// ─── Canvas Object Conditional Evaluation ─────────────────────────────────────

/**
 * Evaluate whether a canvas object should be visible based on its conditional rules
 */
export function evaluateObjectConditions(
  conditionalRule: ConditionalRule | undefined,
  data: TemplateData
): boolean {
  if (!conditionalRule || !conditionalRule.conditions || conditionalRule.conditions.length === 0) {
    return true; // No conditions = always visible
  }

  const { conditions, action } = conditionalRule;
  const conditionsMet = evaluateConditionSet(conditions, data);

  // If action is 'show': visible when conditions are met
  // If action is 'hide': visible when conditions are NOT met
  return action === 'show' ? conditionsMet : !conditionsMet;
}

/**
 * Evaluate a set of conditions with AND/OR logic
 */
export function evaluateConditionSet(conditions: Condition[], data: TemplateData): boolean {
  if (conditions.length === 0) return true;

  let result = evaluateSingleCondition(conditions[0], data);

  for (let i = 1; i < conditions.length; i++) {
    const prevLogic = conditions[i - 1].logic;
    const current = evaluateSingleCondition(conditions[i], data);

    if (prevLogic === 'AND') {
      result = result && current;
    } else {
      result = result || current;
    }
  }

  return result;
}

/**
 * Evaluate a single condition against data
 */
export function evaluateSingleCondition(condition: Condition, data: TemplateData): boolean {
  const fieldValue = getNestedValue(data, condition.field);
  const strValue = String(fieldValue ?? '');

  switch (condition.operator) {
    case 'equals':
      return strValue === condition.value;
    case 'not_equals':
      return strValue !== condition.value;
    case 'contains':
      return strValue.toLowerCase().includes(condition.value.toLowerCase());
    case 'not_contains':
      return !strValue.toLowerCase().includes(condition.value.toLowerCase());
    case 'greater_than':
      return Number(fieldValue) > Number(condition.value);
    case 'less_than':
      return Number(fieldValue) < Number(condition.value);
    case 'is_empty':
      return !fieldValue || strValue === '';
    case 'is_not_empty':
      return !!fieldValue && strValue !== '';
    default:
      return true;
  }
}

// ─── Full Template Processing ─────────────────────────────────────────────────

/**
 * Process an entire canvas JSON template with data
 * - Replaces placeholders in text objects
 * - Evaluates conditional visibility
 * - Processes loops for repeated elements
 * Returns a new canvas JSON with all replacements applied
 */
export function processTemplate(
  canvasJSON: any,
  data: TemplateData
): any {
  if (!canvasJSON || !canvasJSON.objects) return canvasJSON;

  const processedObjects = canvasJSON.objects
    .map((obj: CanvasObjectWithConditions) => processCanvasObject(obj, data))
    .filter((obj: any) => obj !== null); // Remove objects hidden by conditions

  return {
    ...canvasJSON,
    objects: processedObjects,
  };
}

/**
 * Process a single canvas object - replace placeholders, evaluate conditions
 */
function processCanvasObject(
  obj: CanvasObjectWithConditions,
  data: TemplateData
): CanvasObjectWithConditions | null {
  // Check conditional visibility
  if (!evaluateObjectConditions(obj.conditionalRule, data)) {
    return null; // Object should be hidden
  }

  const processed = { ...obj };

  // Replace placeholders in text
  if (processed.type === 'textbox' || processed.type === 'i-text' || processed.type === 'text') {
    if (processed.text) {
      processed.text = replacePlaceholders(processed.text, data);
    }
  }

  // Handle image placeholders (src with {{field}})
  if (processed.type === 'image' && processed.src) {
    processed.src = replacePlaceholders(processed.src, data);
  }

  // Process group objects recursively
  if (processed.type === 'group' && processed.objects) {
    processed.objects = processed.objects
      .map((child) => processCanvasObject(child, data))
      .filter((child): child is CanvasObjectWithConditions => child !== null);
  }

  return processed;
}

// ─── Available Fields Extraction ──────────────────────────────────────────────

/**
 * Extract all {{placeholder}} fields used in a canvas template
 * Useful for showing available fields in the UI
 */
export function extractPlaceholders(canvasJSON: any): string[] {
  const placeholders = new Set<string>();

  function extractFromObject(obj: any) {
    if (obj.text) {
      const matches = obj.text.matchAll(/\{\{(\w+(?:\.\w+)*)\}\}/g);
      for (const match of matches) {
        placeholders.add(match[1]);
      }
    }
    if (obj.src) {
      const matches = obj.src.matchAll(/\{\{(\w+(?:\.\w+)*)\}\}/g);
      for (const match of matches) {
        placeholders.add(match[1]);
      }
    }
    if (obj.objects) {
      obj.objects.forEach(extractFromObject);
    }
  }

  if (canvasJSON?.objects) {
    canvasJSON.objects.forEach(extractFromObject);
  }

  return Array.from(placeholders).sort();
}

/**
 * Validate data against template placeholders
 * Returns list of missing fields
 */
export function validateData(canvasJSON: any, data: TemplateData): string[] {
  const required = extractPlaceholders(canvasJSON);
  return required.filter(field => {
    const value = getNestedValue(data, field);
    return value === undefined || value === null || value === '';
  });
}

export default {
  replacePlaceholders,
  processConditionals,
  processLoops,
  evaluateObjectConditions,
  evaluateConditionSet,
  evaluateSingleCondition,
  processTemplate,
  extractPlaceholders,
  validateData,
};
