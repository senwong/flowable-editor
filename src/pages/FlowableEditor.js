import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './FlowableEditor.css';
import plugins from './plugins';

import FLOWABLE from './FLOWABLE';
import editorManager from './EditorManager';
import DeleteIcon from './icons/delete'
import SettingIcon from './icons/setting'
import UserIcon from './icons/user';
import EndRoundIcon from './icons/endRound'
import DoubleRoundIcon from './icons/doubleRound';
import TimerIcon from './icons/timer';
import ArrowIcon from './icons/arrow';
import DottedLineIcon from './icons/dottedLine';
import TextAnnotationIcon from './icons/textAnnotation';
import ExclusiveGatewayIcon from './icons/exclusiveGateway'
import PropertySection from './PropertySection'
import ToolbarSection from './ToolbarSection';
import PaletteSection from './PaletteSection';

const QuickMenuIconMap = {
  UserTask: <UserIcon />,
  EndNoneEvent: <EndRoundIcon />,
  ThrowNoneEvent: <DoubleRoundIcon />,
  CatchTimerEvent: <TimerIcon />,
  SequenceFlow: <ArrowIcon />,
  Association: <DottedLineIcon />,
  TextAnnotation: <TextAnnotationIcon />,
  ExclusiveGateway: <ExclusiveGatewayIcon />,
}

const modelId = '3cf3a5fa-1e8b-11eb-8419-525400395b29';


const $rootScope = {};

const httpGet = (url) => {
  return fetch(url, { method: 'GET' })
    .then((res) => res.json())
    .then((data) => ({ data }));
};

$rootScope.editorFactory = {
  privateResolve: null,
};
$rootScope.editorFactory.promise = new Promise((resolve, reject) => {
  $rootScope.editorFactory.privateResolve = resolve;
});
$rootScope.editorFactory.resolve = () => $rootScope.editorFactory.privateResolve();

/**
 * Helper method that searches a group for an item with the given id.
 * If not found, will return undefined.
 */
function findStencilItemInGroup(stencilItemId, group) {
  var item;

  // Check all items directly in this group
  for (var j = 0; j < group.items.length; j++) {
    item = group.items[j];
    if (item.id === stencilItemId) {
      return item;
    }
  }

  // Check the child groups
  if (group.groups && group.groups.length > 0) {
    for (var k = 0; k < group.groups.length; k++) {
      item = findStencilItemInGroup(stencilItemId, group.groups[k]);
      if (item) {
        return item;
      }
    }
  }

  return undefined;
}

// Helper method: find a group in an array
const findGroup = function (name, groupArray) {
  for (let index = 0; index < groupArray.length; index++) {
    if (groupArray[index].name === name) {
      return groupArray[index];
    }
  }
  return null;
};

// Helper method: add a new group to an array of groups
const addGroup = function (groupName, groupArray) {
  let group = { name: groupName, items: [], paletteItems: [], groups: [], visible: true };
  groupArray.push(group);
  return group;
};

