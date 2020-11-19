import React, { useEffect, useState } from 'react';
import { Modal, Form, Switch, Tabs, Select, Input, Button } from 'antd';
import { DeleteOutlined, MinusOutlined, PlusOutlined } from '@ant-design/icons';
import './index.css';


function fetchEditorUsers(filter) {
  if (!filter && filter !== 0) return null;
  return fetch('http://scjoyedu.eicp.net:7180/onestopapi/demo/rest/editor-users?filter=' + filter, {
    method: 'GET'
  }).then(res => res.json());
}

function fetchEditorGroups(filter) {
  if (!filter && filter !== 0) return null;
  return fetch('http://scjoyedu.eicp.net:7180/onestopapi/demo/rest/editor-groups?filter=' + filter, {
    method: 'GET'
  }).then(res => res.json());
}

const { TabPane } = Tabs;

const assignmentOptions = [
  {id: "initiator", title: '分配给流程发起人'},
  {id: "user", title: '分配给单个用户'},
  {id: "users", title: '候选用户'}, // {} candidateUsers
  {id: "groups", title: '候选组'}
];

// 搜索框下的选择list
// TODO virtual list for big long list data
function SelectList({ data,  onClick, labelProp }) {
  if (!data || !Array.isArray(data)) return null;
  return (
    <div style={{ maxHeight: 300, overflow: 'auto' }}>
      {
        data.map(item => <p key={item.id} onClick={() => onClick(item)}>{item[labelProp]}</p>)
      }
    </div>
  );
}


function RemovableList({ data, onRemove, labelProp, placeholder }) {
  if (!data || (Array.isArray(data) && data.length < 1)) return placeholder;
  const dataArray = Array.isArray(data) ? data : [data];
  return dataArray.map(item => (
    <p key={item.id} className='removable-item'>
      <span>{item[labelProp]}</span>
      <Button danger onClick={() => onRemove(item)} shape='circle' icon={<DeleteOutlined />} />
    </p>
  ));
}


// 分配给单个用户
function UserSelect({ assignee, onChange }) {
  const [data, setData] = useState([]);

  function fetchData (filter, event) {
    event.stopPropagation();
    console.log('fetch data', filter)
    const promise = fetchEditorUsers(filter);
    if (promise) {
      promise.then(res => {
        setData(res.data);
      });
    }
  }

  return (
    <>
      <Form.Item label='分配'>
        <RemovableList
          data={assignee}
          labelProp='fullName'
          onRemove={() => onChange()}
          placeholder='未分配经办人'
        />
      </Form.Item>
      <Form.Item label='搜索'>
        <Input.Search onSearch={fetchData} />
        <SelectList data={data} onClick={onChange} labelProp='fullName' />
      </Form.Item>
    </>
  );
}

// 选择用户组
function UsersSelect({ candidateUsers, onChange }) {
  const [data, setData] = useState([]);
  function fetchData (filter) {
    const promise = fetchEditorUsers(filter);
    if (promise) {
      promise.then(res => {
        setData(res.data);
      });
    }
  }


  function addUser(newUser) {
    if (candidateUsers && Array.isArray(candidateUsers) && candidateUsers.some(user => user.id === newUser.id)) {
      return;
    }
    onChange([ ...candidateUsers, newUser ]);
  }

  function removeUser(removedUser) {
    onChange((candidateUsers || []).filter(user => user.id !== removedUser.id));
  }

  return (
    <>
      <Form.Item label='候选用户'>
        <RemovableList
          data={candidateUsers}
          labelProp='fullName'
          onRemove={removeUser}
          placeholder='没有选择候选人'
        />
      </Form.Item>
      <Form.Item label='搜索'>
        <Input.Search onSearch={fetchData} />
        <SelectList data={data} onClick={addUser} labelProp='fullName' />
      </Form.Item>
    </>
  );
}
// 选择候选组
function GroupsSelect({ candidateGroups, onChange }) {
  const [data, setData] = useState([]);
  function fetchData (filter) {
    const promise = fetchEditorGroups(filter);
    if (promise) {
      promise.then(res => {
        setData(res.data);
      });
    }
  }


  function addGroup(newGroup) {
    if (candidateGroups && Array.isArray(candidateGroups) && candidateGroups.some(group => group.id === newGroup.id)) {
      return;
    }
    onChange([ ...(candidateGroups || []), newGroup ]);
  }

  function removeGroup(removedGroup) {
    onChange((candidateGroups || []).filter(group => group.id !== removedGroup.id));
  }

  return (
    <>
      <Form.Item label='候选组'>
        <RemovableList
          data={candidateGroups}
          labelProp='name'
          onRemove={removeGroup}
          placeholder='没有选择候选组'
        />
      </Form.Item>
      <Form.Item label='搜索'>
        <Input.Search onSearch={fetchData} />
        <SelectList data={data} onClick={addGroup} labelProp='name' />
      </Form.Item>
    </>
  );
}

