const FLOWABLE = {
  CONFIG: {
    contextModelerRestRoot: 'http://scjoyedu.eicp.net:7180/onestopapi/app',
  },
};

FLOWABLE.URL = {
  getModel(modelId) {
    return `${
      FLOWABLE.CONFIG.contextModelerRestRoot
    }/rest/models/${modelId}/editor/json?version=${Date.now()}`;
  },

  getStencilSet() {
    return `${
      FLOWABLE.CONFIG.contextModelerRestRoot
    }/rest/stencil-sets/editor?version=${Date.now()}`;
  },

  getCmmnStencilSet() {
    return `${
      FLOWABLE.CONFIG.contextModelerRestRoot
    }/rest/stencil-sets/cmmneditor?version=${Date.now()}`;
  },

  getDmnStencilSet() {
    return `${
      FLOWABLE.CONFIG.contextModelerRestRoot
    }/rest/stencil-sets/dmneditor?version=${Date.now()}`;
  },

  putModel(modelId) {
    return `${FLOWABLE.CONFIG.contextModelerRestRoot}/rest/models/${modelId}/editor/json`;
  },

  validateModel() {
    return `${FLOWABLE.CONFIG.contextModelerRestRoot}/rest/model/validate`;
  },
};

/** Inspired by https://github.com/krasimir/EventBus/blob/master/src/EventBus.js */
FLOWABLE.eventBus = {
  /** Event fired when the editor is loaded and ready */
  EVENT_TYPE_EDITOR_READY: 'event-type-editor-ready',

  EVENT_TYPE_EDITOR_BOOTED: 'event-type-editor-booted',

  /** Event fired when a selection is made on the canvas. */
  EVENT_TYPE_SELECTION_CHANGE: 'event-type-selection-change',

  /** Event fired when a toolbar button has been clicked. */
  EVENT_TYPE_TOOLBAR_BUTTON_CLICKED: 'event-type-toolbar-button-clicked',

  /** Event fired when a stencil item is dropped on the canvas. */
  EVENT_TYPE_ITEM_DROPPED: 'event-type-item-dropped',

  /** Event fired when a property value is changed. */
  EVENT_TYPE_PROPERTY_VALUE_CHANGED: 'event-type-property-value-changed',

  /** Event fired on double click in canvas. */
  EVENT_TYPE_DOUBLE_CLICK: 'event-type-double-click',

  /** Event fired on a mouse out */
  EVENT_TYPE_MOUSE_OUT: 'event-type-mouse-out',

  /** Event fired on a mouse over */
  EVENT_TYPE_MOUSE_OVER: 'event-type-mouse-over',

  /** Event fired when a model is saved. */
  EVENT_TYPE_MODEL_SAVED: 'event-type-model-saved',

  /** Event fired when the quick menu buttons should be hidden. */
  EVENT_TYPE_HIDE_SHAPE_BUTTONS: 'event-type-hide-shape-buttons',

  /** Event fired when the validation popup should be shown. */
  EVENT_TYPE_SHOW_VALIDATION_POPUP: 'event-type-show-validation-popup',

  /** Event fired when a different process must be loaded. */
  EVENT_TYPE_NAVIGATE_TO_PROCESS: 'event-type-navigate-to-process',

  EVENT_TYPE_UNDO_REDO_RESET: 'event-type-undo-redo-reset',

  /** A mapping for storing the listeners */
  listeners: {},

  /** The Oryx editor, which is stored locally to send events to */
  editor: null,

  /**
   * Add an event listener to the event bus, listening to the event with the provided type.
   * Type and callback are mandatory parameters.
   *
   * Provide scope parameter if it is important that the callback is executed
   * within a specific scope.
   */
  addListener(type, callback, scope) {
    // Add to the listeners map
    if (typeof this.listeners[type] !== 'undefined') {
      this.listeners[type].push({ scope, callback });
    } else {
      this.listeners[type] = [{ scope, callback }];
    }
  },

  /**
   * Removes the provided event listener.
   */
  removeListener(type, callback, scope) {
    if (typeof this.listeners[type] !== 'undefined') {
      const numOfCallbacks = this.listeners[type].length;
      const newArray = [];
      for (let i = 0; i < numOfCallbacks; i++) {
        const listener = this.listeners[type][i];
        if (listener.scope === scope && listener.callback === callback) {
          // Do nothing, this is the listener and doesn't need to survive
        } else {
          newArray.push(listener);
        }
      }
      this.listeners[type] = newArray;
    }
  },

  hasListener(type, callback, scope) {
    if (typeof this.listeners[type] !== 'undefined') {
      const numOfCallbacks = this.listeners[type].length;
      if (callback === undefined && scope === undefined) {
        return numOfCallbacks > 0;
      }
      for (let i = 0; i < numOfCallbacks; i++) {
        const listener = this.listeners[type][i];
        if (listener.scope == scope && listener.callback == callback) {
          return true;
        }
      }
    }
    return false;
  },

  /**
   * Dispatch an event to all event listeners registered to that specific type.
   */
  dispatch(type, event) {
    if (typeof this.listeners[type] !== 'undefined') {
      const numOfCallbacks = this.listeners[type].length;
      for (let i = 0; i < numOfCallbacks; i++) {
        const listener = this.listeners[type][i];
        if (listener && listener.callback) {
          listener.callback.apply(listener.scope, [event]);
        }
      }
    }
  },

  dispatchOryxEvent(event, uiObject) {
    FLOWABLE.eventBus.editor.handleEvents(event, uiObject);
  },
};

