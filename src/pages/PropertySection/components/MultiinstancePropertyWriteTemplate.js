import React from 'react'
import { Select } from 'antd';

export default function MultiinstancePropertyWriteTemplate({ property, onSave }) {
  return (
    <Select value={property.value} onClick={ev => ev.preventDefault()} onChange={value => onSave({ ...property, value })}>
      <Select.Option value='none'>none</Select.Option>
      <Select.Option value='Parallel'>Parallel</Select.Option>
      <Select.Option value='Sequential'>Sequential</Select.Option>
    </Select>
  );
}
