'use client';

import Select from 'react-select'

import useCountries from '@/app/hooks/useCountries';

export type CountrySelectValue = {
    flag: string;
    label: string;
    latlng: number[],
    region: string;
    value: string
}

interface CountrySelectProps {
    value?: CountrySelectValue;
    onChange: (value: CountrySelectValue) => void;
}

const CountrySelect: React.FC<CountrySelectProps> = ({
    value,
    onChange
}) => {
    const { getAll } = useCountries();

    return (
        <div>
            <Select
                placeholder="Select Country"
                isClearable
                options={getAll()}
                value={value}
                onChange={(value) => onChange(value as CountrySelectValue)}
                formatOptionLabel={(option: any) => (
                    <div className="flex flex-row items-center gap-3 rounded-xl">
                      <div>{option.flag}</div>
                      <div>
                        {option.city ? `${option.city}, ${option.label}` : option.label}
                        <span className="text-neutral-500 ml-1">{option.region}</span>
                      </div>
                    </div>
                  )}
                classNames={{
                    control: () => 'p-3 border-2',
                    input: () => 'text-lg',
                    option: () => 'text-lg'
                }}
                theme={(theme) => ({
                    ...theme,
                    borderRadius: 6,
                    colors: {
                        ...theme.colors,
                        primary: 'black',
                        primary25: '#e2e2e2', // option hover (light gray)
                        neutral0: 'white', // control bg
                        neutral20: '#d4d4d4', // border
                        neutral30: '#a3a3a3', // border hover
                        neutral80: '#000', // text color
                    }
                })}
            />
        </div>
    );
}

export default CountrySelect;