FLOWABLE.TOOLBAR_CONFIG = {
  items: [
    {
      type: 'button',
      title: 'TOOLBAR.ACTION.SAVE',
      cssClass: 'editor-icon editor-icon-save',
      action: 'FLOWABLE.TOOLBAR.ACTIONS.saveModel',
    },
    {
      type: 'button',
      title: 'TOOLBAR.ACTION.VALIDATE',
      cssClass: 'glyphicon glyphicon-ok',
      action: 'FLOWABLE.TOOLBAR.ACTIONS.validate',
    },
    {
      type: 'separator',
      title: '',
      cssClass: 'toolbar-separator',
    },
    {
      type: 'button',
      title: 'TOOLBAR.ACTION.CUT',
      cssClass: 'editor-icon editor-icon-cut',
      action: 'FLOWABLE.TOOLBAR.ACTIONS.cut',
      enabled: false,
      enabledAction: 'element',
    },
    {
      type: 'button',
      title: 'TOOLBAR.ACTION.COPY',
      cssClass: 'editor-icon editor-icon-copy',
      action: 'FLOWABLE.TOOLBAR.ACTIONS.copy',
      enabled: false,
      enabledAction: 'element',
    },
    {
      type: 'button',
      title: 'TOOLBAR.ACTION.PASTE',
      cssClass: 'editor-icon editor-icon-paste',
      action: 'FLOWABLE.TOOLBAR.ACTIONS.paste',
      enabled: false,
    },
    {
      type: 'button',
      title: 'TOOLBAR.ACTION.DELETE',
      cssClass: 'editor-icon editor-icon-delete',
      action: 'FLOWABLE.TOOLBAR.ACTIONS.deleteItem',
      enabled: false,
      enabledAction: 'element',
    },
    {
      type: 'separator',
      title: 'TOOLBAR.ACTION.SAVE',
      cssClass: 'toolbar-separator',
    },
    {
      type: 'button',
      title: 'TOOLBAR.ACTION.REDO',
      cssClass: 'editor-icon editor-icon-redo',
      action: 'FLOWABLE.TOOLBAR.ACTIONS.redo',
      enabled: false,
    },
    {
      type: 'button',
      title: 'TOOLBAR.ACTION.UNDO',
      cssClass: 'editor-icon editor-icon-undo',
      action: 'FLOWABLE.TOOLBAR.ACTIONS.undo',
      enabled: false,
    },
    {
      type: 'separator',
      title: 'TOOLBAR.ACTION.SAVE',
      cssClass: 'toolbar-separator',
    },
    {
      type: 'button',
      title: 'TOOLBAR.ACTION.ALIGNVERTICAL',
      cssClass: 'editor-icon editor-icon-align-vertical',
      action: 'FLOWABLE.TOOLBAR.ACTIONS.alignVertical',
      enabled: false,
      enabledAction: 'element',
      disableInForm: true,
      minSelectionCount: 2,
    },
    {
      type: 'button',
      title: 'TOOLBAR.ACTION.ALIGNHORIZONTAL',
      cssClass: 'editor-icon editor-icon-align-horizontal',
      action: 'FLOWABLE.TOOLBAR.ACTIONS.alignHorizontal',
      enabledAction: 'element',
      enabled: false,
      disableInForm: true,
      minSelectionCount: 2,
    },
    {
      type: 'button',
      title: 'TOOLBAR.ACTION.SAMESIZE',
      cssClass: 'editor-icon editor-icon-same-size',
      action: 'FLOWABLE.TOOLBAR.ACTIONS.sameSize',
      enabledAction: 'element',
      enabled: false,
      disableInForm: true,
      minSelectionCount: 2,
    },
    {
      type: 'separator',
      title: 'TOOLBAR.ACTION.SAVE',
      cssClass: 'toolbar-separator',
      disableInForm: true,
    },
    {
      type: 'button',
      title: 'TOOLBAR.ACTION.ZOOMIN',
      cssClass: 'editor-icon editor-icon-zoom-in',
      action: 'FLOWABLE.TOOLBAR.ACTIONS.zoomIn',
    },
    {
      type: 'button',
      title: 'TOOLBAR.ACTION.ZOOMOUT',
      cssClass: 'editor-icon editor-icon-zoom-out',
      action: 'FLOWABLE.TOOLBAR.ACTIONS.zoomOut',
    },
    {
      type: 'button',
      title: 'TOOLBAR.ACTION.ZOOMACTUAL',
      cssClass: 'editor-icon editor-icon-zoom-actual',
      action: 'FLOWABLE.TOOLBAR.ACTIONS.zoomActual',
    },
    {
      type: 'button',
      title: 'TOOLBAR.ACTION.ZOOMFIT',
      cssClass: 'editor-icon editor-icon-zoom-fit',
      action: 'FLOWABLE.TOOLBAR.ACTIONS.zoomFit',
    },
    {
      type: 'separator',
      title: 'TOOLBAR.ACTION.SAVE',
      cssClass: 'toolbar-separator',
      disableInForm: true,
    },
    {
      type: 'button',
      title: 'TOOLBAR.ACTION.BENDPOINT.ADD',
      cssClass: 'editor-icon editor-icon-bendpoint-add',
      action: 'FLOWABLE.TOOLBAR.ACTIONS.addBendPoint',
      id: 'add-bendpoint-button',
      disableInForm: true,
    },
    {
      type: 'button',
      title: 'TOOLBAR.ACTION.BENDPOINT.REMOVE',
      cssClass: 'editor-icon editor-icon-bendpoint-remove',
      action: 'FLOWABLE.TOOLBAR.ACTIONS.removeBendPoint',
      id: 'remove-bendpoint-button',
      disableInForm: true,
    },
    {
      type: 'separator',
      title: '',
      cssClass: 'toolbar-separator',
      disableInForm: true,
    },
    {
      type: 'button',
      title: 'TOOLBAR.ACTION.HELP',
      cssClass: 'glyphicon glyphicon-question-sign',
      action: 'FLOWABLE.TOOLBAR.ACTIONS.help',
    },
  ],

  secondaryItems: [],
};

