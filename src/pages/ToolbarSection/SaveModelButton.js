import { SaveOutlined } from '@ant-design/icons';
import React, { useState } from 'react'
import { Button, Form,  Input,  Modal} from 'antd';
import EditorManager from '../EditorManager';
import FLOWABLE from '../FLOWABLE';

const labelCol = { span: 4 }

export default function SaveModelButton() {
  const [visible, setVisible] = useState(false);

  const [data, setData] = useState({});

  const [loading, setLoading] = useState(false);

  function handleOk() {

    if (!data.name || data.name.length === 0 ||
      !data.key || data.key.length === 0) {
        return;
    }
    setLoading(true);

    const modelMetaData = EditorManager.getBaseModelData();
    modelMetaData.name = data.name;
    modelMetaData.key = data.key;
    modelMetaData.description = data.description;

    const json = EditorManager.getModel();

    const params = {
        modeltype: modelMetaData.model.modelType,
        json_xml: JSON.stringify(json),
        name: data.name,
        key: data.key,
        description: data.description,
        newversion: data.newVersion,
        comment: data.comment,
        lastUpdated: modelMetaData.lastUpdated
    };
    const body = Object.keys(params)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
      .join('&');

    const url = FLOWABLE.URL.putModel(modelMetaData.modelId);
    const options = {
      method: 'POST',
      body,
      headers: new Headers({
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
      }),
    };
    fetch(url, options)
      .then(res => res.json())
      .then(data => {
        EditorManager.handleEvents({
          type: ORYX.CONFIG.EVENT_SAVED
        });

        // Fire event to all who is listening
        const saveEvent = {
          type: FLOWABLE.eventBus.EVENT_TYPE_MODEL_SAVED,
          model: params,
          modelId: modelMetaData.modelId,
          eventType: 'update-model'
        };
        FLOWABLE.eventBus.dispatch(FLOWABLE.eventBus.EVENT_TYPE_MODEL_SAVED, saveEvent);

        setLoading(false)

      });
  }
  function openModal() {
    setVisible(true);
    const modelMetaData = EditorManager.getBaseModelData();

    let description = '';
    if (modelMetaData.description) {
    	description = modelMetaData.description;
    }

    setData({
    	'name' : modelMetaData.name,
    	'key' : modelMetaData.key,
      'description' : description,
      'newVersion' : false,
      'comment' : ''
    });
  }

  function changeData(key, value) {
    setData(prev => ({ ...prev, [key]: value }));
  }
  return (
    <>
      <Button icon={<SaveOutlined />} onClick={openModal} />
      {visible && (
        <Modal
          visible
          title='保存模型'
          onCancel={() => setVisible(false)}
          onOk={handleOk} confirmLoading={loading}
        >
          <Form.Item labelCol={labelCol} label='名称'>
            <Input
              value={data.name}
              onChange={event => changeData('name', event.target.value)}
            />
          </Form.Item>
          <Form.Item labelCol={labelCol} label='key'>
            <Input
              value={data.key}
              onChange={event => changeData('key', event.target.value)}
            />
          </Form.Item>
          <Form.Item labelCol={labelCol} label='描述'>
            <Input
              value={data.description}
              onChange={event => changeData('description', event.target.value)}
            />
          </Form.Item>
        </Modal>
      )}
    </>
  );
}
