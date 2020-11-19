import React, { useState } from 'react';
import { Modal, Input } from 'antd';

const { TextArea } = Input;

export default function TextPropertyWriteTemplate({ property, onSave }) {
  const [value, setValue] = useState(property.value);
  return (
    <>
      <span>{property.value}</span>
      <Modal
        visible
        title="修改"
        onOk={e => {e.stopPropagation(); onSave({ ...property, value });}}
        onCancel={e => {e.stopPropagation(); onSave(property);}}
      >
        <TextArea
          allowClear
          rows={8}
          onChange={(e) => setValue(e.target.value)}
          value={value}
        />
      </Modal>
    </>
  );
}
