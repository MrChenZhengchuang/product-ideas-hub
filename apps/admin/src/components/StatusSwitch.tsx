import { Switch } from 'antd';

type StatusSwitchProps = {
  checked?: boolean;
  checkedLabel: string;
  uncheckedLabel: string;
  disabled?: boolean;
  loading?: boolean;
  size?: 'small' | 'default';
  onChange?: (checked: boolean) => void;
};

export function StatusSwitch({
  checked = false,
  checkedLabel,
  uncheckedLabel,
  disabled,
  loading,
  size = 'default',
  onChange
}: StatusSwitchProps) {
  return (
    <Switch
      checked={checked}
      checkedChildren={checkedLabel}
      unCheckedChildren={uncheckedLabel}
      disabled={disabled}
      loading={loading}
      size={size}
      onChange={onChange}
    />
  );
}