/**
 * 可加减输入框的list
 */
function DynamicList({ data, onChange }) {
  const dataArray = Array.isArray(data) && data.length > 0
    ? data
    : [{
        $$hashKey: Math.random().toString(36).slice(2),
        value: '',
      }];

  function changeItem(value, index) {
    const newUser = { ...dataArray[index], value}
    onChange(
      dataArray
        .slice(0, index)
        .concat(newUser)
        .concat(dataArray.slice(index + 1))
    );
  }

  function removeItem(index) {
    onChange(
      dataArray
        .slice(0, index)
        .concat(dataArray.slice(index + 1))
    );
  }

  function addItem() {
    onChange(
      dataArray.concat({
        $$hashKey: Math.random().toString(36).slice(2),
        value: '',
      })
    );
  }

  const listDom = dataArray.map((user, index) => (
    <div className='dynamic-list__item' key={user.$$hashKey} >
      <Input value={user.value} onChange={(e) => changeItem(e.target.value, index)}  />
      {dataArray.length > 1 && (
        <Button className='dynamic-list__item__btn' shape='circle' danger icon={<MinusOutlined />} onClick={() => removeItem(index)} />
      )}
      {index + 1 === dataArray.length ? (
        <Button className='dynamic-list__item__btn'  shape='circle' icon={<PlusOutlined />} onClick={addItem} />
      ) : <div style={{ flex: '0 0 44px' }} />}
    </div>
  ));
  return (
    <>
    {listDom}
    </>
  );
}

const labelCol = {
  span: 4
}


const isEmptyString = value => value === null || value === undefined || value.trim().length < 1;

function removeStaticEmptyValue(assignment) {
  let { assignee, candidateUsers = [], candidateGroups = [] } = assignment;
  assignee = isEmptyString(assignee) ? undefined : assignee;

  candidateUsers = candidateUsers.filter(user => !isEmptyString(user.value));
  candidateUsers = candidateUsers.length ? candidateUsers : undefined;

  candidateGroups = candidateGroups.filter(group => !isEmptyString(group.value));
  candidateGroups = candidateGroups.length ? candidateGroups : undefined
  return {
    ...assignment,
    assignee,
    candidateUsers,
    candidateGroups,
  };
}

