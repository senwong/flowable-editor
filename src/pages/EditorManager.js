
import FLOWABLE from './FLOWABLE';

class EditorManager {
  constructor() {

  }

  initialize() {
    this.treeFilteredElements = ['SubProcess', 'CollapsedSubProcess'];
    this.canvasTracker = new Hash();
    this.structualIcons = {
      SubProcess: 'expanded.subprocess.png',
      CollapsedSubProcess: 'subprocess.png',
      EventSubProcess: 'event.subprocess.png',
    };

    this.current = this.modelId;
    this.loading = true;
  }

  getModelId() {
    return this.modelId;
  }

  setModelId(modelId) {
    this.modelId = modelId;
  }

  getCurrentModelId() {
    return this.current;
  }

  setStencilData(stencilData) {
    // we don't want a references!
    this.stencilData = jQuery.extend(true, {}, stencilData);
  }

  getStencilData() {
    return this.stencilData;
  }

  getSelection() {
    return this.editor.selection;
  }

  getSubSelection() {
    return this.editor._subSelection;
  }

  handleEvents(events) {
    this.editor.handleEvents(events);
  }

  setSelection(selection) {
    this.editor.setSelection(selection);
  }

  registerOnEvent(event, callback) {
    this.editor.registerOnEvent(event, callback);
  }
  unregisterOnEvent(event, callback) {
    this.editor.unregisterOnEvent(event, callback);
  }

  getChildShapeByResourceId(resourceId) {
    return this.editor.getCanvas().getChildShapeByResourceId(resourceId);
  }

  getJSON() {
    return this.editor.getJSON();
  }

  getStencilSets() {
    return this.editor.getStencilSets();
  }

  getEditor() {
    return this.editor; // TODO: find  out if we can avoid exposing the editor object to angular.
  }

  executeCommands(commands) {
    this.editor.executeCommands(commands);
  }

  getCanvas() {
    return this.editor.getCanvas();
  }

  getRules() {
    return this.editor.getRules();
  }

  eventCoordinates(coordinates) {
    return this.editor.eventCoordinates(coordinates);
  }

  eventCoordinatesXY(x, y) {
    return this.editor.eventCoordinatesXY(x, y);
  }

  updateSelection() {
    this.editor.updateSelection();
  }

  /**
   * @returns the modeldata as received from the server. This does not represent the current editor data.
   */
  getBaseModelData() {
    return this.modelData;
  }

  edit(resourceId) {
    // Save the current canvas in the canvastracker if it is the root process.
    this.syncCanvasTracker();

    this.loading = true;

    let shapes = this.getCanvas().getChildren();
    shapes.each(
      function (shape) {
        this.editor.deleteShape(shape);
      }.bind(this),
    );

    shapes = this.canvasTracker.get(resourceId);
    if (!shapes) {
      shapes = JSON.stringify([]);
    }

    this.editor.loadSerialized({
      childShapes: shapes,
    });

    this.getCanvas().update();

    this.current = resourceId;

    this.loading = false;
    FLOWABLE.eventBus.dispatch('EDITORMANAGER-EDIT-ACTION', {});
    FLOWABLE.eventBus.dispatch(FLOWABLE.eventBus.EVENT_TYPE_UNDO_REDO_RESET, {});
  }

  getTree() {
    // build a tree of all subprocesses and there children.
    const result = new Hash();
    const parent = this.getModel();
    result.set('name', parent.properties.name || 'No name provided');
    result.set('id', this.modelId);
    result.set('type', 'root');
    result.set('current', this.current === this.modelId);
    const {childShapes} = parent;
    const children = this._buildTreeChildren(childShapes);
    result.set('children', children);
    return result.toObject();
  }

  _buildTreeChildren(childShapes) {
    const children = [];
    for (let i = 0; i < childShapes.length; i++) {
      const childShape = childShapes[i];
      const stencilId = childShape.stencil.id;
      // we are currently only interested in the expanded subprocess and collapsed processes
      if (stencilId && this.treeFilteredElements.indexOf(stencilId) > -1) {
        const child = new Hash();
        child.set('name', childShape.properties.name || 'No name provided');
        child.set('id', childShape.resourceId);
        child.set('type', stencilId);
        child.set('current', childShape.resourceId === this.current);

        // check if childshapes

        if (stencilId === 'CollapsedSubProcess') {
          // the save function stores the real object as a childshape
          // it is possible that there is no child element because the user did not open the collapsed subprocess.
          if (childShape.childShapes.length === 0) {
            child.set('children', []);
          } else {
            child.set('children', this._buildTreeChildren(childShape.childShapes));
          }
          child.set('editable', true);
        } else {
          child.set('children', this._buildTreeChildren(childShape.childShapes));
          child.set('editable', false);
        }
        child.set('icon', this.structualIcons[stencilId]);
        children.push(child.toObject());
      }
    }
    return children;
  }

  syncCanvasTracker() {
    const shapes = this.getCanvas().getChildren();
    const jsonShapes = [];
    shapes.each(function (shape) {
      // toJson is an summary object but its not a json string.!!!!!
      jsonShapes.push(shape.toJSON());
    });
    this.canvasTracker.set(this.current, JSON.stringify(jsonShapes));
  }

