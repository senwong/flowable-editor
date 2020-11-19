import React from 'react';

export default function DefaultValueDisplay({ property }) {
  let dom = null;
  if (!property.noValue) {
    if (property.value != null && property.value.length > 20) {
      dom = '...';
    } else if (property.value) {
      console.log('value ', property.value);
      dom = property.value.slice(0, 20);
    }
  } else {
    dom = '空值';
  }
  return <span>{dom}</span>;
}
