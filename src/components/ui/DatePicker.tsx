'use client';

import { forwardRef } from 'react';
import ReactDatePicker from 'react-datepicker';
import { Input } from './Input';
import { clsx } from 'clsx';
import 'react-datepicker/dist/react-datepicker.css';

interface DatePickerProps {
  selected?: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  className?: string;
  disabled?: boolean;
}

interface CustomInputProps {
  value?: string;
  onClick?: () => void;
  className?: string;
}

const CustomInput = forwardRef<HTMLInputElement, CustomInputProps>(({ value, onClick, className, ...props }, ref) => (
  <Input
    ref={ref}
    value={value}
    onClick={onClick}
    className={className}
    readOnly
    {...props}
  />
));

CustomInput.displayName = 'CustomInput';

export function DatePicker({ selected, onChange, placeholderText, className, disabled }: DatePickerProps) {
  return (
    <ReactDatePicker
      selected={selected}
      onChange={onChange}
      dateFormat="yyyy-MM-dd"
      placeholderText={placeholderText}
      customInput={<CustomInput className={clsx(className)} />}
      disabled={disabled}
      locale="ja"
    />
  );
}