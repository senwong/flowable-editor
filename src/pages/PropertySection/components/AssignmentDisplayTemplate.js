import React from 'react';

export default function AssignmentDisplayTemplate({ property }) {
  if (!property.value?.assignment) return null;
  if (
    property.value.assignment.type == 'idm' &&
    !property.value.assignment.idm.assignee &&
    !property.value.assignment.idm.assigneeField &&
    (!property.value.assignment.idm.candidateUsers ||
      property.value.assignment.idm.candidateUsers.length == 0) &&
    (!property.value.assignment.idm.candidateUserFields ||
      property.value.assignment.idm.candidateUserFields.length == 0) &&
    (!property.value.assignment.idm.candidateGroups ||
      property.value.assignment.idm.candidateGroups.length == 0) &&
    (!property.value.assignment.idm.candidateGroupFields ||
      property.value.assignment.idm.candidateGroupFields.length == 0)
  ) {
    return '流程发起人';
  }
  if (
    property.value.assignment.type != 'idm' &&
    !property.value.assignment.assignee &&
    (!property.value.assignment.candidateUsers ||
      property.value.assignment.candidateUsers.length == 0) &&
    (!property.value.assignment.candidateGroups ||
      property.value.assignment.candidateGroups.length == 0)
  ) {
    return '没有选择分配人';
  }

  if (
    property.value.assignment.type == 'idm' &&
    property.value.assignment.idm.candidateGroupFields &&
    property.value.assignment.idm.candidateGroupFields.length > 0 &&
    property.value.assignment.idm.candidateGroups &&
    property.value.assignment.idm.candidateGroups.length > 0
  ) {
    const length = property.value.assignment.idm.candidateGroupFields.concat(
      property.value.assignment.idm.candidateGroups,
    ).length;
    return `${length} 候选组`;
  }

  if (
    property.value.assignment.type == 'idm' &&
    property.value.assignment.idm.candidateUserFields &&
    property.value.assignment.idm.candidateUserFields.length > 0 &&
    property.value.assignment.idm.candidateUsers &&
    property.value.assignment.idm.candidateUsers.length > 0
  ) {
    const length = property.value.assignment.idm.candidateUserFields.concat(
      property.value.assignment.idm.candidateUsers,
    ).length;
    return `${length} 候选用户`;
  }

  if (
    property.value.assignment.type == 'idm' &&
    property.value.assignment.idm.candidateGroupFields &&
    property.value.assignment.idm.candidateGroupFields.length > 0 &&
    (!property.value.assignment.idm.candidateGroups ||
      property.value.assignment.idm.candidateGroups.length === 0)
  ) {
    const length = property.value.assignment.idm.candidateGroupField.length;
    return `${length} 候选组`;
  }

  if (
    property.value.assignment.type == 'idm' &&
    property.value.assignment.idm.candidateUserFields &&
    property.value.assignment.idm.candidateUserFields.length > 0 &&
    (!property.value.assignment.idm.candidateUsers ||
      property.value.assignment.idm.candidateUsers.length === 0)
  ) {
    const length = property.value.assignment.idm.candidateUserField.length;
    return `${length} 候选用户`;
  }

  if (
    property.value.assignment.type == 'idm' &&
    property.value.assignment.idm.candidateGroups &&
    property.value.assignment.idm.candidateGroups.length > 0 &&
    (!property.value.assignment.idm.candidateGroupFields ||
      property.value.assignment.idm.candidateGroupFields.length === 0)
  ) {
    return `${property.value.assignment.idm.candidateGroup.length} 候选组`;
  }

  if (
    property.value.assignment.type == 'idm' &&
    property.value.assignment.idm.candidateUsers &&
    property.value.assignment.idm.candidateUsers.length > 0 &&
    (!property.value.assignment.idm.candidateUserFields ||
      property.value.assignment.idm.candidateUserFields.length === 0)
  ) {
    return `${property.value.assignment.idm.candidateUser} 候选用户`;
  }

  if (
    property.value.assignment.type == 'idm' &&
    property.value.assignment.idm.assigneeField &&
    property.value.assignment.idm.assigneeField.id
  ) {
    return `字段 ${property.value.assignment.idm.assigneeField.name}`;
  }

  if (
    property.value.assignment.type == 'idm' &&
    property.value.assignment.idm.assignee &&
    !property.value.assignment.idm.assignee.id
  ) {
    return `用户 ${property.value.assignment.idm.assignee.email}`;
  }

  if (
    property.value.assignment.type == 'idm' &&
    property.value.assignment.idm.assignee &&
    property.value.assignment.idm.assignee.id
  ) {
    const { firstName, lastName } = property.value.assignment.idm.assignee;
    return `用户 ${firstName} ${lastName}`;
  }

  if (
    property.value.assignment.type != 'idm' &&
    property.value.assignment?.candidateGroups?.length > 0
  ) {
    return `${property.value.assignment.candidateGroups.length} 候选组`;
  }

  if (
    property.value.assignment.type != 'idm' &&
    property.value.assignment?.candidateUsers?.length > 0
  ) {
    return `${property.value.assignment.candidateUser.length} 候选用户`;
  }
  if (property.value.assignment.type != 'idm' && property.value.assignment.assignee) {
    return `分配人 ${property.value.assignment.assignee}`;
  }
  return null;
}
