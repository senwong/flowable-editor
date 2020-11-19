import React from 'react';
import { Select } from 'antd';

const options = [
  { label: 'none', value: 'none' },
  { label: 'activity', value: 'activity' },
  { label: 'audit', value: 'audit' },
  { label: 'full', value: 'full' },
];

export default function ProcessHistorylevelPropertyWriteTemplate({ property, onSave }) {
  return (
    <Select
      options={options}
      autoFocus
      defaultOpen
      defaultValue={property.value}
      onClick={(e) => e.stopPropagation()}
      onChange={(value) => onSave({ ...property, value })}
    />
  );
}
