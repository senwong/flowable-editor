import React from 'react';
import { Input } from 'antd';

export default ({ property, onSave }) => {
  return (
    <Input
      key={property.value}
      autoFocus
      defaultValue={property.value}
      onBlur={e => onSave({ ...property, value: e.target.value })}
    />
  );
};
