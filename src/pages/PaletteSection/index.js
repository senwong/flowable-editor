import React, { useCallback, useRef, useState } from 'react'
import { Collapse } from 'antd';

const { Panel } = Collapse;





export default ({ className, style, startDragCallback, dragCallback, stencilItemGroups }) => {


  return  (
    <div className={className} style={style}>
        <Collapse>
        {stencilItemGroups.map(stencilItemGroup => stencilItemGroup.visible && (
          <Panel key={stencilItemGroup.name} header={stencilItemGroup.name}>
            {
             stencilItemGroup.items.map(item => (
              <p draggable onDrag={dragCallback} onDragStart={startDragCallback} key={item.id} id={item.id}>{item.name}</p>
             ))
            }
          </Panel>
        ))}
        </Collapse>,
    </div>
  );
}
