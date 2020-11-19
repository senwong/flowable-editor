const xml = `<?xml version="1.0" encoding="utf-8"?>
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
</config>`;

export default xml;
