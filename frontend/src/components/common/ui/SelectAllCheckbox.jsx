import React from 'react'

const SelectAllCheckbox = React.forwardRef(({ checked, onChange },ref) => {
    return (
        <input
            type="checkbox"
            checked={checked}
            onChange={onChange}
            ref={ref}
        />
    )
})

export default SelectAllCheckbox;