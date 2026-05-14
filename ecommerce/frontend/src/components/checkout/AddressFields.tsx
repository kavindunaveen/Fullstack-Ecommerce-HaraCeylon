'use client';
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { Country, State, City } from 'country-state-city';

interface AddressFieldsProps {
  prefix?: string; // 'billing' or 'shipping'
  formData: any;
  onChange: (name: string, value: string) => void;
}

const AddressFields: React.FC<AddressFieldsProps> = ({ prefix, formData, onChange }) => {
  const prefixStr = prefix ? `${prefix}_` : '';
  
  // Get all countries once
  const [countries] = useState(() => 
    Country.getAllCountries().map(c => ({ value: c.isoCode, label: c.name }))
  );

  const [states, setStates] = useState<any[]>([]);
  const [cities, setCities] = useState<any[]>([]);

  const countryCode = formData[`${prefixStr}country`];
  const stateCode = formData[`${prefixStr}state`];
  const cityName = formData[`${prefixStr}city`];

  // When country changes, update states
  useEffect(() => {
    if (countryCode) {
      const s = State.getStatesOfCountry(countryCode).map(state => ({
        value: state.isoCode,
        label: state.name
      }));
      setStates(s);
    } else {
      setStates([]);
    }
  }, [countryCode]);

  // When state changes, update cities
  useEffect(() => {
    if (countryCode && stateCode) {
      const c = City.getCitiesOfState(countryCode, stateCode).map(city => ({
        value: city.name,
        label: city.name
      }));
      setCities(c);
    } else {
      setCities([]);
    }
  }, [countryCode, stateCode]);

  const customStyles = {
    control: (base: any) => ({
      ...base,
      borderRadius: '1rem',
      borderColor: '#f3f4f6',
      padding: '8px 12px',
      fontSize: '0.95rem',
      fontWeight: '500',
      backgroundColor: 'white',
      boxShadow: 'none',
      '&:hover': {
        borderColor: '#D4AF37'
      }
    }),
    option: (base: any, state: any) => ({
      ...base,
      backgroundColor: state.isSelected ? '#D4AF37' : state.isFocused ? '#F9F1D8' : 'white',
      color: state.isSelected ? 'white' : '#1a1a1a',
      fontSize: '0.875rem',
      cursor: 'pointer',
      padding: '12px 20px',
      '&:active': {
        backgroundColor: '#D4AF37'
      }
    }),
    placeholder: (base: any) => ({
      ...base,
      color: '#9ca3af'
    }),
    menu: (base: any) => ({
      ...base,
      borderRadius: '1.5rem',
      overflow: 'hidden',
      border: '1px solid #f3f4f6',
      boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
    })
  };

  return (
    <>
      <div className={prefix ? "form-group md:col-span-2" : "md:col-span-1 space-y-3"}>
        <label className={prefix ? "form-label" : "text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] ml-1"}>Country *</label>
        <Select
          options={countries}
          value={countries.find(c => c.value === countryCode)}
          onChange={(val: any) => {
            onChange(`${prefixStr}country`, val?.value || '');
            onChange(`${prefixStr}state`, '');
            onChange(`${prefixStr}city`, '');
          }}
          styles={customStyles}
          placeholder="Select Country..."
          isClearable
        />
      </div>

      <div className={prefix ? "form-group" : "space-y-3"}>
        <label className={prefix ? "form-label" : "text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] ml-1"}>State / County *</label>
        <Select
          options={states}
          value={states.find(s => s.value === stateCode)}
          onChange={(val: any) => {
            onChange(`${prefixStr}state`, val?.value || '');
            onChange(`${prefixStr}city`, '');
          }}
          styles={customStyles}
          placeholder={countryCode ? "Select State..." : "Select Country First"}
          isClearable
          isDisabled={!countryCode}
        />
      </div>

      <div className={prefix ? "form-group" : "space-y-3"}>
        <label className={prefix ? "form-label" : "text-[10px] uppercase font-black text-gray-400 tracking-[0.2em] ml-1"}>City / Town *</label>
        <Select
          options={cities}
          value={cities.find(c => c.value === cityName)}
          onChange={(val: any) => onChange(`${prefixStr}city`, val?.value || '')}
          styles={customStyles}
          placeholder={stateCode ? "Select City..." : "Select State First"}
          isClearable
          isDisabled={!stateCode}
          noOptionsMessage={() => countryCode && stateCode ? "No cities found" : "Select state first"}
        />
      </div>
    </>
  );
};

export default AddressFields;