export default function FlowableEditor() {
  const [stencilData, setStencilData] = useState();
  const [ORYXEDITORLOADED, setORYXEDITORLOADED] = useState(false);
  useEffect(() =>  {
    editorManager.setStencilData(stencilData);
  }, [stencilData])
  const initializeEditor = useCallback(() => {
    /**
     * Initialize the Oryx Editor when the content has been loaded
     */
    if (!$rootScope.editorInitialized) {


      /**
       * A 'safer' apply that avoids concurrent updates (which $apply allows).
       */
      $rootScope.safeApply = function (fn) {
        if (this.$root) {
          var phase = this.$root.$$phase;
          if (phase == '$apply' || phase == '$digest') {
            if (fn && typeof fn === 'function') {
              fn();
            }
          } else {
            this.$apply(fn);
          }
        } else {
          this.$apply(fn);
        }
      };

      $rootScope.addHistoryItem = function (resourceId) {
        const modelMetaData = editorManager.getBaseModelData();

        const historyItem = {
          id: modelMetaData.modelId,
          name: modelMetaData.name,
          key: modelMetaData.key,
          stepId: resourceId,
          type: 'bpmnmodel',
        };

        if (editorManager.getCurrentModelId() != editorManager.getModelId()) {
          historyItem.subProcessId = editorManager.getCurrentModelId();
        }

        $rootScope.editorHistory.push(historyItem);
      };

      $rootScope.getStencilSetName = function () {
        const modelMetaData = editorManager.getBaseModelData();
        if (modelMetaData.model.stencilset.namespace === 'http://b3mn.org/stencilset/cmmn1.1#') {
          return 'cmmn1.1';
        }
        return 'bpmn2.0';
      };

      /**
       * Initialize the event bus: couple all Oryx events with a dispatch of the
       * event of the event bus. This way, it gets much easier to attach custom logic
       * to any event.
       */

      $rootScope.editorFactory.promise.then(function () {
        $rootScope.formItems = undefined;

        FLOWABLE.eventBus.editor = $rootScope.editor;

        const eventMappings = [
          {
            oryxType: ORYX.CONFIG.EVENT_SELECTION_CHANGED,
            flowableType: FLOWABLE.eventBus.EVENT_TYPE_SELECTION_CHANGE,
          },
          {
            oryxType: ORYX.CONFIG.EVENT_DBLCLICK,
            flowableType: FLOWABLE.eventBus.EVENT_TYPE_DOUBLE_CLICK,
          },
          {
            oryxType: ORYX.CONFIG.EVENT_MOUSEOUT,
            flowableType: FLOWABLE.eventBus.EVENT_TYPE_MOUSE_OUT,
          },
          {
            oryxType: ORYX.CONFIG.EVENT_MOUSEOVER,
            flowableType: FLOWABLE.eventBus.EVENT_TYPE_MOUSE_OVER,
          },
          {
            oryxType: ORYX.CONFIG.EVENT_EDITOR_INIT_COMPLETED,
            flowableType: FLOWABLE.eventBus.EVENT_TYPE_EDITOR_READY,
          },
          {
            oryxType: ORYX.CONFIG.EVENT_PROPERTY_CHANGED,
            flowableType: FLOWABLE.eventBus.EVENT_TYPE_PROPERTY_VALUE_CHANGED,
          },
        ];

        eventMappings.forEach(function (eventMapping) {
          editorManager.registerOnEvent(eventMapping.oryxType, function (event) {
            FLOWABLE.eventBus.dispatch(eventMapping.flowableType, event);
          });
        });

        // Show getting started if this is the first time (boolean true for use local storage)
        // FLOWABLE_EDITOR_TOUR.gettingStarted($scope, $translate, $q, true);
      });

      // Hook in resizing of main panels when window resizes
      // TODO: perhaps move to a separate JS-file?
      jQuery(window).resize(function () {
        // Calculate the offset based on the bottom of the module header
        const offset = jQuery('#editor-header').offset();
        const propSectionHeight = jQuery('#propertySection').height();
        const canvas = jQuery('#canvasSection');
        const mainHeader = jQuery('#main-header');

        if (
          offset == undefined ||
          offset === null ||
          propSectionHeight === undefined ||
          propSectionHeight === null ||
          canvas === undefined ||
          canvas === null ||
          mainHeader === null
        ) {
          return;
        }

        if ($rootScope.editor) {
          const selectedElements = editorManager.getSelection();
          const subSelectionElements = editorManager.getSelection();

          $scope.selectedElements = selectedElements;
          $scope.subSelectionElements = subSelectionElements;
          if (selectedElements && selectedElements.length > 0) {
            $rootScope.selectedElementBeforeScrolling = selectedElements[0];

            editorManager.setSelection([]); // needed cause it checks for element changes and does nothing if the elements are the same
            editorManager.setSelection($scope.selectedElements, $scope.subSelectionElements);
            $scope.selectedElements = undefined;
            $scope.subSelectionElements = undefined;
          }
        }

        const totalAvailable = jQuery(window).height() - offset.top - mainHeader.height() - 21;
        canvas.height(totalAvailable - propSectionHeight);
        const footerHeight = jQuery('#paletteSectionFooter').height();
        const treeViewHeight = jQuery('#process-treeview-wrapper').height();
        jQuery('#paletteSection').height(totalAvailable - treeViewHeight - footerHeight);

        // Update positions of the resize-markers, according to the canvas

        var actualCanvas = null;
        if (canvas && canvas[0].children[1]) {
          actualCanvas = canvas[0].children[1];
        }

        var canvasTop = canvas.position().top;
        var canvasLeft = canvas.position().left;
        var canvasHeight = canvas[0].clientHeight;
        var canvasWidth = canvas[0].clientWidth;
        var iconCenterOffset = 8;
        var widthDiff = 0;

        var actualWidth = 0;
        if (actualCanvas) {
          // In some browsers, the SVG-element clientwidth isn't available, so we revert to the parent
          actualWidth = actualCanvas.clientWidth || actualCanvas.parentNode.clientWidth;
        }

        if (actualWidth < canvas[0].clientWidth) {
          widthDiff = actualWidth - canvas[0].clientWidth;
          // In case the canvas is smaller than the actual viewport, the resizers should be moved
          canvasLeft -= widthDiff / 2;
          canvasWidth += widthDiff;
        }

        var iconWidth = 17;
        var iconOffset = 20;

        var north = jQuery('#canvas-grow-N');
        north.css('top', canvasTop + iconOffset + 'px');
        north.css('left', canvasLeft - 10 + (canvasWidth - iconWidth) / 2 + 'px');

        var south = jQuery('#canvas-grow-S');
        south.css('top', canvasTop + canvasHeight - iconOffset - iconCenterOffset + 'px');
        south.css('left', canvasLeft - 10 + (canvasWidth - iconWidth) / 2 + 'px');

        var east = jQuery('#canvas-grow-E');
        east.css('top', canvasTop - 10 + (canvasHeight - iconWidth) / 2 + 'px');
        east.css('left', canvasLeft + canvasWidth - iconOffset - iconCenterOffset + 'px');

        var west = jQuery('#canvas-grow-W');
        west.css('top', canvasTop - 10 + (canvasHeight - iconWidth) / 2 + 'px');
        west.css('left', canvasLeft + iconOffset + 'px');

        north = jQuery('#canvas-shrink-N');
        north.css('top', canvasTop + iconOffset + 'px');
        north.css('left', canvasLeft + 10 + (canvasWidth - iconWidth) / 2 + 'px');

        south = jQuery('#canvas-shrink-S');
        south.css('top', canvasTop + canvasHeight - iconOffset - iconCenterOffset + 'px');
        south.css('left', canvasLeft + 10 + (canvasWidth - iconWidth) / 2 + 'px');

        east = jQuery('#canvas-shrink-E');
        east.css('top', canvasTop + 10 + (canvasHeight - iconWidth) / 2 + 'px');
        east.css('left', canvasLeft + canvasWidth - iconOffset - iconCenterOffset + 'px');

        west = jQuery('#canvas-shrink-W');
        west.css('top', canvasTop + 10 + (canvasHeight - iconWidth) / 2 + 'px');
        west.css('left', canvasLeft + iconOffset + 'px');
      });

      jQuery(window).trigger('resize');

      jQuery.fn.scrollStopped = function (callback) {
        jQuery(this).scroll(function () {
          var self = this,
            $this = jQuery(self);
          if ($this.data('scrollTimeout')) {
            clearTimeout($this.data('scrollTimeout'));
          }
          $this.data('scrollTimeout', setTimeout(callback, 50, self));
        });
      };



      FLOWABLE.eventBus.addListener(
        'ORYX-EDITOR-LOADED',
        function () {
          setORYXEDITORLOADED(true);
          this.editorFactory.resolve();
          this.editorInitialized = true;
          this.modelData = editorManager.getBaseModelData();
        },
        $rootScope,
      );

      FLOWABLE.eventBus.addListener(FLOWABLE.eventBus.EVENT_TYPE_EDITOR_READY, function () {
        var url = window.location.href;
        var regex = new RegExp('[?&]subProcessId(=([^&#]*)|&|#|$)');
        var results = regex.exec(url);
        if (results && results[2]) {
          editorManager.edit(decodeURIComponent(results[2].replace(/\+/g, ' ')));
        }
      });
    }

    if (!$rootScope.stencilInitialized) {

      FLOWABLE.eventBus.addListener(FLOWABLE.eventBus.EVENT_TYPE_HIDE_SHAPE_BUTTONS, function (event) {
        jQuery('.Oryx_button').each(function(i, obj) {
            obj.style.display = "none";
        });
      });

    //   /*
    //     * Listen to property updates and act upon them
    //     */
    //   FLOWABLE.eventBus.addListener(FLOWABLE.eventBus.EVENT_TYPE_PROPERTY_VALUE_CHANGED, function (event) {
    //     if (event.property && event.property.key) {
    //         // If the name property is been updated, we also need to change the title of the currently selected item
    //         if (event.property.key === 'oryx-name' && $scope.selectedItem !== undefined && $scope.selectedItem !== null) {
    //             $scope.selectedItem.title = event.newValue;
    //         }

    //         // Update "no value" flag
    //         event.property.noValue = (event.property.value === undefined
    //             || event.property.value === null
    //             || event.property.value.length == 0);
    //     }
    //   });
    //   FLOWABLE.eventBus.addListener(FLOWABLE.eventBus.EVENT_TYPE_SHOW_VALIDATION_POPUP, function (event) {
    //     // Method to open validation dialog
    //     var showValidationDialog = function() {
    //         $rootScope.currentValidationId = event.validationId;
    //         $rootScope.isOnProcessLevel = event.onProcessLevel;

    //         _internalCreateModal({template: 'editor-app/popups/validation-errors.html?version=' + Date.now()},  $modal, $rootScope);
    //     };

    //     showValidationDialog();
    //   });

    // FLOWABLE.eventBus.addListener(FLOWABLE.eventBus.EVENT_TYPE_NAVIGATE_TO_PROCESS, function (event) {
    //     var modelMetaData = editorManager.getBaseModelData();
    //     $rootScope.editorHistory.push({
    //           id: modelMetaData.modelId,
    //           name: modelMetaData.name,
    //           type: 'bpmnmodel'
    //     });

    //     $window.location.href = "../editor/#/editor/" + event.processId;
    //   });
      $rootScope.stencilInitialized = true;
    }
  }, []);
  const fetchModelData = useCallback(() => {
    editorManager.setModelId(modelId);
    httpGet(FLOWABLE.URL.getModel(modelId))
      .then((response) => {
        console.log('response ', response);
        editorManager.setModelData(response);
        return response;
      })
      .then((modelData) => {
        if (modelData.data.model.stencilset.namespace == 'http://b3mn.org/stencilset/cmmn1.1#') {
          return httpGet(FLOWABLE.URL.getCmmnStencilSet());
        }
        if (modelData.data.model.stencilset.namespace == 'http://b3mn.org/stencilset/dmn1.2#') {
          return httpGet(FLOWABLE.URL.getDmnStencilSet());
        }
        return httpGet(FLOWABLE.URL.getStencilSet());
      })
      .then(function (response) {
        const baseUrl = 'http://b3mn.org/stencilset/';
        setStencilData(response.data);
        //the stencilset alters the data ref!
        const stencilSet = new ORYX.Core.StencilSet.StencilSet(baseUrl, response.data);
        ORYX.Core.StencilSet.loadStencilSet(baseUrl, stencilSet, modelId);
        //after the stencilset is loaded we make sure the plugins.xml is loaded.
        //  return httpGet(PATH_NAME + ORYX.CONFIG.PLUGINS_CONFIG);
        return { data: plugins };
      })
      .then(function (response) {
        ORYX._loadPlugins(response.data);
        return response;
      })
      .then(function (response) {
        editorManager.bootEditor();
      })
      .catch(function (error) {
        console.log(error);
      });
  }, []);

  const [
    stencilItemGroups = [],
    containmentRules = [],
    quickMenuItems = [],
    morphRoles = [],
  ] = useMemo(() => {
    const stencilItemGroups = [];
    const data = stencilData;
    if (!data) return [];

    let quickMenuDefinition = undefined;
    let ignoreForPaletteDefinition = undefined;

    if (data.namespace == 'http://b3mn.org/stencilset/cmmn1.1#') {
      quickMenuDefinition = ['HumanTask', 'Association'];
      ignoreForPaletteDefinition = ['CasePlanModel'];
    } else if (data.namespace == 'http://b3mn.org/stencilset/dmn1.2#') {
      quickMenuDefinition = [
        'DecisionTableDecision',
        'InformationRequirement',
        'KnowledgeRequirement',
      ];
      ignoreForPaletteDefinition = [];
    } else {
      quickMenuDefinition = [
        'UserTask',
        'EndNoneEvent',
        'ExclusiveGateway',
        'CatchTimerEvent',
        'ThrowNoneEvent',
        'TextAnnotation',
        'SequenceFlow',
        'Association',
      ];

      ignoreForPaletteDefinition = [
        'SequenceFlow',
        'MessageFlow',
        'Association',
        'DataAssociation',
        'DataStore',
        'SendTask',
      ];
    }

    let quickMenuItems = [];

    let morphRoles = [];
    for (let i = 0; i < data.rules.morphingRules.length; i++) {
      let role = data.rules.morphingRules[i].role;
      let roleItem = { role: role, morphOptions: [] };
      morphRoles.push(roleItem);
    }

    // Check all received items
    for (let stencilIndex = 0; stencilIndex < data.stencils.length; stencilIndex++) {
      // Check if the root group is the 'diagram' group. If so, this item should not be shown.
      let currentGroupName = data.stencils[stencilIndex].groups[0];
      if (
        currentGroupName === 'Diagram' ||
        currentGroupName === 'BPMN.STENCILS.GROUPS.DIAGRAM' ||
        currentGroupName === 'CMMN.STENCILS.GROUPS.DIAGRAM' ||
        currentGroupName === 'DMN.STENCILS.GROUPS.DIAGRAM'
      ) {
        continue; // go to next item
      }

      let removed = false;
      if (data.stencils[stencilIndex].removed) {
        removed = true;
      }

      let currentGroup = undefined;
      if (!removed) {
        // Check if this group already exists. If not, we create a new one

        if (
          currentGroupName !== null &&
          currentGroupName !== undefined &&
          currentGroupName.length > 0
        ) {
          currentGroup = findGroup(currentGroupName, stencilItemGroups); // Find group in root groups array
          if (currentGroup === null) {
            currentGroup = addGroup(currentGroupName, stencilItemGroups);
          }

          // Add all child groups (if any)
          for (
            let groupIndex = 1;
            groupIndex < data.stencils[stencilIndex].groups.length;
            groupIndex++
          ) {
            let childGroupName = data.stencils[stencilIndex].groups[groupIndex];
            let childGroup = findGroup(childGroupName, currentGroup.groups);
            if (childGroup === null) {
              childGroup = addGroup(childGroupName, currentGroup.groups);
            }

            // The current group variable holds the parent of the next group (if any),
            // and is basically the last element in the array of groups defined in the stencil item
            currentGroup = childGroup;
          }
        }
      }

      // Construct the stencil item
      let stencilItem = {
        id: data.stencils[stencilIndex].id,
        name: data.stencils[stencilIndex].title,
        description: data.stencils[stencilIndex].description,
        icon: data.stencils[stencilIndex].icon,
        type: data.stencils[stencilIndex].type,
        roles: data.stencils[stencilIndex].roles,
        removed: removed,
        customIcon: false,
        canConnect: false,
        canConnectTo: false,
        canConnectAssociation: false,
      };

      if (
        data.stencils[stencilIndex].customIconId &&
        data.stencils[stencilIndex].customIconId > 0
      ) {
        stencilItem.customIcon = true;
        stencilItem.icon = data.stencils[stencilIndex].customIconId;
      }

      if (!removed) {
        if (quickMenuDefinition.indexOf(stencilItem.id) >= 0) {
          quickMenuItems[quickMenuDefinition.indexOf(stencilItem.id)] = stencilItem;
        }
      }

      if (stencilItem.id === 'TextAnnotation' || stencilItem.id === 'BoundaryCompensationEvent') {
        stencilItem.canConnectAssociation = true;
      }

      for (let i = 0; i < data.stencils[stencilIndex].roles.length; i++) {
        let stencilRole = data.stencils[stencilIndex].roles[i];
        if (data.namespace == 'http://b3mn.org/stencilset/cmmn1.1#') {
          if (stencilRole === 'association_start') {
            stencilItem.canConnect = true;
          } else if (stencilRole === 'association_end') {
            stencilItem.canConnectTo = true;
          }
        } else if (data.namespace == 'http://b3mn.org/stencilset/dmn1.2#') {
          if (stencilRole === 'information_requirement_start') {
            stencilItem.canConnect = true;
          } else if (stencilRole === 'information_requirement_end') {
            stencilItem.canConnectTo = true;
          }
        } else {
          if (stencilRole === 'sequence_start') {
            stencilItem.canConnect = true;
          } else if (stencilRole === 'sequence_end') {
            stencilItem.canConnectTo = true;
          }
        }

        for (var j = 0; j < morphRoles.length; j++) {
          if (stencilRole === morphRoles[j].role) {
            if (!removed) {
              morphRoles[j].morphOptions.push(stencilItem);
            }
            stencilItem.morphRole = morphRoles[j].role;
            break;
          }
        }
      }

      if (currentGroup) {
        // Add the stencil item to the correct group
        currentGroup.items.push(stencilItem);
        if (ignoreForPaletteDefinition.indexOf(stencilItem.id) < 0) {
          currentGroup.paletteItems.push(stencilItem);
        }
      } else {
        // It's a root stencil element
        if (!removed) {
          stencilItemGroups.push(stencilItem);
        }
      }
    }

    for (var i = 0; i < stencilItemGroups.length; i++) {
      if (stencilItemGroups[i].paletteItems && stencilItemGroups[i].paletteItems.length == 0) {
        stencilItemGroups[i].visible = false;
      }
    }

    var containmentRules = [];
    for (var i = 0; i < data.rules.containmentRules.length; i++) {
      var rule = data.rules.containmentRules[i];
      containmentRules.push(rule);
    }

    // remove quick menu items which are not available anymore due to custom pallette
    var availableQuickMenuItems = [];
    for (var i = 0; i < quickMenuItems.length; i++) {
      if (quickMenuItems[i]) {
        availableQuickMenuItems[availableQuickMenuItems.length] = quickMenuItems[i];
      }
    }

    return [stencilItemGroups, containmentRules, availableQuickMenuItems, morphRoles];
  }, [stencilData]);

  /**
   * Helper method to find a stencil item.
   */

  const getStencilItemById = useCallback(stencilItemId => {
    for (var i = 0; i < stencilItemGroups.length; i++) {
      var element = stencilItemGroups[i];

      // Real group
      if (element.items !== null && element.items !== undefined) {
        var item = findStencilItemInGroup(stencilItemId, element);
        if (item) {
          return item;
        }
      } else {
        // Root stencil item
        if (element.id === stencilItemId) {
          return element;
        }
      }
    }
    return undefined;
  }, [stencilItemGroups]);


  const setOryxButtonPosition = useCallback((event) => {
    FLOWABLE.eventBus.dispatch(FLOWABLE.eventBus.EVENT_TYPE_HIDE_SHAPE_BUTTONS);
    console.log('EVENT_SELECTION_CHANGED, ', event);
    var shapes = event.elements;

    if (shapes && shapes.length == 1) {
      var selectedShape = shapes.first();

      var a = editorManager.getCanvas().node.getScreenCTM();

      var absoluteXY = selectedShape.absoluteXY();

      absoluteXY.x *= a.a;
      absoluteXY.y *= a.d;

      var additionalIEZoom = 1;
      if (!isNaN(screen.logicalXDPI) && !isNaN(screen.systemXDPI)) {
        var ua = navigator.userAgent;
        if (ua.indexOf('MSIE') >= 0) {
          //IE 10 and below
          var zoom = Math.round((screen.deviceXDPI / screen.logicalXDPI) * 100);
          if (zoom !== 100) {
            additionalIEZoom = zoom / 100;
          }
        }
      }

      if (additionalIEZoom === 1) {
        absoluteXY.y = absoluteXY.y - jQuery('#canvasSection').offset().top + 5;
        absoluteXY.x = absoluteXY.x - jQuery('#canvasSection').offset().left;
      } else {
        var canvasOffsetLeft = jQuery('#canvasSection').offset().left;
        var canvasScrollLeft = jQuery('#canvasSection').scrollLeft();
        var canvasScrollTop = jQuery('#canvasSection').scrollTop();

        var offset = a.e - canvasOffsetLeft * additionalIEZoom;
        var additionaloffset = 0;
        if (offset > 10) {
          additionaloffset = offset / additionalIEZoom - offset;
        }
        absoluteXY.y =
          absoluteXY.y -
          jQuery('#canvasSection').offset().top * additionalIEZoom +
          5 +
          (canvasScrollTop * additionalIEZoom - canvasScrollTop);
        absoluteXY.x =
          absoluteXY.x -
          canvasOffsetLeft * additionalIEZoom +
          additionaloffset +
          (canvasScrollLeft * additionalIEZoom - canvasScrollLeft);
      }

      var bounds = new ORYX.Core.Bounds(
        a.e + absoluteXY.x,
        a.f + absoluteXY.y,
        a.e + absoluteXY.x + a.a * selectedShape.bounds.width(),
        a.f + absoluteXY.y + a.d * selectedShape.bounds.height(),
      );
      var shapeXY = bounds.upperLeft();
      let morphShapes = [];
      var stencilItem = getStencilItemById(selectedShape.getStencil().idWithoutNs());
      if (stencilItem && stencilItem.morphRole) {
        for (var i = 0; i < morphRoles.length; i++) {
          if (morphRoles[i].role === stencilItem.morphRole) {
            morphShapes = morphRoles[i].morphOptions;
          }
        }
      }

      var x = shapeXY.x;
      if (bounds.width() < 48) {
        x -= 24;
      }

      if (morphShapes && morphShapes.length > 0) {
        // In case the element is not wide enough, start the 2 bottom-buttons more to the left
        // to prevent overflow in the right-menu

        var morphButton = document.getElementById('morph-button');
        morphButton.style.display = 'block';
        morphButton.style.left = x + 24 + 'px';
        morphButton.style.top = shapeXY.y + bounds.height() + 2 + 'px';
      }

      var deleteButton = document.getElementById('delete-button');
      deleteButton.style.display = 'block';
      deleteButton.style.left = x + 'px';
      deleteButton.style.top = shapeXY.y + bounds.height() + 2 + 'px';

      var editable = selectedShape._stencil._jsonStencil.id.endsWith('CollapsedSubProcess');
      var editButton = document.getElementById('edit-button');
      if (editable) {
        editButton.style.display = 'block';
        if (morphShapes && morphShapes.length > 0) {
          editButton.style.left = x + 24 + 24 + 'px';
        } else {
          editButton.style.left = x + 24 + 'px';
        }
        editButton.style.top = shapeXY.y + bounds.height() + 2 + 'px';
      } else {
        editButton.style.display = 'none';
      }

      if (stencilItem && (stencilItem.canConnect || stencilItem.canConnectAssociation)) {
        var quickButtonCounter = 0;
        var quickButtonX = shapeXY.x + bounds.width() + 5;
        var quickButtonY = shapeXY.y;
        jQuery('.Oryx_button').each(function (i, obj) {
          if (
            obj.id !== 'morph-button' &&
            obj.id != 'delete-button' &&
            obj.id !== 'edit-button'
          ) {
            quickButtonCounter++;
            if (quickButtonCounter > 3) {
              quickButtonX = shapeXY.x + bounds.width() + 5;
              quickButtonY += 24;
              quickButtonCounter = 1;
            } else if (quickButtonCounter > 1) {
              quickButtonX += 24;
            }

            obj.style.display = 'block';
            obj.style.left = quickButtonX + 'px';
            obj.style.top = quickButtonY + 'px';
          }
        });
      }
    }
  }, [morphRoles, getStencilItemById]);
  useEffect(() => {
    if (!ORYXEDITORLOADED) return;

    editorManager.registerOnEvent(ORYX.CONFIG.EVENT_SELECTION_CHANGED, setOryxButtonPosition);
    return () => {
      editorManager.unregisterOnEvent(ORYX.CONFIG.EVENT_SELECTION_CHANGED, setOryxButtonPosition)
    }
  }, [ORYXEDITORLOADED, setOryxButtonPosition]);

  useEffect(() => {
    $rootScope.forceSelectionRefresh = false;

    $rootScope.ignoreChanges = false; // by default never ignore changes

    $rootScope.validationErrors = [];

    $rootScope.staticIncludeVersion = Date.now();

    initializeEditor();
    fetchModelData();

  }, [initializeEditor, fetchModelData]);




  const dragStateRef = useRef({
    dragModeOver: false,
    quickMenu: false,
    dragCanContain: false,
  });


  function dropCallback(event, ui) {
    event.preventDefault();
    event.persist();
    console.log('dropCallback ', event);
    editorManager.handleEvents({
        type: ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,
        highlightId: "shapeRepo.attached"
    });
    editorManager.handleEvents({
        type: ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,
        highlightId: "shapeRepo.added"
    });

    editorManager.handleEvents({
        type: ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,
        highlightId: "shapeMenu"
    });

    FLOWABLE.eventBus.dispatch(FLOWABLE.eventBus.EVENT_TYPE_HIDE_SHAPE_BUTTONS);

    if (dragStateRef.current.dragCanContain) {

      const draggableId =  event.dataTransfer.getData("draggableId");
      console.log('draggableId: ', draggableId);
      // const item = getStencilItemById(ui.draggable[0].id);
      const item = getStencilItemById(draggableId);

      const pos = {x: event.pageX, y: event.pageY};

      const additionalIEZoom = 1;

      const screenCTM = editorManager.getCanvas().node.getScreenCTM();

      // Correcting the UpperLeft-Offset
      pos.x -= (screenCTM.e / additionalIEZoom);
      pos.y -= (screenCTM.f / additionalIEZoom);
      // Correcting the Zoom-Factor
      pos.x /= screenCTM.a;
      pos.y /= screenCTM.d;

      // Correcting the ScrollOffset
      pos.x -= document.documentElement.scrollLeft;
      pos.y -= document.documentElement.scrollTop;

      const parentAbs = dragStateRef.current.dragCurrentParent.absoluteXY();
      pos.x -= parentAbs.x;
      pos.y -= parentAbs.y;

      let containedStencil;
      const stencilSets = editorManager.getStencilSets().values();
      for (let i = 0; i < stencilSets.length; i++) {
        const stencilSet = stencilSets[i];
        const nodes = stencilSet.nodes();
        for (let j = 0; j < nodes.length; j++) {
          if (nodes[j].idWithoutNs() === draggableId) {
            containedStencil = nodes[j];
            break;
          }
        }

        if (!containedStencil) {
          const edges = stencilSet.edges();
          for (let j = 0; j < edges.length; j++) {
          if (edges[j].idWithoutNs() === draggableId) {
            containedStencil = edges[j];
            break;
          }
        }
      }
    }

    if (!containedStencil) return;

    if (dragStateRef.current.quickMenu) {
      const shapes = editorManager.getSelection();
      if (shapes && shapes.length === 1) {
        const currentSelectedShape = shapes.first();

        const option = {};
        option.type = currentSelectedShape.getStencil().namespace() + ui.draggable[0].id;
        option.namespace = currentSelectedShape.getStencil().namespace();
        option.connectedShape = currentSelectedShape;
        option.parent = $scope.dragCurrentParent;
        option.containedStencil = containedStencil;

        // If the ctrl key is not pressed,
        // snapp the new shape to the center
        // if it is near to the center of the other shape
        if (!event.ctrlKey) {
          // Get the center of the shape
          const cShape = currentSelectedShape.bounds.center();
          // Snapp +-20 Pixel horizontal to the center
          if (20 > Math.abs(cShape.x - pos.x)) {
            pos.x = cShape.x;
          }
          // Snapp +-20 Pixel vertical to the center
          if (20 > Math.abs(cShape.y - pos.y)) {
            pos.y = cShape.y;
          }
        }

        option.position = pos;

        if (containedStencil.idWithoutNs() !== 'SequenceFlow' && containedStencil.idWithoutNs() !== 'Association' &&
                containedStencil.idWithoutNs() !== 'MessageFlow' && containedStencil.idWithoutNs() !== 'DataAssociation') {

          const args = { sourceShape: currentSelectedShape, targetStencil: containedStencil };
          const targetStencil = editorManager.getRules().connectMorph(args);
          if (!targetStencil) { // Check if there can be a target shape
            return;
          }
          option.connectingType = targetStencil.id();
        }

        const command = new FLOWABLE.CreateCommand(option, dragStateRef.current.dropTargetElement, pos, editorManager.getEditor());

        editorManager.executeCommands([command]);
      }

    } else {
      let canAttach = false;
      if (containedStencil.idWithoutNs() === 'BoundaryErrorEvent' || containedStencil.idWithoutNs() === 'BoundaryTimerEvent' ||
            containedStencil.idWithoutNs() === 'BoundarySignalEvent' || containedStencil.idWithoutNs() === 'BoundaryMessageEvent' ||
            containedStencil.idWithoutNs() === 'BoundaryCancelEvent' || containedStencil.idWithoutNs() === 'BoundaryCompensationEvent') {

        // Modify position, otherwise boundary event will get position related to left corner of the canvas instead of the container
        pos = editorManager.eventCoordinates( event );
        canAttach = true;
      }

      const modelData = editorManager.getBaseModelData();
      const option = {};
      option['type'] = modelData.model.stencilset.namespace + item.id;
      option['namespace'] = modelData.model.stencilset.namespace;
      option['position'] = pos;
      option['parent'] = dragStateRef.dragCurrentParent;

      const commandClass = ORYX.Core.Command.extend({
            construct: function(option, dockedShape, canAttach, position, facade){
                this.option = option;
                this.docker = null;
                this.dockedShape = dockedShape;
                this.dockedShapeParent = dockedShape.parent || facade.getCanvas();
                this.position = position;
                this.facade = facade;
                this.selection = this.facade.getSelection();
                this.shape = null;
                this.parent = null;
                this.canAttach = canAttach;
            },
            execute: function(){
                if (!this.shape) {
                    this.shape = this.facade.createShape(option);
                    this.parent = this.shape.parent;
                } else if (this.parent) {
                    this.parent.add(this.shape);
                }

                if (this.canAttach && this.shape.dockers && this.shape.dockers.length) {
                    this.docker = this.shape.dockers[0];

                    this.dockedShapeParent.add(this.docker.parent);

                    // Set the Docker to the new Shape
                    this.docker.setDockedShape(undefined);
                    this.docker.bounds.centerMoveTo(this.position);
                    if (this.dockedShape !== this.facade.getCanvas()) {
                        this.docker.setDockedShape(this.dockedShape);
                    }
                    this.facade.setSelection( [this.docker.parent] );
                }

                this.facade.getCanvas().update();
                this.facade.updateSelection();

            },
            rollback: function(){
                if (this.shape) {
                    this.facade.setSelection(this.selection.without(this.shape));
                    this.facade.deleteShape(this.shape);
                }
                if (this.canAttach && this.docker) {
                    this.docker.setDockedShape(undefined);
                }
                this.facade.getCanvas().update();
                this.facade.updateSelection();

            }
      });

      // Update canvas
      const command = new commandClass(option, dragStateRef.current.dragCurrentParent, canAttach, pos, editorManager.getEditor());
      editorManager.executeCommands([command]);

      // Fire event to all who want to know about this
      const dropEvent = {
          type: FLOWABLE.eventBus.EVENT_TYPE_ITEM_DROPPED,
          droppedItem: item,
          position: pos
      };
      FLOWABLE.eventBus.dispatch(dropEvent.type, dropEvent);
    }
  }

  dragStateRef.current.dragCurrentParent = undefined;
  dragStateRef.current.dragCurrentParentId = undefined;
  dragStateRef.current.dragCurrentParentStencil = undefined;
  dragStateRef.current.dragCanContain = undefined;
  dragStateRef.current.quickMenu = undefined;
  dragStateRef.current.dropTargetElement = undefined;
};


  function overCallback(event) {
    event.preventDefault();
    dragStateRef.current.dragModeOver = true;
  }


  function startDragCallback(event) {
    dragStateRef.current.dragModeOver = false;
    dragStateRef.current.quickMenu = false;

    event.dataTransfer.setData("draggableId", event.target.id);
  }


  function dragCallback(event) {
    if (dragStateRef.current.dragModeOver) {

      const coord = editorManager.eventCoordinatesXY(event.pageX, event.pageY);


        const aShapes = editorManager.getCanvas().getAbstractShapesAtPosition(coord);
        console.log('dragCallback',  aShapes.length);
        if (aShapes.length <= 0) {

            if (event.helper) {
              // $scope.dragCanContain = false;
              dragStateRef.current.dragCanContain = false;
              return false;
            }
        }

        if (aShapes[0] instanceof ORYX.Core.Canvas) {
            editorManager.getCanvas().setHightlightStateBasedOnX(coord.x);
        }

        if (aShapes.length === 1 && aShapes[0] instanceof ORYX.Core.Canvas) {
            const item = getStencilItemById(event.target.id);
            const parentCandidate = aShapes[0];

            if (item.id === 'Lane'
              || item.id === 'BoundaryErrorEvent'
              || item.id === 'BoundaryMessageEvent'
              || item.id === 'BoundarySignalEvent'
              || item.id === 'BoundaryTimerEvent'
              || item.id === 'BoundaryCancelEvent'
              || item.id === 'BoundaryCompensationEvent'
              || item.id === 'EntryCriterion'
            ) {

              dragStateRef.current.dragCanContain = false

              // Show Highlight
              editorManager.handleEvents({
                type: ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,
                highlightId: 'shapeRepo.added',
                elements: [parentCandidate],
                style: ORYX.CONFIG.SELECTION_HIGHLIGHT_STYLE_RECTANGLE,
                color: ORYX.CONFIG.SELECTION_INVALID_COLOR
              });

            } else {
              dragStateRef.current.dragCanContain = true;
              dragStateRef.current.dragCurrentParent = parentCandidate;
              dragStateRef.current.dragCurrentParentId = parentCandidate.id;

              editorManager.handleEvents({
                type: ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,
                highlightId: "shapeRepo.added"
              });
            }

            editorManager.handleEvents({
              type: ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,
              highlightId: "shapeRepo.attached"
            });
            return false;
        }

        const item = getStencilItemById(event.target.id);

        const parentCandidate = aShapes.reverse().find(function (candidate) {
            return (candidate instanceof ORYX.Core.Canvas
                || candidate instanceof ORYX.Core.Node
                || candidate instanceof ORYX.Core.Edge);
        });

        if (!parentCandidate) {
          dragStateRef.current.dragCanContain = false;
          return false;
        }

        if (item.type === "node") {
          // check if the draggable is a boundary event and the parent an Activity
          // eslint-disable-next-line no-underscore-dangle
          let _canContain = false;
          const parentStencilId = parentCandidate.getStencil().id();

          if (dragStateRef.current.dragCurrentParent && dragStateRef.current.dragCurrentParent.id === parentCandidate.id) {
            return false;
          }

          const parentItem = getStencilItemById(parentCandidate.getStencil().idWithoutNs());
          if (parentItem.roles.indexOf('Activity') > -1) {
            if (item.roles.indexOf('IntermediateEventOnActivityBoundary') > -1
              || item.roles.indexOf('EntryCriterionOnItemBoundary') > -1
              || item.roles.indexOf('ExitCriterionOnItemBoundary') > -1) {
              _canContain = true;
            }

          } else if(parentItem.roles.indexOf('StageActivity') > -1) {
            if (item.roles.indexOf('EntryCriterionOnItemBoundary') > -1
              || item.roles.indexOf('ExitCriterionOnItemBoundary') > -1) {
              _canContain = true;
            }

          } else if(parentItem.roles.indexOf('StageModelActivity') > -1) {
            if (item.roles.indexOf('ExitCriterionOnItemBoundary') > -1) {
              _canContain = true;
            }

          } else if (parentCandidate.getStencil().idWithoutNs() === 'Pool') {
            if (item.id === 'Lane') {
              _canContain = true;
            }
          }

          if (_canContain) {
            editorManager.handleEvents({
              type: ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,
              highlightId: "shapeRepo.attached",
              elements: [parentCandidate],
              style: ORYX.CONFIG.SELECTION_HIGHLIGHT_STYLE_RECTANGLE,
              color: ORYX.CONFIG.SELECTION_VALID_COLOR
            });

            editorManager.handleEvents({
              type: ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,
              highlightId: "shapeRepo.added"
            });

          } else {
            for (let i = 0; i < containmentRules.length; i += 1) {
              const rule = containmentRules[i];
              if (rule.role === parentItem.id) {
                for (let j = 0; j < rule.contains.length; j += 1) {
                  if (item.roles.indexOf(rule.contains[j]) > -1) {
                    _canContain = true;
                    break;
                  }
                }

                if (_canContain) {
                  break;
                }
              }
            }

            // Show Highlight
            editorManager.handleEvents({
              type: ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,
              highlightId: 'shapeRepo.added',
              elements: [parentCandidate],
              color: _canContain ? ORYX.CONFIG.SELECTION_VALID_COLOR : ORYX.CONFIG.SELECTION_INVALID_COLOR
            });

            editorManager.handleEvents({
              type: ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,
              highlightId: "shapeRepo.attached"
            });
          }
          dragStateRef.current.dragCurrentParent = parentCandidate;
          dragStateRef.current.dragCurrentParentId = parentCandidate.id;
          dragStateRef.current.dragCurrentParentStencil = parentStencilId;
          dragStateRef.current.dragCanContain = _canContain;
        }
    }
  };

  return (
    <>
      <div className='pageWrapper'>
        {/* 最上边的工具栏 */}
        <ToolbarSection />
        <div className="contentWrapper">
          {/* 左边的节点栏 */}
          <PaletteSection
            className="leftSection"
            dragCallback={dragCallback}
            startDragCallback={startDragCallback}
            stencilItemGroups={stencilItemGroups}
          />
          <div className='rightSection'>
            <div
              id="contentCanvasWrapper"
              className='contentCanvasWrapper'
              onDrop={dropCallback}
              onDragOver={overCallback}
            >

                <div id="canvasHelpWrapper" className="col-xs-12">
                  <div className="canvas-wrapper" id="canvasSection">
                    <div className="canvas-message" id="model-modified-date"></div>
                    <div className="Oryx_button" id="delete-button" style={{ display: 'none'}}>
                      <DeleteIcon />
                    </div>
                    <div className="Oryx_button" id="morph-button" style={{ display: 'none'}}>
                      <SettingIcon />
                    </div>
                    <div className="Oryx_button" id="edit-button" style={{ display: 'none'}}>
                      edit
                    </div>
                    {quickMenuItems.map(item => (
                      <div
                        key={item.id}
                        className="Oryx_button"
                        id={item.id}
                        title={item.description}
                        style={{ display: 'none'}}
                      >
                        {QuickMenuIconMap[item.id]}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            <PropertySection ORYXEDITORLOADED={ORYXEDITORLOADED} />
          </div>
        </div>
      </div>
    </>
  );
}
