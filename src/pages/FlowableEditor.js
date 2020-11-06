import { useEffect, useRef } from 'react';
import './FlowableEditor.less';

/* Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * Created by Pardo David on 3/01/2017.
 * For this service to work the user must call bootEditor method
 */

const FLOWABLE = { URL: {}, CONFIG: {} };
const PATH_NAME = 'http://scjoyedu.eicp.net:7180/onestopapi'
FLOWABLE.CONFIG.contextModelerRestRoot = 'http://scjoyedu.eicp.net:7180/onestopapi/app'
FLOWABLE.URL = {

    getModel: function(modelId) {
        return FLOWABLE.CONFIG.contextModelerRestRoot + '/rest/models/' + modelId + '/editor/json?version=' + Date.now();
    },

    getStencilSet: function() {
        return FLOWABLE.CONFIG.contextModelerRestRoot + '/rest/stencil-sets/editor?version=' + Date.now();
    },

    getCmmnStencilSet: function() {
        return FLOWABLE.CONFIG.contextModelerRestRoot + '/rest/stencil-sets/cmmneditor?version=' + Date.now();
    },

    getDmnStencilSet: function() {
        return FLOWABLE.CONFIG.contextModelerRestRoot + '/rest/stencil-sets/dmneditor?version=' + Date.now();
    },


    putModel: function(modelId) {
        return FLOWABLE.CONFIG.contextModelerRestRoot + '/rest/models/' + modelId + '/editor/json';
    },

    validateModel: function(){
		return FLOWABLE.CONFIG.contextModelerRestRoot + '/rest/model/validate';
    }
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

  EVENT_TYPE_UNDO_REDO_RESET : 'event-type-undo-redo-reset',

  /** A mapping for storing the listeners*/
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
  addListener: function (type, callback, scope) {

      // Add to the listeners map
      if (typeof this.listeners[type] !== "undefined") {
          this.listeners[type].push({scope: scope, callback: callback});
      } else {
          this.listeners[type] = [
              {scope: scope, callback: callback}
          ];
      }
  },

  /**
   * Removes the provided event listener.
   */
  removeListener: function (type, callback, scope) {
      if (typeof this.listeners[type] != "undefined") {
          var numOfCallbacks = this.listeners[type].length;
          var newArray = [];
          for (var i = 0; i < numOfCallbacks; i++) {
              var listener = this.listeners[type][i];
              if (listener.scope === scope && listener.callback === callback) {
                  // Do nothing, this is the listener and doesn't need to survive
              } else {
                  newArray.push(listener);
              }
          }
          this.listeners[type] = newArray;
      }
  },

  hasListener:function(type, callback, scope) {
      if(typeof this.listeners[type] != "undefined") {
          var numOfCallbacks = this.listeners[type].length;
          if(callback === undefined && scope === undefined){
              return numOfCallbacks > 0;
          }
          for(var i=0; i<numOfCallbacks; i++) {
              var listener = this.listeners[type][i];
              if(listener.scope == scope && listener.callback == callback) {
                  return true;
              }
          }
      }
      return false;
  },

  /**
   * Dispatch an event to all event listeners registered to that specific type.
   */
  dispatch:function(type, event) {
      if(typeof this.listeners[type] != "undefined") {
          var numOfCallbacks = this.listeners[type].length;
          for(var i=0; i<numOfCallbacks; i++) {
              var listener = this.listeners[type][i];
              if(listener && listener.callback) {
                  listener.callback.apply(listener.scope, [event]);
              }
          }
      }
  },

  dispatchOryxEvent: function(event, uiObject) {
      FLOWABLE.eventBus.editor.handleEvents(event, uiObject);
  }

};
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
    //we don't want a references!
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
    return this.editor; //TODO: find  out if we can avoid exposing the editor object to angular.
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
    //Save the current canvas in the canvastracker if it is the root process.
    this.syncCanvasTracker();

    this.loading = true;

    var shapes = this.getCanvas().getChildren();
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
    //build a tree of all subprocesses and there children.
    var result = new Hash();
    var parent = this.getModel();
    result.set('name', parent.properties['name'] || 'No name provided');
    result.set('id', this.modelId);
    result.set('type', 'root');
    result.set('current', this.current === this.modelId);
    var childShapes = parent.childShapes;
    var children = this._buildTreeChildren(childShapes);
    result.set('children', children);
    return result.toObject();
  }
  _buildTreeChildren(childShapes) {
    var children = [];
    for (var i = 0; i < childShapes.length; i++) {
      var childShape = childShapes[i];
      var stencilId = childShape.stencil.id;
      //we are currently only interested in the expanded subprocess and collapsed processes
      if (stencilId && this.treeFilteredElements.indexOf(stencilId) > -1) {
        var child = new Hash();
        child.set('name', childShape.properties.name || 'No name provided');
        child.set('id', childShape.resourceId);
        child.set('type', stencilId);
        child.set('current', childShape.resourceId === this.current);

        //check if childshapes

        if (stencilId === 'CollapsedSubProcess') {
          //the save function stores the real object as a childshape
          //it is possible that there is no child element because the user did not open the collapsed subprocess.
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
    var shapes = this.getCanvas().getChildren();
    var jsonShapes = [];
    shapes.each(function (shape) {
      //toJson is an summary object but its not a json string.!!!!!
      jsonShapes.push(shape.toJSON());
    });
    this.canvasTracker.set(this.current, JSON.stringify(jsonShapes));
  }
  getModel() {
    this.syncCanvasTracker();

    var modelMetaData = this.getBaseModelData();

    var stencilId = undefined;
    var stencilSetNamespace = undefined;
    var stencilSetUrl = undefined;
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

    //this is an object.
    var editorConfig = this.editor.getJSON();
    var model = {
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
    //TODO: populate the canvas with correct json sections.
    //resetting the state
    this.canvasTracker = new Hash();
    var config = jQuery.extend(true, {}, this.modelData); //avoid a reference to the original object.
    if (!config.model.childShapes) {
      config.model.childShapes = [];
    }

    this.findAndRegisterCanvas(config.model.childShapes); //this will remove any childshapes of a collapseable subprocess.
    this.canvasTracker.set(config.modelId, JSON.stringify(config.model.childShapes)); //this will be overwritten almost instantly.

    this.editor = new ORYX.Editor(config);
    this.current = this.editor.id;
    this.loading = false;

    FLOWABLE.eventBus.editor = this.editor;
    FLOWABLE.eventBus.dispatch('ORYX-EDITOR-LOADED', {});
    FLOWABLE.eventBus.dispatch(FLOWABLE.eventBus.EVENT_TYPE_EDITOR_BOOTED, {});
  }
  findAndRegisterCanvas(childShapes) {
    for (var i = 0; i < childShapes.length; i++) {
      var childShape = childShapes[i];
      if (childShape.stencil.id === 'CollapsedSubProcess') {
        if (childShape.childShapes.length > 0) {
          //the canvastracker will auto correct itself with a new canvasmodel see this.edit()...
          this.findAndRegisterCanvas(childShape.childShapes);
          //a canvas can't be nested as a child because the editor would crash on redundant information.
          this.canvasTracker.set(childShape.resourceId, JSON.stringify(childShape.childShapes));
          //reference to config will clear the value.
          childShape.childShapes = [];
        } else {
          this.canvasTracker.set(childShape.resourceId, '[]');
        }
      }
    }
  }
  _mergeCanvasToChild(parent) {
    for (var i = 0; i < parent.childShapes.length; i++) {
      var childShape = parent.childShapes[i];
      if (childShape.stencil.id === 'CollapsedSubProcess') {
        var elements = this.canvasTracker.get(childShape.resourceId);
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
        //do nothing?
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
    //TODO: this could be improved by check if the resourceId is not equal to the current tracker...
    this.syncCanvasTracker();
    var found = false;
    this.canvasTracker.each(function (pair) {
      var key = pair.key;
      var children = JSON.parse(pair.value);
      var targetable = this._findTarget(children, resourceId);
      if (!found && targetable) {
        this.edit(key);
        var flowableShape = this.getCanvas().getChildShapeByResourceId(targetable);
        this.setSelection([flowableShape], [], true);
        found = true;
      }
    }, this);
  }
  _findTarget(children, resourceId) {
    for (var i = 0; i < children.length; i++) {
      var child = children[i];
      if (child.resourceId === resourceId) {
        return child.resourceId;
      } else if (child.properties && child.properties['overrideid'] === resourceId) {
        return child.resourceId;
      } else {
        var result = this._findTarget(child.childShapes, resourceId);
        if (result) {
          return result;
        }
      }
    }
    return false;
  }
}
const modelId = 'c6ae1c7a-0a07-11eb-8419-525400395b29';


const editorManager = new EditorManager();


const httpGet = url => {
  console.log('http get, url: ', url);
  return fetch(url, { method: 'GET' }).then(res => res.json()).then(data => ({ data }));
};

export default function FlowableEditor() {
  console.log('oryx ', window.ORYX.Editor);

  useEffect(() => {
    editorManager.setModelId(modelId);
    httpGet(FLOWABLE.URL.getModel(modelId)).then(response => {
      console.log('response ', response)
      editorManager.setModelData(response);
	    return response;
    }).then(modelData => {
      if(modelData.data.model.stencilset.namespace == 'http://b3mn.org/stencilset/cmmn1.1#') {
        return httpGet(FLOWABLE.URL.getCmmnStencilSet());
     }
     if (modelData.data.model.stencilset.namespace == 'http://b3mn.org/stencilset/dmn1.2#') {
        return httpGet(FLOWABLE.URL.getDmnStencilSet());
     }
     return httpGet(FLOWABLE.URL.getStencilSet());
    }).then(function (response) {
      const baseUrl = "http://b3mn.org/stencilset/";
     editorManager.setStencilData(response.data);
     //the stencilset alters the data ref!
     const stencilSet = new ORYX.Core.StencilSet.StencilSet(baseUrl, response.data);
     ORYX.Core.StencilSet.loadStencilSet(baseUrl, stencilSet, modelId);
     //after the stencilset is loaded we make sure the plugins.xml is loaded.
    //  return httpGet(PATH_NAME + ORYX.CONFIG.PLUGINS_CONFIG);
      return { data: `<?xml version="1.0" encoding="utf-8"?>
          <config>

            <plugins>
              <plugin source="version.js" name="" />
              <plugin source="signavio.js" name="Signavio.Plugins.Loading" />

              <plugin source="loading.js" name="ORYX.Plugins.Loading" />
              <plugin source="canvasResize.js" name="ORYX.Plugins.CanvasResize">
                <notUsesIn namespace="http://b3mn.org/stencilset/xforms#"/>
              </plugin>

              <plugin source="renameShapes.js" name="ORYX.Plugins.RenameShapes" />
              <plugin source="processLink.js" name="ORYX.Plugins.ProcessLink">
                <requires namespace="http://b3mn.org/stencilset/bpmn1.1#"/>
              </plugin>

              <!-- following plugins don't require Ext -->
              <plugin source="arrangement.js" name="ORYX.Plugins.Arrangement">
                <notUsesIn namespace="http://b3mn.org/stencilset/xforms#"/>
              </plugin>
              <plugin source="file.js" name="ORYX.Plugins.Save"/>
              <plugin source="view.js" name="ORYX.Plugins.View" />
              <plugin source="dragdropresize.js" name="ORYX.Plugins.DragDropResize" />
              <plugin source="shapeHighlighting.js" name="ORYX.Plugins.HighlightingSelectedShapes" />
              <plugin source="dragDocker.js" name="ORYX.Plugins.DragDocker">
                <notUsesIn namespace="http://b3mn.org/stencilset/xforms#" />
              </plugin>
              <plugin source="addDocker.js" name="ORYX.Plugins.AddDocker">
                <notUsesIn namespace="http://b3mn.org/stencilset/xforms#" />
              </plugin>
              <plugin source="selectionframe.js" name="ORYX.Plugins.SelectionFrame">
                <notUsesIn namespace="http://b3mn.org/stencilset/xforms#" />
              </plugin>
              <plugin source="shapeHighlighting.js" name="ORYX.Plugins.ShapeHighlighting" />
              <plugin source="overlay.js" name="ORYX.Plugins.Overlay" />
              <plugin source="keysMove.js" name="ORYX.Plugins.KeysMove" />
              <plugin source="Layouter/edgeLayouter.js" name="ORYX.Plugins.Layouter.EdgeLayouter" />

              <!-- Begin: BPMN2.0 specific plugins -->
              <plugin source="bpmn2.0/bpmn2.0.js" name="ORYX.Plugins.BPMN2_0">
                <requires namespace="http://b3mn.org/stencilset/bpmn2.0#" />
              </plugin>

              <!-- End: BPMN2.0 specific plugins -->
            </plugins>

            <properties>
              <property group="File" index="1" />
              <property group="Edit" index="2" />
              <property group="Undo" index="3" />
              <property group="Alignment" index="4" />
              <property group="Group" index="5" />
              <property group="Z-Order" index="6" />
              <property group="Docker" index="7" />
              <property group="Zoom" index="8" />
            </properties>
          </config>`
      };

   }).then(function (response) {
     ORYX._loadPlugins(response.data);
     return response;
   }).then(function (response) {
     editorManager.bootEditor();
   }).catch(function (error) {
     console.log(error);
   });
  }, []);
  return <h1>hello world</h1>;
}
