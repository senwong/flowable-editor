import React, { useCallback, useRef, useState } from 'react'
import { Collapse } from 'antd';
import './index.css';

const { Panel } = Collapse;

export default function PalletteSection({ className, style, startDragCallback, dragCallback, stencilItemGroups }) {
  return  (
    <div className={className} style={style}>
        <Collapse>
        {stencilItemGroups.map(stencilItemGroup => stencilItemGroup.visible && (
          <Panel key={stencilItemGroup.name} header={stencilItemGroup.name}>
            {
             stencilItemGroup.items.map(item => (
              <p key={item.id} id={item.id}>

                <span className='stencilItem' style={{ backgroundImage: `url(${item.icon})`}} draggable onDrag={dragCallback} onDragStart={startDragCallback} id={item.id} icon={item.icon}>
                  {item.name}
                </span>
              </p>
             ))
            }
          </Panel>
        ))}
        </Collapse>,
    </div>
  );
}
