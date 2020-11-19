import React from 'react'
import { Button, Divider } from 'antd';
import { CheckOutlined, CopyOutlined, DeleteOutlined, RedoOutlined, ScissorOutlined, SearchOutlined, UndoOutlined, ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons';
import SaveModelButton from './SaveModelButton';



export default function ToolbarSection() {
  return (
    <div>
      <SaveModelButton />
      <Button icon={<CheckOutlined />} />
      <Divider type='vertical' />
      <Button icon={<ScissorOutlined />} />
      <Button icon={<CopyOutlined />} />
      <Button icon={<DeleteOutlined />} />
      <Divider type='vertical' />
      <Button icon={<RedoOutlined />} />
      <Button icon={<UndoOutlined />} />
      <Divider type='vertical' />
      <Button icon={<ZoomInOutlined />} />
      <Button icon={<ZoomOutOutlined />} />
      <Button icon={<SearchOutlined />} />
    </div>
  );
}
