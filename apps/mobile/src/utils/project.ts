export function getAuditStatusLabel(auditStatus: string) {
  if (auditStatus === 'approved') {
    return '已通过';
  }

  if (auditStatus === 'rejected') {
    return '已驳回';
  }

  return '待审核';
}
