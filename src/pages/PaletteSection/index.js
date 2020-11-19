import React, { useCallback } from 'react'
import { Collapse } from 'antd';
import editorManager from '../EditorManager';

const { Panel } = Collapse;





export default ({ className, style, getStencilItemById, containmentRules, stencilItemGroups }) => {

  function dragCallback(event, ui) {

    if ($scope.dragModeOver != false) {

        const coord = editorManager.eventCoordinatesXY(event.pageX, event.pageY);

        const aShapes = editorManager.getCanvas().getAbstractShapesAtPosition(coord);

        if (aShapes.length <= 0) {
            if (event.helper) {
                $scope.dragCanContain = false;
                return false;
            }
        }

        if (aShapes[0] instanceof ORYX.Core.Canvas) {
            editorManager.getCanvas().setHightlightStateBasedOnX(coord.x);
        }

        if (aShapes.length === 1 && aShapes[0] instanceof ORYX.Core.Canvas) {
            const item = getStencilItemById(event.target.id);
            const parentCandidate = aShapes[0];

            if (item.id === 'Lane' || item.id === 'BoundaryErrorEvent' || item.id === 'BoundaryMessageEvent' ||
                    item.id === 'BoundarySignalEvent' || item.id === 'BoundaryTimerEvent' ||
                    item.id === 'BoundaryCancelEvent' || item.id === 'BoundaryCompensationEvent' ||
                    item.id === 'EntryCriterion') {

                $scope.dragCanContain = false;

                // Show Highlight
                editorManager.handleEvents({
                    type: ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,
                    highlightId: 'shapeRepo.added',
                    elements: [parentCandidate],
                    style: ORYX.CONFIG.SELECTION_HIGHLIGHT_STYLE_RECTANGLE,
                    color: ORYX.CONFIG.SELECTION_INVALID_COLOR
                });

            } else {
                $scope.dragCanContain = true;
                $scope.dragCurrentParent = parentCandidate;
                $scope.dragCurrentParentId = parentCandidate.id;

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
            $scope.dragCanContain = false;
            return false;
        }

        if (item.type === "node") {

            // check if the draggable is a boundary event and the parent an Activity
            // eslint-disable-next-line no-underscore-dangle
            let _canContain = false;
            const parentStencilId = parentCandidate.getStencil().id();

            if ($scope.dragCurrentParentId && $scope.dragCurrentParentId === parentCandidate.id) {
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

            $scope.dragCurrentParent = parentCandidate;
            $scope.dragCurrentParentId = parentCandidate.id;
            $scope.dragCurrentParentStencil = parentStencilId;
            $scope.dragCanContain = _canContain;

        } else  {
          const canvasCandidate = editorManager.getCanvas();
          let canConnect = false;

          const targetStencil = $scope.getStencilItemById(parentCandidate.getStencil().idWithoutNs());
          if (targetStencil) {
            let associationConnect = false;
            if (stencil.idWithoutNs() === 'Association' && (curCan.getStencil().idWithoutNs() === 'TextAnnotation' || curCan.getStencil().idWithoutNs() === 'BoundaryCompensationEvent')) {
                associationConnect = true;
            } else if (stencil.idWithoutNs() === 'DataAssociation' && curCan.getStencil().idWithoutNs() === 'DataStore') {
                  associationConnect = true;
              }

            if (targetStencil.canConnectTo || associationConnect) {
              canConnect = true;
            }
          }

          // Edge
          $scope.dragCurrentParent = canvasCandidate;
          $scope.dragCurrentParentId = canvasCandidate.id;
          $scope.dragCurrentParentStencil = canvasCandidate.getStencil().id();
          $scope.dragCanContain = canConnect;

          // Show Highlight
          editorManager.handleEvents({
                type: ORYX.CONFIG.EVENT_HIGHLIGHT_SHOW,
                highlightId: 'shapeRepo.added',
                elements: [canvasCandidate],
                color: ORYX.CONFIG.SELECTION_VALID_COLOR
          });

          editorManager.handleEvents({
                type: ORYX.CONFIG.EVENT_HIGHLIGHT_HIDE,
                highlightId: "shapeRepo.attached"
          });
      }
    }
  };

  return  (
    <div className={className} style={style}>
        <Collapse>
        {stencilItemGroups.map(stencilItemGroup => stencilItemGroup.visible && (
          <Panel key={stencilItemGroup.name} header={stencilItemGroup.name}>
            {
             stencilItemGroup.items.map(item => (
              <p key={item.id}>{item.name}</p>
             ))
            }
          </Panel>
        ))}
        </Collapse>,
    </div>
  );
}
