import React, { useCallback, useEffect, useRef, useState } from 'react';
import editorManager from '../EditorManager';
import $rootScope from '../rootScope.js';
import FLOWABLE from '../FLOWABLE';
import PropertyValue from './PropertyValue';
import { Form, Collapse, Row, Col } from 'antd';

const { Panel } = Collapse;

export default function PropertySection({ ORYXEDITORLOADED }) {
  const [selectedItem, setSelectedItem] = useState({});
  const previousSelectedShapeRef = useRef();
  const selectedShapeRef = useRef();

  console.log('selectedItem ', selectedItem);

  useEffect(() => {
    if (!ORYXEDITORLOADED) {
      return;
    }
    /*
     * Listen to selection change events: show properties
     */
    function handleSelectedChange(event) {
      let shapes = event.elements;
      let canvasSelected = false;
      if (shapes && shapes.length === 0) {
        shapes = [editorManager.getCanvas()];
        canvasSelected = true;
      }
      if (shapes && shapes.length > 0) {
        const selectedShape = shapes.first();
        const stencil = selectedShape.getStencil();
        console.log('selectedShape ', selectedShape);
        if (
          $rootScope.selectedElementBeforeScrolling &&
          stencil.id().indexOf('BPMNDiagram') !== -1 &&
          stencil.id().indexOf('CMMNDiagram') !== -1 &&
          stencil.id().indexOf('DMNDiagram') !== -1
        ) {
          // ignore canvas event because of empty selection when scrolling stops
          return;
        }

        if (
          $rootScope.selectedElementBeforeScrolling &&
          $rootScope.selectedElementBeforeScrolling.getId() === selectedShape.getId()
        ) {
          $rootScope.selectedElementBeforeScrolling = null;
          return;
        }

        // Store previous selection
        previousSelectedShapeRef.current = selectedShapeRef.current;

        // Only do something if another element is selected (Oryx fires this event multiple times)
        if (
          previousSelectedShapeRef.current !== undefined &&
          previousSelectedShapeRef.current.getId() === selectedShape.getId()
        ) {
          if ($rootScope.forceSelectionRefresh) {
            // Switch the flag again, this run will force refresh
            $rootScope.forceSelectionRefresh = false;
          } else {
            // Selected the same element again, no need to update anything
            return;
          }
        }

        let selectedItem = { title: '', properties: [] };

        const modelData = editorManager.getBaseModelData();

        if (canvasSelected) {
          selectedItem.auditData = {
            author: modelData.createdByUser,
            createDate: modelData.createDate,
          };
        }

        // Gather properties of selected item
        const properties = stencil.properties();
        for (let i = 0; i < properties.length; i++) {
          const property = properties[i];
          if (property.popular() == false) continue;
          const key = property.prefix() + '-' + property.id();

          if (key === 'oryx-name') {
            selectedItem.title = selectedShape.properties.get(key);
          }

          // First we check if there is a config for 'key-type' and then for 'type' alone
          const propertyConfig = FLOWABLE.PROPERTY_CONFIG[key + '-' + property.type()];
          if (propertyConfig === undefined || propertyConfig === null) {
            propertyConfig = FLOWABLE.PROPERTY_CONFIG[property.type()];
          }

          if (propertyConfig === undefined || propertyConfig === null) {
            console.log(
              'WARNING: no property configuration defined for ' +
                key +
                ' of type ' +
                property.type(),
            );
          } else {
            if (selectedShape.properties.get(key) === 'true') {
              selectedShape.properties.set(key, true);
            }

            if (FLOWABLE.UI_CONFIG.showRemovedProperties == false && property.isHidden()) {
              continue;
            }

            const currentProperty = {
              key: key,
              title: property.title(),
              description: property.description(),
              type: property.type(),
              mode: 'read',
              readonly: property.readonly(),
              hidden: property.isHidden(),
              value: selectedShape.properties.get(key),
            };

            if (
              (currentProperty.type === 'complex' || currentProperty.type === 'multiplecomplex') &&
              currentProperty.value &&
              currentProperty.value.length > 0
            ) {
              try {
                currentProperty.value = JSON.parse(currentProperty.value);
              } catch (err) {
                // ignore
              }
            }

            if (
              propertyConfig.readModeTemplateUrl !== undefined &&
              propertyConfig.readModeTemplateUrl !== null
            ) {
              currentProperty.readModeTemplateUrl = propertyConfig.readModeTemplateUrl;
            }
            if (
              propertyConfig.writeModeTemplateUrl !== undefined &&
              propertyConfig.writeModeTemplateUrl !== null
            ) {
              currentProperty.writeModeTemplateUrl = propertyConfig.writeModeTemplateUrl;
            }
            if (
              (currentProperty.readonly &&
                propertyConfig.templateUrl !== undefined &&
                propertyConfig.templateUrl !== null) ||
              (currentProperty.readonly === undefined &&
                propertyConfig.templateUrl !== undefined &&
                propertyConfig.templateUrl !== null)
            ) {
              currentProperty.templateUrl =
                propertyConfig.templateUrl + '?version=' + $rootScope.staticIncludeVersion;
              currentProperty.hasReadWriteMode = false;
            } else {
              currentProperty.hasReadWriteMode = true;
            }

            if (
              currentProperty.value === undefined ||
              currentProperty.value === null ||
              currentProperty.value.length == 0
            ) {
              currentProperty.noValue = true;
            }

            selectedItem.properties.push(currentProperty);
          }
        }

        setSelectedItem(selectedItem);
        selectedShapeRef.current = selectedShape;
      } else {
        setSelectedItem({});
        selectedShapeRef.current = null;
      }
    }
    editorManager.registerOnEvent(ORYX.CONFIG.EVENT_SELECTION_CHANGED, handleSelectedChange);
    return () => {
      editorManager.unregisterOnEvent(ORYX.CONFIG.EVENT_SELECTION_CHANGED, handleSelectedChange);
    };
  }, [ORYXEDITORLOADED]);


  /* Click handler for clicking a property */
  const propertyClicked = useCallback((index) => {

    setSelectedItem((prev) => {
      if (!prev.properties[index].hidden) {
        const newP = { ...prev.properties[index], mode: 'write' };
        return {
          ...prev,
          properties: prev.properties
            .slice(0, index)
            .concat(newP)
            .concat(prev.properties.slice(index + 1)),
        };
      }
      return prev;
    });
  }, []);

  /* Method available to all sub controllers (for property controllers) to update the internal Oryx model */
  const updatePropertyInModel = useCallback((oldProperty, shapeId) => {
    const property = { ...oldProperty };
    let shape = selectedShapeRef.current;
    // Some updates may happen when selected shape is already changed, so when an additional
    // shapeId is supplied, we need to make sure the correct shape is updated (current or previous)
    if (shapeId) {
      if (
        shape.id !== shapeId &&
        previousSelectedShapeRef.current &&
        previousSelectedShapeRef.current.id === shapeId
      ) {
        shape = previousSelectedShapeRef.current;
      } else {
        shape = null;
      }
    }

    if (!shape) {
      // When no shape is selected, or no shape is found for the alternative
      // shape ID, do nothing
      return;
    }
    const { key } = property;
    const newValue = property.value;
    const oldValue = shape.properties.get(key);

    if (newValue !== oldValue) {
      const CommandClass = ORYX.Core.Command.extend({
        construct: function () {
          this.key = key;
          this.oldValue = oldValue;
          this.newValue = newValue;
          this.shape = shape;
          this.facade = editorManager.getEditor();
        },
        execute: function () {
          this.shape.setProperty(this.key, this.newValue);
          this.facade.getCanvas().update();
          this.facade.updateSelection();
        },
        rollback: function () {
          this.shape.setProperty(this.key, this.oldValue);
          this.facade.getCanvas().update();
          this.facade.updateSelection();
        },
      });
      // Instantiate the class
      const command = new CommandClass();

      // Execute the command
      editorManager.executeCommands([command]);
      editorManager.handleEvents({
        type: ORYX.CONFIG.EVENT_PROPWINDOW_PROP_CHANGED,
        elements: [shape],
        key: key,
      });

      // Switch the property back to read mode, now the update is done
      property.mode = 'read';

      // Fire event to all who is interested
      // Fire event to all who want to know about this
      const event = {
        type: FLOWABLE.eventBus.EVENT_TYPE_PROPERTY_VALUE_CHANGED,
        property: property,
        oldValue: oldValue,
        newValue: newValue,
      };
      FLOWABLE.eventBus.dispatch(event.type, event);
    } else {
      // Switch the property back to read mode, no update was needed
      property.mode = 'read';
    }
  }, [selectedShapeRef.current]);

  function onSaveProperty(property, index) {
    console.log('onSaveProperty', property);
    updatePropertyInModel(property);
    setSelectedItem((prev) => {
      if (!prev.properties[index].hidden) {
        const newP = {
          ...prev.properties[index],
          ...property,
          mode: 'read',
        };
        newP.noValue = !property.value && property.value !== 0;
        return {
          ...prev,
          properties: prev.properties
            .slice(0, index)
            .concat(newP)
            .concat(prev.properties.slice(index + 1)),
        };
      }
      return prev;
    });
  }

  const titleDom = (
    <>
      {selectedItem.title !== undefined &&
        selectedItem.title != null &&
        selectedItem.title.length > 0 && <span>{selectedItem.title}</span>}
      {(!selectedItem ||
        selectedItem.title === undefined ||
        selectedItem.title == null ||
        selectedItem.title.length === 0) && <span>{editorManager.getBaseModelData()?.name}</span>}
    </>
  );
  return (
    <Collapse className="propertySection" defaultActiveKey={['1']}>
      <Panel header={titleDom} key="1">
        <Row gutter={[24, 0]} className="propertySection_body">
          {(selectedItem?.properties || []).map((property, index) => (
            <Col
              key={property.key}
              xs={{ span: 24 }}
              sm={{ span: 24 }}
              md={{ span: 12 }}
              lg={{ span: 12 }}
              xl={{ span: 8 }}
              xxl={{ span: 8 }}
            >
              <Form.Item
                onClick={() => propertyClicked(index)}
                label={property.title + (property.hidden ? '(已删除)' : '')}
              >
                <PropertyValue
                  key={property.id}
                  property={property}
                  onSave={(p) => onSaveProperty(p, index)}
                />
              </Form.Item>
            </Col>
          ))}
        </Row>
      </Panel>
    </Collapse>
  );
}
