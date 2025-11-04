// 'use client';

// import Select from 'react-select'

// import useCountries from '@/app/hooks/useCountries';

// export type CountrySelectValue = {
//     flag: string;
//     label: string;
//     latlng: number[],
//     region: string;
//     value: string
// }

// interface CountrySelectProps {
//     value?: CountrySelectValue;
//     onChange: (value: CountrySelectValue) => void;
// }

// const CountrySelect: React.FC<CountrySelectProps> = ({
//     value,
//     onChange
// }) => {
//     const { getAll } = useCountries();

//     return (
//         <div>
//             <Select
//                 placeholder="Select Country"
//                 isClearable
//                 options={getAll()}
//                 value={value}
//                 onChange={(value) => onChange(value as CountrySelectValue)}
//                 formatOptionLabel={(option: any) => (
//                     <div className="flex flex-row items-center gap-3 rounded-3xl">
//                       <div>{option.flag}</div>
//                       <div>
//                         {option.city ? `${option.city}, ${option.label}` : option.label}
//                         <span className="text-neutral-500 ml-1">{option.region}</span>
//                       </div>
//                     </div>
//                   )}
//                 classNames={{
//                     control: () => 'p-3 border-2',
//                     input: () => 'text-lg',
//                     option: () => 'text-lg'
//                 }}
//                 theme={(theme) => ({
//                     ...theme,
//                     borderRadius: 6,
//                     colors: {
//                         ...theme.colors,
//                         primary: 'black',
//                         primary25: '#e2e2e2', // option hover (light gray)
//                         neutral0: 'white', // control bg
//                         neutral20: '#d4d4d4', // border
//                         neutral30: '#a3a3a3', // border hover
//                         neutral80: '#000', // text color
//                     }
//                 })}
//             />
//         </div>
//     );
// }

// export default CountrySelect;

'use client';

import Select from 'react-select';
import useCountries from '@/app/(marketplace)/hooks/useCountries';
import Image from 'next/image';

export type CountrySelectValue = {
  flag: string;
  label: string;
  latlng: number[];
  region: string;
  value: string;
  city?: string;
};

interface CountrySelectProps {
  value?: CountrySelectValue;
  onChange: (value: CountrySelectValue) => void;
}

const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
}) => {
    const { getAll, getPopularCities } = useCountries();

  return (
    <div>
      <Select
        placeholder="Select Country"
        isClearable
        isSearchable
        options={[...getPopularCities(), ...getAll()].sort((a, b) => a.label.toLowerCase().localeCompare(b.label.toLowerCase()))}
        value={value}
        // onChange={(value) => onChange(value as CountrySelectValue)}
        onChange={(value, actionMeta) => {
            if (actionMeta.action === 'clear') {
              onChange(undefined as unknown as CountrySelectValue); // Reset to undefined
              setTimeout(() => {
                const control = document.querySelector('.react-select__control') as HTMLElement;
                control?.click(); // Reopen dropdown if needed
              }, 0);
              return;
            }
          
            onChange(value as CountrySelectValue);
          }}
          
          formatOptionLabel={(option: any) => {
            if (!option || !option.value) return null;
          
            const countryCode = option.value.includes('-')
              ? option.value.split('-').pop()?.toLowerCase()
              : option.value.toLowerCase();
          
            return (
              <div className="flex flex-row items-center gap-3 rounded-3xl">
                <Image
                  src={`/flags/${countryCode}.svg`}
                  alt={option.label}
                  width={24}
                  height={16}
                  style={{ height: 'auto', width: '24px' }}
                  className="rounded-md object-contain"
                />
                <div>
                  {option.city ? `${option.city}, ${option.label}` : option.label}
                  <span className="text-neutral-500 ml-1">{option.region}</span>
                </div>
              </div>
            );
          }}
          
        classNames={{
          control: () => 'p-3 border-2',
          input: () => 'text-lg',
          option: () => 'text-lg',
        }}
        theme={(theme) => ({
          ...theme,
          borderRadius: 6,
          colors: {
            ...theme.colors,
            primary: 'black',
            primary25: '#e2e2e2',
            neutral0: 'white',
            neutral20: '#d4d4d4',
            neutral30: '#a3a3a3',
            neutral80: '#000',
          },
        })}
        getOptionLabel={(e) =>
          e.city ? `${e.city}, ${e.label}` : e.label
        }
      />
    </div>
  );
};

export default CountrySelect;
