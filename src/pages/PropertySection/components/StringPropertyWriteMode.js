import React from 'react';
import { Input } from 'antd';

export default ({ property, onSave }) => {
  return (
    <Input
      key={property.value}
      autoFocus
      style={{ width: 200 }}
      defaultValue={property.value}
      onBlur={e => onSave({ ...property, value: e.target.value })}
    />
  );
};
