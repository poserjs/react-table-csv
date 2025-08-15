import React, { useState, useEffect, useRef } from 'react';
import { Search } from 'lucide-react';
import styles from '../ReactTableCsv.module.css';

// Dropdown component for multi-select filtering
const FilterDropdown = ({ values, selectedValues, onSelectionChange, onClose }) => {
  const dropdownRef = useRef(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const filteredValues = values.filter(val =>
    val.toString().toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectAll = () => {
    if (selectedValues.size === values.length) {
      onSelectionChange(new Set());
    } else {
      onSelectionChange(new Set(values));
    }
  };

  return (
    <div ref={dropdownRef} className={styles.dropdown}>
      <div className={styles.dropdownHeader}>
        <div className={styles.searchWrapper}>
          <Search size={16} className={styles.searchIcon} />
          <input
            type="text"
            placeholder="Search values..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      </div>

      <div className={styles.dropdownSelectAll}>
        <button onClick={handleSelectAll} className={styles.selectAllButton}>
          <span>Select All</span>
          <span className={styles.counter}>{selectedValues.size}/{values.length}</span>
        </button>
      </div>

      <div className={styles.dropdownList}>
        {filteredValues.length === 0 ? (
          <div className={styles.emptyState}>No matches found</div>
        ) : (
          filteredValues.map(value => (
            <label key={value} className={styles.dropdownItem} onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={selectedValues.has(value)}
                onChange={(e) => {
                  const newSelection = new Set(selectedValues);
                  if (e.target.checked) {
                    newSelection.add(value);
                  } else {
                    newSelection.delete(value);
                  }
                  onSelectionChange(newSelection);
                }}
                className={styles.checkbox}
              />
              <span className={styles.valueText} title={value}>
                {value}
              </span>
            </label>
          ))
        )}
      </div>

      <div className={styles.dropdownFooter}>
        <button onClick={onClose} className={styles.applyButton}>
          Apply Filter
        </button>
      </div>
    </div>
  );
};

export default FilterDropdown;
