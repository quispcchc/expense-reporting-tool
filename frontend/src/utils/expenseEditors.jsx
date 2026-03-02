import React from 'react'
import { InputText } from 'primereact/inputtext'
import { InputNumber } from 'primereact/inputnumber'
import { Dropdown } from 'primereact/dropdown'
import { APP_SETTINGS } from '../config/settings.js'

export const expenseTextEditor = (editorOptions) => (
    <InputText
        type="text"
        value={editorOptions.value || ''}
        onChange={(e) => editorOptions.editorCallback(e.target.value)}
        className="w-full"
    />
)

export const accountNumEditor = (accountNums) => (editorOptions) => (
    <Dropdown
        value={editorOptions.value}
        onChange={(e) => editorOptions.editorCallback(e.target.value)}
        options={accountNums.map((opt) => ({
            label: `${opt.account_number} - ${opt.description}`,
            value: opt.account_number_id,
        }))}
    />
)

export const costCentreEditor = (costCentres) => (editorOptions) => (
    <Dropdown
        value={editorOptions.value}
        onChange={(e) => editorOptions.editorCallback(e.target.value)}
        options={costCentres.map((opt) => ({
            label: `${opt.cost_centre_code} - ${opt.description}`,
            value: opt.cost_centre_id,
        }))}
    />
)

export const currencyInputEditor = (editorOptions) => (
    <InputNumber
        value={editorOptions.value}
        onValueChange={(e) => editorOptions.editorCallback(e.value)}
        mode="currency"
        currency={APP_SETTINGS.currency.code}
        locale={APP_SETTINGS.currency.locale}
        className="w-full"
    />
)

export const dateInputEditor = (editorOptions) => (
    <InputText
        type="date"
        value={editorOptions.value || ''}
        onChange={(e) => editorOptions.editorCallback(e.target.value)}
        className="w-full"
    />
)
