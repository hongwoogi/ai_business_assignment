import React from 'react';

interface FilterAccordionProps {
  title: string;
  options: string[];
  isOpen?: boolean;
  selectedOptions: string[];
  onOptionChange: (option: string) => void;
}

const FilterAccordion: React.FC<FilterAccordionProps> = ({ 
  title, 
  options, 
  isOpen = false, 
  selectedOptions,
  onOptionChange
}) => {
  return (
    <details className="flex flex-col border-t border-t-slate-200 py-2 group" open={isOpen}>
      <summary className="flex cursor-pointer items-center justify-between gap-6 py-2 select-none hover:bg-slate-50 px-2 rounded-md transition-colors">
        <p className="text-neutral-dark-gray text-sm font-medium">{title}</p>
        <span className="material-symbols-outlined text-neutral-medium-gray group-open:rotate-180 transition-transform text-xl">
          expand_more
        </span>
      </summary>
      <div className="pl-2 pt-1 pb-2">
        {options.map((option) => (
          <label key={option} className="flex gap-x-3 py-1.5 flex-row items-center cursor-pointer hover:bg-slate-50 rounded-md px-2">
            <input 
              className="h-4 w-4 rounded border-slate-300 bg-transparent text-corporate-blue focus:ring-corporate-blue" 
              type="checkbox"
              checked={selectedOptions.includes(option)}
              onChange={() => onOptionChange(option)}
            />
            <p className="text-neutral-medium-gray text-sm font-normal">{option}</p>
          </label>
        ))}
      </div>
    </details>
  );
};

export default FilterAccordion;