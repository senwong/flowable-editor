import React from 'react';

import { Switch } from 'antd';

export default function BooleanPropertyTemplate({ property, onSave }) {
  return (
    <Switch
      onClick={(e) => e.stopPropagation()}
      checkedChildren="是"
      unCheckedChildren="否"
      checked={!!property.value}
      onChange={(value) => onSave({ ...property, value })}
    />
  );
}
