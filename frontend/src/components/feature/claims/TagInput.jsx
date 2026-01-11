import React, { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'

// TagInput component allows users to add and remove tags dynamically
const TagInput = ({ tags, onSetTags }) => {
    const { t } = useTranslation()
    const [inputValue, setInputValue] = useState('')
    const inputRef = useRef(null) // Reference to the input field

    // Add a new tag if it's not empty and doesn't already exist
    const addTag = (tagText) => {
        const trimmedTag = tagText.trim()

        const capitalizedTag = trimmedTag
            .split(' ')                    // split the string into words
            .map(word => word.charAt(0).toUpperCase() + word.slice(1)) // capitalize first letter
            .join(' ');

        if (capitalizedTag && !tags.includes(capitalizedTag)) {
            onSetTags([...tags, capitalizedTag])
            setInputValue('') // Clear input after adding
        }
    }

    // Remove a tag by its index
    const removeTag = (indexToRemove) => {
        const newTags = tags.filter((_, index) => index !== indexToRemove)
        onSetTags(newTags)
    }

    // Handle key events for adding/removing tags
    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault()
            addTag(inputValue)
        } else
            if (e.key === 'Backspace' && !inputValue && tags.length > 0 && inputRef.current) {
                // If Backspace is pressed and input is empty, remove last tag
                removeTag(tags.length - 1)
            }
    }

    return (
        <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('expenses.tags')}</label>

            {/* Tag container with input and existing tags */}
            <div
                className="flex flex-wrap items-center gap-2 p-2
                border border-gray-300 rounded-lg bg-white min-h-[48px]
                focus-within:border-blue-400 focus-within:ring-2 focus-within:ring-blue-100"
            >

                {/* Render each tag with a remove (×) button */}
                {tags.map((tag, index) => (
                    <span
                        key={index}
                        className="flex items-center gap-1 px-2 py-1 bg-brand-light text-brand-primary rounded-md text-sm font-medium"
                    >
                        {tag}
                        <button
                            type="button"
                            className="text-brand-primary hover:bg-white/50 rounded-sm p-0.5"
                            onClick={(e) => {
                                e.stopPropagation()
                                removeTag(index)
                            }}
                        >
                            ×
                        </button>
                    </span>
                ))}

                {/* Input for typing new tags */}
                <input
                    ref={inputRef}
                    name="tags"
                    type="text"
                    className="flex-grow border-none outline-none bg-transparent text-sm min-w-[120px] placeholder:text-gray-400"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={t('expenses.tagsPlaceholder', 'Type here to add tags...')}
                />
            </div>
        </div>
    )
}

export default TagInput