  getModel() {
    this.syncCanvasTracker();

    const modelMetaData = this.getBaseModelData();

    let stencilId;
    let stencilSetNamespace;
    let stencilSetUrl;
    if (modelMetaData.model.stencilset.namespace == 'http://b3mn.org/stencilset/cmmn1.1#') {
      stencilId = 'CMMNDiagram';
      stencilSetNamespace = 'http://b3mn.org/stencilset/cmmn1.1#';
      stencilSetUrl = '../editor/stencilsets/cmmn1.1/cmmn1.1.json';
    } else if (modelMetaData.model.stencilset.namespace == 'http://b3mn.org/stencilset/dmn1.2#') {
      stencilId = 'DMNDiagram';
      stencilSetNamespace = 'http://b3mn.org/stencilset/dmn1.2#';
      stencilSetUrl = '../editor/stencilsets/dmn1.1/dmn1.2.json';
    } else {
      stencilId = 'BPMNDiagram';
      stencilSetNamespace = 'http://b3mn.org/stencilset/bpmn2.0#';
      stencilSetUrl = '../editor/stencilsets/bpmn2.0/bpmn2.0.json';
    }

    // this is an object.
    const editorConfig = this.editor.getJSON();
    const model = {
      modelId: this.modelId,
      bounds: editorConfig.bounds,
      properties: editorConfig.properties,
      childShapes: JSON.parse(this.canvasTracker.get(this.modelId)),
      stencil: {
        id: stencilId,
      },
      stencilset: {
        namespace: stencilSetNamespace,
        url: stencilSetUrl,
      },
    };

    this._mergeCanvasToChild(model);

    return model;
  }

  setModelData(response) {
    this.modelData = response.data;
  }

  bootEditor() {
    // TODO: populate the canvas with correct json sections.
    // resetting the state
    this.canvasTracker = new Hash();
    const config = jQuery.extend(true, {}, this.modelData); // avoid a reference to the original object.
    if (!config.model.childShapes) {
      config.model.childShapes = [];
    }

    this.findAndRegisterCanvas(config.model.childShapes); // this will remove any childshapes of a collapseable subprocess.
    this.canvasTracker.set(config.modelId, JSON.stringify(config.model.childShapes)); // this will be overwritten almost instantly.

    this.editor = new ORYX.Editor(config);
    this.current = this.editor.id;
    this.loading = false;

    FLOWABLE.eventBus.editor = this.editor;
    FLOWABLE.eventBus.dispatch('ORYX-EDITOR-LOADED', {});
    FLOWABLE.eventBus.dispatch(FLOWABLE.eventBus.EVENT_TYPE_EDITOR_BOOTED, {});
  }

  findAndRegisterCanvas(childShapes) {
    for (let i = 0; i < childShapes.length; i++) {
      const childShape = childShapes[i];
      if (childShape.stencil.id === 'CollapsedSubProcess') {
        if (childShape.childShapes.length > 0) {
          // the canvastracker will auto correct itself with a new canvasmodel see this.edit()...
          this.findAndRegisterCanvas(childShape.childShapes);
          // a canvas can't be nested as a child because the editor would crash on redundant information.
          this.canvasTracker.set(childShape.resourceId, JSON.stringify(childShape.childShapes));
          // reference to config will clear the value.
          childShape.childShapes = [];
        } else {
          this.canvasTracker.set(childShape.resourceId, '[]');
        }
      }
    }
  }

  _mergeCanvasToChild(parent) {
    for (let i = 0; i < parent.childShapes.length; i++) {
      const childShape = parent.childShapes[i];
      if (childShape.stencil.id === 'CollapsedSubProcess') {
        let elements = this.canvasTracker.get(childShape.resourceId);
        if (elements) {
          elements = JSON.parse(elements);
        } else {
          elements = [];
        }
        childShape.childShapes = elements;
        this._mergeCanvasToChild(childShape);
      } else if (childShape.stencil.id === 'SubProcess') {
        this._mergeCanvasToChild(childShape);
      } else {
        // do nothing?
      }
    }
  }

  dispatchOryxEvent(event) {
    FLOWABLE.eventBus.dispatchOryxEvent(event);
  }

  isLoading() {
    return this.loading;
  }

  navigateTo(resourceId) {
    // TODO: this could be improved by check if the resourceId is not equal to the current tracker...
    this.syncCanvasTracker();
    let found = false;
    this.canvasTracker.each(function (pair) {
      const {key} = pair;
      const children = JSON.parse(pair.value);
      const targetable = this._findTarget(children, resourceId);
      if (!found && targetable) {
        this.edit(key);
        const flowableShape = this.getCanvas().getChildShapeByResourceId(targetable);
        this.setSelection([flowableShape], [], true);
        found = true;
      }
    }, this);
  }

  _findTarget(children, resourceId) {
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.resourceId === resourceId) {
        return child.resourceId;
      } if (child.properties && child.properties.overrideid === resourceId) {
        return child.resourceId;
      }
        const result = this._findTarget(child.childShapes, resourceId);
        if (result) {
          return result;
        }

    }
    return false;
  }
}

export default new EditorManager();
