import React from 'react';

interface TitleInputProps {
  title: string;
  onChange: (title: string) => void;
  placeholder?: string;
}

export const TitleInput: React.FC<TitleInputProps> = ({
  title,
  onChange,
  placeholder = "Enter note title..."
}) => {
  return (
    <div className="title-input-container">
      <input
        type="text"
        value={title}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="title-input"
      />
    </div>
  );
};