export default function AssignmentWriteTemplate({ property, onSave }) {

  // property.value.assignment
  // if property.value.assignment.type === 'idm',
  //    property.value.assignment.idm ={type: 'user' | 'users' | 'groups', assignee, candidateUsers, candidateGroup }
  // if property.value.assignment.type === 'static' ,
  //    property.value.assignment ={type, assignee, candidateUsers, candidateGroup }
  const [assignment, setAssignment] = useState(() => {
    let initAssignment = {};
    if (property.value !== undefined && property.value !== null
      && property.value.assignment !== undefined
      && property.value.assignment !== null) {
        initAssignment = property.value.assignment;

      if (typeof initAssignment.type === 'undefined') {
        initAssignment = { ...initAssignment, type: 'static' };
      }

    } else {
      initAssignment = {type:'idm'};
    }
    return initAssignment;
  });


  function onTabChange(activeKey) {
    setAssignment(prev => {
      const ret = {
        ...prev,
        type: activeKey
      }
      if (activeKey === 'idm') {
        if (!ret.idm) {
          ret.idm = { type: 'initiator'}
        }
        if (!ret.idm.type) {
          ret.idm = { ...ret.idm, type: 'initiator' };
        }
      }
      return ret;
    });
  }

  function changeIdmType(value) {
    setAssignment(prev => ({
      ...prev,
      idm: {
        ...prev.idm,
        type: value
      },
    }));
  }

  function changeIdmAssignee(assignee) {
    setAssignment(prev => ({
      ...prev,
      idm: {
        ...prev.idm,
        assignee,
      },
    }));
  }

  function changeIdmUsers(candidateUsers) {
    setAssignment(prev => ({
      ...prev,
      idm: {
        ...prev.idm,
        candidateUsers,
      },
    }));
  }

  function changeIdmGroups(candidateGroups) {
    setAssignment(prev => ({
      ...prev,
      idm: {
        ...prev.idm,
        candidateGroups,
      },
    }));
  }

  function getDomByIdmType() {
    const { assignee, type, candidateUsers, candidateGroups, } = assignment.idm || {};
    let dom = null;
    switch(type) {
      case 'initiator':
        dom = null;
        break;
      case 'user':
        dom = <UserSelect assignee={assignee} onChange={changeIdmAssignee} />
        break;
      case 'users':
        dom = <UsersSelect candidateUsers={candidateUsers} onChange={changeIdmUsers} />
        break;
      case 'groups':
        dom = <GroupsSelect candidateGroups={candidateGroups} onChange={changeIdmGroups} />
        break;
      default:
        break;
    }
    return dom;
  }

  function changeStaticAssignee(assignee) {
    setAssignment(prev => ({
      ...prev,
      assignee
    }));
  }
  function changeStaticUsers(candidateUsers) {
    setAssignment(prev => ({
      ...prev,
      candidateUsers
    }));
  }
  function changeStaticGroups(candidateGroups) {
    setAssignment(prev => ({
      ...prev,
      candidateGroups
    }));
  }


  function handleSave(event) {
    event.stopPropagation();
    let newAssignment = { ...assignment };
    if (newAssignment.type === 'static') {
      newAssignment = removeStaticEmptyValue(assignment);
      newAssignment.idm = undefined;
    } else {
      const idm = { ...newAssignment.idm };
      // type: 'user' | 'users' | 'groups', assignee, candidateUsers, candidateGroups
      if (idm.type === 'user') {
        idm.candidateUsers = undefined;
        idm.candidateGroups = undefined;
      } else if (idm.type === 'users') {
        idm.assignee = undefined;
        idm.candidateGroups = undefined;
      } else if (idm.type === 'groups') {
        idm.assignee = undefined;
        idm.candidateUsers = undefined;
      }
      newAssignment.idm = idm;
      newAssignment.assignee = undefined;
      newAssignment.candidateUsers = undefined;
      newAssignment.candidateGroups = undefined;
    }
    onSave({ ...property, value: { assignment: newAssignment }});
  }

  function handleClose(event) {
    event.stopPropagation();
    onSave(property);
  }

  return (
    <Modal visible title="分配" onOk={handleSave} onCancel={handleClose}>
      <Tabs type="card" onChange={onTabChange} activeKey={assignment.type}>
        <TabPane tab="身份存储" key="idm">
          <Form.Item label='分配'>
            <Select value={assignment.idm?.type} onChange={changeIdmType}>
              {assignmentOptions.map(item => <Select.Option value={item.id}>{item.title}</Select.Option>)}
            </Select>
          </Form.Item>
          {getDomByIdmType()}
        </TabPane>
        <TabPane tab="固定值" key="static">
          <Form.Item labelCol={labelCol} label='分配'>
            <Input value={assignment.assignee} onChange={e => changeStaticAssignee(e.target.value)} />
          </Form.Item>
          <Form.Item labelCol={labelCol} label='候选用户'>
            <DynamicList data={assignment.candidateUsers} onChange={changeStaticUsers} />
          </Form.Item>
          <Form.Item labelCol={labelCol} label='候选组'>
            <DynamicList data={assignment.candidateGroups} onChange={changeStaticGroups} />
          </Form.Item>
        </TabPane>
      </Tabs>
      <Form.Item label='允许流程发起人完成任务'>
        <Switch checkedChildren='是' unCheckedChildren='否' />
      </Form.Item>
    </Modal>
  );
}
