import React from 'react'
import AssignmentDisplayTemplate from './components/AssignmentDisplayTemplate';
import AssignmentWriteTemplate from './components/AssignmentWriteTemplate';
import BooleanPropertyTemplate from './components/boolean-property-template';
import DefaultValueDisplay from './components/DefaultValueDisplay';
import MultiinstancePropertyWriteTemplate from './components/MultiinstancePropertyWriteTemplate';
import ProcessHistorylevelPropertyWriteTemplate from './components/ProcessHistorylevelPropertyWriteTemplate';
import StringPropertyWriteMode from './components/StringPropertyWriteMode'
import TextPropertyWriteTemplate from './components/TextPropertyWriteTemplate'

const map = {

  'editor-app/configuration/properties/assignment-display-template.html': AssignmentDisplayTemplate,
  'editor-app/configuration/properties/assignment-popup.html': null,
  'editor-app/configuration/properties/assignment-write-template.html': AssignmentWriteTemplate,
  'editor-app/configuration/properties/boolean-property-template.html': BooleanPropertyTemplate,
  'editor-app/configuration/properties/calledelementtype-property-write-template.html': null,
  'editor-app/configuration/properties/case-reference-display-template.html': null,
  'editor-app/configuration/properties/case-reference-popup.html': null,
  'editor-app/configuration/properties/case-reference-write-template.html': null,
  'editor-app/configuration/properties/condition-expression-display-template.html': null,
  'editor-app/configuration/properties/condition-expression-popup.html': null,
  'editor-app/configuration/properties/condition-expression-write-template.html': null,
  'editor-app/configuration/properties/data-properties-display-template.html': null,
  'editor-app/configuration/properties/data-properties-popup.html': null,
  'editor-app/configuration/properties/data-properties-write-template.html': null,
  'editor-app/configuration/properties/decisionservice-reference-display-template.html': null,
  'editor-app/configuration/properties/decisionservice-reference-popup.html': null,
  'editor-app/configuration/properties/decisionservice-reference-write-template.html': null,
  'editor-app/configuration/properties/decisiontable-reference-display-template.html': null,
  'editor-app/configuration/properties/decisiontable-reference-popup.html': null,
  'editor-app/configuration/properties/decisiontable-reference-write-template.html': null,
  'editor-app/configuration/properties/default-value-display-template.html': DefaultValueDisplay,
  'editor-app/configuration/properties/duedate-display-template.html': null,
  'editor-app/configuration/properties/duedate-popup.html': null,
  'editor-app/configuration/properties/duedate-write-template.html': null,
  'editor-app/configuration/properties/errorgrid-critical.html': null,
  'editor-app/configuration/properties/escalation-definitions-display-template.html': null,
  'editor-app/configuration/properties/escalation-definitions-popup.html': null,
  'editor-app/configuration/properties/escalation-definitions-write-template.html': null,
  'editor-app/configuration/properties/escalation-property-write-template.html': null,
  'editor-app/configuration/properties/event-channel-type-property-write-template.html': null,
  'editor-app/configuration/properties/event-correlation-parameters-display-template.html': null,
  'editor-app/configuration/properties/event-correlation-parameters-popup.html': null,
  'editor-app/configuration/properties/event-correlation-parameters-write-template.html': null,
  'editor-app/configuration/properties/event-in-parameters-display-template.html': null,
  'editor-app/configuration/properties/event-in-parameters-popup.html': null,
  'editor-app/configuration/properties/event-in-parameters-write-template.html': null,
  'editor-app/configuration/properties/event-listeners-display-template.html': null,
  'editor-app/configuration/properties/event-listeners-popup.html': null,
  'editor-app/configuration/properties/event-listeners-write-template.html': null,
  'editor-app/configuration/properties/event-out-parameters-display-template.html': null,
  'editor-app/configuration/properties/event-out-parameters-popup.html': null,
  'editor-app/configuration/properties/event-out-parameters-write-template.html': null,
  'editor-app/configuration/properties/exceptions-display-template.html': null,
  'editor-app/configuration/properties/exceptions-popup.html': null,
  'editor-app/configuration/properties/exceptions-write-template.html': null,
  'editor-app/configuration/properties/execution-listeners-display-template.html': null,
  'editor-app/configuration/properties/execution-listeners-popup.html': null,
  'editor-app/configuration/properties/execution-listeners-write-template.html': null,
  'editor-app/configuration/properties/feedback-popup.html': null,
  'editor-app/configuration/properties/fields-display-template.html': null,
  'editor-app/configuration/properties/fields-popup.html': null,
  'editor-app/configuration/properties/fields-write-template.html': null,
  'editor-app/configuration/properties/form-properties-display-template.html': null,
  'editor-app/configuration/properties/form-properties-popup.html': null,
  'editor-app/configuration/properties/form-properties-write-template.html': null,
  'editor-app/configuration/properties/form-reference-display-template.html': null,
  'editor-app/configuration/properties/form-reference-popup.html': null,
  'editor-app/configuration/properties/form-reference-write-template.html': null,
  'editor-app/configuration/properties/http-request-method-display-template.html': null,
  'editor-app/configuration/properties/http-request-method-property-write-template.html': null,
  'editor-app/configuration/properties/in-parameters-display-template.html': null,
  'editor-app/configuration/properties/in-parameters-popup.html': null,
  'editor-app/configuration/properties/in-parameters-write-template.html': null,
  'editor-app/configuration/properties/message-definitions-display-template.html': null,
  'editor-app/configuration/properties/message-definitions-popup.html': null,
  'editor-app/configuration/properties/message-definitions-write-template.html': null,
  'editor-app/configuration/properties/message-property-write-template.html': null,
  'editor-app/configuration/properties/multiinstance-property-write-template.html': MultiinstancePropertyWriteTemplate,
  'editor-app/configuration/properties/ordering-property-write-template.html': null,
  'editor-app/configuration/properties/out-parameters-display-template.html': null,
  'editor-app/configuration/properties/out-parameters-popup.html': null,
  'editor-app/configuration/properties/out-parameters-write-template.html': null,
  'editor-app/configuration/properties/plan-item-lifecycle-listeners-display-template.html': null,
  'editor-app/configuration/properties/plan-item-lifecycle-listeners-popup.html': null,
  'editor-app/configuration/properties/plan-item-lifecycle-listeners-write-template.html': null,
  'editor-app/configuration/properties/planitem-dropdown-read-template.html': null,
  'editor-app/configuration/properties/planitem-dropdown-write-template.html': null,
  'editor-app/configuration/properties/process-historylevel-property-write-template.html': ProcessHistorylevelPropertyWriteTemplate,
  'editor-app/configuration/properties/process-reference-display-template.html': null,
  'editor-app/configuration/properties/process-reference-popup.html': null,
  'editor-app/configuration/properties/process-reference-write-template.html': null,
  'editor-app/configuration/properties/sequenceflow-order-display-template.html': null,
  'editor-app/configuration/properties/sequenceflow-order-popup.html': null,
  'editor-app/configuration/properties/sequenceflow-order-write-template.html': null,
  'editor-app/configuration/properties/signal-definitions-display-template.html': null,
  'editor-app/configuration/properties/signal-definitions-popup.html': null,
  'editor-app/configuration/properties/signal-definitions-write-template.html': null,
  'editor-app/configuration/properties/signal-property-write-template.html': null,
  'editor-app/configuration/properties/string-property-write-mode-template.html': StringPropertyWriteMode,
  'editor-app/configuration/properties/task-listeners-display-template.html': null,
  'editor-app/configuration/properties/task-listeners-popup.html': null,
  'editor-app/configuration/properties/task-listeners-write-template.html': null,
  'editor-app/configuration/properties/text-popup.html': null,
  'editor-app/configuration/properties/text-property-write-template.html': TextPropertyWriteTemplate,
  'editor-app/configuration/properties/transition-event-write-template.html': null,
  'editor-app/configuration/properties/trigger-mode-read-template.html': null,
  'editor-app/configuration/properties/trigger-mode-write-template.html': null,
}

export default function PropertyValue({ onSave, property }) {

  let src;
  if (property.hasReadWriteMode) {
    if (property.mode === 'write') {
      src = property.writeModeTemplateUrl
    } else if (property.mode === 'read') {
      src = property.readModeTemplateUrl
    }
  } else {
    src = property.templateUrl;
  }
  if (!src) return null;

  const Comp = map[src.split('?')[0]];
  if (Comp) {
    return <Comp property={property} onSave={onSave} />
  }
  return null;
}