FLOWABLE.UI_CONFIG = {
  showRemovedProperties: false,
};

FLOWABLE.HEADER_CONFIG = {
  showAppTitle: true,
  showHeaderMenu: true,
  showMainNavigation: true,
  showPageHeader: true,
};
FLOWABLE.PROPERTY_CONFIG = {
  string: {
    templateUrl: 'editor-app/configuration/properties/default-value-display-template.html',
    readModeTemplateUrl: 'editor-app/configuration/properties/default-value-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/string-property-write-mode-template.html',
  },
  boolean: {
    templateUrl: 'editor-app/configuration/properties/boolean-property-template.html',
  },
  text: {
    readModeTemplateUrl: 'editor-app/configuration/properties/default-value-display-template.html',
    writeModeTemplateUrl: 'editor-app/configuration/properties/text-property-write-template.html',
  },
  'flowable-calledelementtype': {
    readModeTemplateUrl: 'editor-app/configuration/properties/default-value-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/calledelementtype-property-write-template.html',
  },
  'flowable-multiinstance': {
    readModeTemplateUrl: 'editor-app/configuration/properties/default-value-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/multiinstance-property-write-template.html',
  },
  'flowable-processhistorylevel': {
    readModeTemplateUrl: 'editor-app/configuration/properties/default-value-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/process-historylevel-property-write-template.html',
  },
  'flowable-ordering': {
    readModeTemplateUrl: 'editor-app/configuration/properties/default-value-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/ordering-property-write-template.html',
  },
  'oryx-dataproperties-complex': {
    readModeTemplateUrl:
      'editor-app/configuration/properties/data-properties-display-template.html',
    writeModeTemplateUrl: 'editor-app/configuration/properties/data-properties-write-template.html',
  },
  'oryx-formproperties-complex': {
    readModeTemplateUrl:
      'editor-app/configuration/properties/form-properties-display-template.html',
    writeModeTemplateUrl: 'editor-app/configuration/properties/form-properties-write-template.html',
  },
  'oryx-executionlisteners-multiplecomplex': {
    readModeTemplateUrl:
      'editor-app/configuration/properties/execution-listeners-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/execution-listeners-write-template.html',
  },
  'oryx-tasklisteners-multiplecomplex': {
    readModeTemplateUrl: 'editor-app/configuration/properties/task-listeners-display-template.html',
    writeModeTemplateUrl: 'editor-app/configuration/properties/task-listeners-write-template.html',
  },
  'oryx-eventlisteners-multiplecomplex': {
    readModeTemplateUrl:
      'editor-app/configuration/properties/event-listeners-display-template.html',
    writeModeTemplateUrl: 'editor-app/configuration/properties/event-listeners-write-template.html',
  },
  'oryx-usertaskassignment-complex': {
    readModeTemplateUrl: 'editor-app/configuration/properties/assignment-display-template.html',
    writeModeTemplateUrl: 'editor-app/configuration/properties/assignment-write-template.html',
  },
  'oryx-servicetaskfields-complex': {
    readModeTemplateUrl: 'editor-app/configuration/properties/fields-display-template.html',
    writeModeTemplateUrl: 'editor-app/configuration/properties/fields-write-template.html',
  },
  'oryx-servicetaskexceptions-complex': {
    readModeTemplateUrl: 'editor-app/configuration/properties/exceptions-display-template.html',
    writeModeTemplateUrl: 'editor-app/configuration/properties/exceptions-write-template.html',
  },
  'oryx-callactivityinparameters-complex': {
    readModeTemplateUrl: 'editor-app/configuration/properties/in-parameters-display-template.html',
    writeModeTemplateUrl: 'editor-app/configuration/properties/in-parameters-write-template.html',
  },
  'oryx-callactivityoutparameters-complex': {
    readModeTemplateUrl: 'editor-app/configuration/properties/out-parameters-display-template.html',
    writeModeTemplateUrl: 'editor-app/configuration/properties/out-parameters-write-template.html',
  },
  'oryx-subprocessreference-subprocess-link': {
    readModeTemplateUrl:
      'editor-app/configuration/properties/subprocess-reference-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/subprocess-reference-write-template.html',
  },
  'oryx-formreference-complex': {
    readModeTemplateUrl: 'editor-app/configuration/properties/form-reference-display-template.html',
    writeModeTemplateUrl: 'editor-app/configuration/properties/form-reference-write-template.html',
  },
  'oryx-sequencefloworder-complex': {
    readModeTemplateUrl:
      'editor-app/configuration/properties/sequenceflow-order-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/sequenceflow-order-write-template.html',
  },
  'oryx-conditionsequenceflow-complex': {
    readModeTemplateUrl:
      'editor-app/configuration/properties/condition-expression-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/condition-expression-write-template.html',
  },
  'oryx-signaldefinitions-multiplecomplex': {
    readModeTemplateUrl:
      'editor-app/configuration/properties/signal-definitions-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/signal-definitions-write-template.html',
  },
  'oryx-signalref-string': {
    readModeTemplateUrl: 'editor-app/configuration/properties/default-value-display-template.html',
    writeModeTemplateUrl: 'editor-app/configuration/properties/signal-property-write-template.html',
  },
  'oryx-messagedefinitions-multiplecomplex': {
    readModeTemplateUrl:
      'editor-app/configuration/properties/message-definitions-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/message-definitions-write-template.html',
  },
  'oryx-messageref-string': {
    readModeTemplateUrl: 'editor-app/configuration/properties/default-value-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/message-property-write-template.html',
  },
  'oryx-escalationdefinitions-multiplecomplex': {
    readModeTemplateUrl:
      'editor-app/configuration/properties/escalation-definitions-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/escalation-definitions-write-template.html',
  },
  'oryx-escalationref-string': {
    readModeTemplateUrl: 'editor-app/configuration/properties/default-value-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/escalation-property-write-template.html',
  },
  'oryx-duedatedefinition-complex': {
    readModeTemplateUrl: 'editor-app/configuration/properties/duedate-display-template.html',
    writeModeTemplateUrl: 'editor-app/configuration/properties/duedate-write-template.html',
  },
  'oryx-decisiontaskdecisiontablereference-complex': {
    readModeTemplateUrl:
      'editor-app/configuration/properties/decisiontable-reference-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/decisiontable-reference-write-template.html',
  },
  'oryx-decisiontaskdecisionservicereference-complex': {
    readModeTemplateUrl:
      'editor-app/configuration/properties/decisionservice-reference-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/decisionservice-reference-write-template.html',
  },
  'oryx-decisiondecisiontablereference-complex': {
    readModeTemplateUrl:
      'editor-app/configuration/properties/decisiontable-reference-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/decisiontable-reference-write-template.html',
  },
  'oryx-casetaskcasereference-complex': {
    readModeTemplateUrl: 'editor-app/configuration/properties/case-reference-display-template.html',
    writeModeTemplateUrl: 'editor-app/configuration/properties/case-reference-write-template.html',
  },
  'oryx-processtaskprocessreference-complex': {
    readModeTemplateUrl:
      'editor-app/configuration/properties/process-reference-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/process-reference-write-template.html',
  },
  'oryx-processtaskinparameters-complex': {
    readModeTemplateUrl: 'editor-app/configuration/properties/in-parameters-display-template.html',
    writeModeTemplateUrl: 'editor-app/configuration/properties/in-parameters-write-template.html',
  },
  'oryx-processtaskoutparameters-complex': {
    readModeTemplateUrl: 'editor-app/configuration/properties/out-parameters-display-template.html',
    writeModeTemplateUrl: 'editor-app/configuration/properties/out-parameters-write-template.html',
  },
  'oryx-casetaskinparameters-complex': {
    readModeTemplateUrl: 'editor-app/configuration/properties/in-parameters-display-template.html',
    writeModeTemplateUrl: 'editor-app/configuration/properties/in-parameters-write-template.html',
  },
  'oryx-casetaskoutparameters-complex': {
    readModeTemplateUrl: 'editor-app/configuration/properties/out-parameters-display-template.html',
    writeModeTemplateUrl: 'editor-app/configuration/properties/out-parameters-write-template.html',
  },
  'oryx-planitemlifecyclelisteners-multiplecomplex': {
    readModeTemplateUrl:
      'editor-app/configuration/properties/plan-item-lifecycle-listeners-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/plan-item-lifecycle-listeners-write-template.html',
  },
  'flowable-transitionevent': {
    readModeTemplateUrl: 'editor-app/configuration/properties/default-value-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/transition-event-write-template.html',
  },
  'flowable-planitem-dropdown': {
    readModeTemplateUrl: 'editor-app/configuration/properties/planitem-dropdown-read-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/planitem-dropdown-write-template.html',
  },
  'flowable-http-request-method': {
    readModeTemplateUrl:
      'editor-app/configuration/properties/http-request-method-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/http-request-method-property-write-template.html',
  },
  'flowable-triggermode': {
    readModeTemplateUrl: 'editor-app/configuration/properties/trigger-mode-read-template.html',
    writeModeTemplateUrl: 'editor-app/configuration/properties/trigger-mode-write-template.html',
  },
  'oryx-eventinparameters-complex': {
    readModeTemplateUrl:
      'editor-app/configuration/properties/event-in-parameters-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/event-in-parameters-write-template.html',
  },
  'oryx-eventoutparameters-complex': {
    readModeTemplateUrl:
      'editor-app/configuration/properties/event-out-parameters-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/event-out-parameters-write-template.html',
  },
  'oryx-eventcorrelationparameters-complex': {
    readModeTemplateUrl:
      'editor-app/configuration/properties/event-correlation-parameters-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/event-correlation-parameters-write-template.html',
  },
  'flowable-channeltype': {
    readModeTemplateUrl: 'editor-app/configuration/properties/default-value-display-template.html',
    writeModeTemplateUrl:
      'editor-app/configuration/properties/event-channel-type-property-write-template.html',
  },
};

//create command for undo/redo
FLOWABLE.CreateCommand = ORYX.Core.Command.extend({
  construct: function(option, currentReference, position, facade){
    this.option = option;
    this.currentReference = currentReference;
    this.position = position;
    this.facade = facade;
    this.shape;
    this.edge;
    this.targetRefPos;
    this.sourceRefPos;
    /*
     * clone options parameters
     */
        this.connectedShape = option.connectedShape;
        this.connectingType = option.connectingType;
        this.namespace = option.namespace;
        this.type = option.type;
        this.containedStencil = option.containedStencil;
        this.parent = option.parent;
        this.currentReference = currentReference;
        this.shapeOptions = option.shapeOptions;
  },
  execute: function(){

    if (this.shape) {
      if (this.shape instanceof ORYX.Core.Node) {
        this.parent.add(this.shape);
        if (this.edge) {
          this.facade.getCanvas().add(this.edge);
          this.edge.dockers.first().setDockedShape(this.connectedShape);
          this.edge.dockers.first().setReferencePoint(this.sourceRefPos);
          this.edge.dockers.last().setDockedShape(this.shape);
          this.edge.dockers.last().setReferencePoint(this.targetRefPos);
        }

        this.facade.setSelection([this.shape]);

      } else if (this.shape instanceof ORYX.Core.Edge) {
        this.facade.getCanvas().add(this.shape);
        this.shape.dockers.first().setDockedShape(this.connectedShape);
        this.shape.dockers.first().setReferencePoint(this.sourceRefPos);
      }
    }
    else {
      this.shape = this.facade.createShape(this.option);
      this.edge = (!(this.shape instanceof ORYX.Core.Edge)) ? this.shape.getIncomingShapes().first() : undefined;
    }

    if (this.currentReference && this.position) {

      if (this.shape instanceof ORYX.Core.Edge) {

        if (!(this.currentReference instanceof ORYX.Core.Canvas)) {
          this.shape.dockers.last().setDockedShape(this.currentReference);

          if (this.currentReference.getStencil().idWithoutNs() === 'TextAnnotation')
          {
            var midpoint = {};
            midpoint.x = 0;
            midpoint.y = this.currentReference.bounds.height() / 2;
            this.shape.dockers.last().setReferencePoint(midpoint);
          }
          else
          {
            this.shape.dockers.last().setReferencePoint(this.currentReference.bounds.midPoint());
          }
        }
        else {
          this.shape.dockers.last().bounds.centerMoveTo(this.position);
        }
        this.sourceRefPos = this.shape.dockers.first().referencePoint;
        this.targetRefPos = this.shape.dockers.last().referencePoint;

      } else if (this.edge){
        this.sourceRefPos = this.edge.dockers.first().referencePoint;
        this.targetRefPos = this.edge.dockers.last().referencePoint;
      }
    } else {
      var containedStencil = this.containedStencil;
      var connectedShape = this.connectedShape;
      var bc = connectedShape.bounds;
      var bs = this.shape.bounds;

      var pos = bc.center();
      if(containedStencil.defaultAlign()==="north") {
        pos.y -= (bc.height() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET + (bs.height()/2);
      } else if(containedStencil.defaultAlign()==="northeast") {
        pos.x += (bc.width() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER + (bs.width()/2);
        pos.y -= (bc.height() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER + (bs.height()/2);
      } else if(containedStencil.defaultAlign()==="southeast") {
        pos.x += (bc.width() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER + (bs.width()/2);
        pos.y += (bc.height() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER + (bs.height()/2);
      } else if(containedStencil.defaultAlign()==="south") {
        pos.y += (bc.height() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET + (bs.height()/2);
      } else if(containedStencil.defaultAlign()==="southwest") {
        pos.x -= (bc.width() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER + (bs.width()/2);
        pos.y += (bc.height() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER + (bs.height()/2);
      } else if(containedStencil.defaultAlign()==="west") {
        pos.x -= (bc.width() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET + (bs.width()/2);
      } else if(containedStencil.defaultAlign()==="northwest") {
        pos.x -= (bc.width() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER + (bs.width()/2);
        pos.y -= (bc.height() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET_CORNER + (bs.height()/2);
      } else {
        pos.x += (bc.width() / 2) + ORYX.CONFIG.SHAPEMENU_CREATE_OFFSET + (bs.width()/2);
      }

      // Move shape to the new position
      this.shape.bounds.centerMoveTo(pos);

      // Move all dockers of a node to the position
      if (this.shape instanceof ORYX.Core.Node){
        (this.shape.dockers||[]).each(function(docker){
          docker.bounds.centerMoveTo(pos);
        });
      }

      //this.shape.update();
      this.position = pos;

      if (this.edge){
        this.sourceRefPos = this.edge.dockers.first().referencePoint;
        this.targetRefPos = this.edge.dockers.last().referencePoint;
      }
    }

    this.facade.getCanvas().update();
    this.facade.updateSelection();

  },
  rollback: function(){
    this.facade.deleteShape(this.shape);
    if(this.edge) {
      this.facade.deleteShape(this.edge);
    }
    //this.currentParent.update();
    this.facade.setSelection(this.facade.getSelection().without(this.shape, this.edge));
  }
});

export default FLOWABLE;
