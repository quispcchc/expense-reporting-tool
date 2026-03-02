import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock i18n
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key, fallback) => fallback || key,
        i18n: { changeLanguage: vi.fn() },
    }),
    initReactI18next: { type: '3rdParty', init: vi.fn() },
}))

// Mock API
vi.mock('../../../src/api/api.js', () => ({
    default: { post: vi.fn() },
}))

// Mock showToast
vi.mock('../../../src/utils/helpers.js', () => ({
    showToast: vi.fn(),
}))

import AddNote from '../../../src/components/feature/claims/addNotes/AddNote.jsx'
import api from '../../../src/api/api.js'
import { showToast } from '../../../src/utils/helpers.js'

describe('AddNote – edge cases', () => {
    const mockOnAddNote = vi.fn()
    const mockToastRef = { current: {} }
    const mockClaim = { claim_id: 42 }

    beforeEach(() => {
        vi.clearAllMocks()
    })

    const renderAddNote = () =>
        render(
            <AddNote curClaim={mockClaim} onAddNote={mockOnAddNote} toastRef={mockToastRef} />,
        )

    it('does not call API when submitting empty note', async () => {
        renderAddNote()

        const btn = screen.getByRole('button')
        expect(btn).toBeDisabled()
        expect(api.post).not.toHaveBeenCalled()
    })

    it('calls API with correct payload on valid note submission', async () => {
        api.post.mockResolvedValue({ data: { note_id: 1, noteText: 'Test note' } })
        const user = userEvent.setup()
        renderAddNote()

        const textarea = screen.getByPlaceholderText(/write a note/i)
        await user.type(textarea, 'Test note')
        await user.click(screen.getByRole('button'))

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('notes', {
                noteText: 'Test note',
                claim_id: 42,
            })
        })
    })

    it('clears textarea after successful submission', async () => {
        api.post.mockResolvedValue({ data: { note_id: 1, noteText: 'Test note' } })
        const user = userEvent.setup()
        renderAddNote()

        const textarea = screen.getByPlaceholderText(/write a note/i)
        await user.type(textarea, 'Test note')
        await user.click(screen.getByRole('button'))

        await waitFor(() => {
            expect(textarea).toHaveValue('')
        })
    })

    it('submit button is disabled during submission (loading guard)', async () => {
        api.post.mockImplementation(() => new Promise(() => {}))
        const user = userEvent.setup()
        renderAddNote()

        await user.type(screen.getByPlaceholderText(/write a note/i), 'Test note')
        const btn = screen.getByRole('button')
        await user.click(btn)

        await waitFor(() => {
            expect(btn).toBeDisabled()
        })
    })

    it('only one API call on rapid double-click (loading guard prevents duplicates)', async () => {
        let resolvePost
        api.post.mockImplementation(() => new Promise(resolve => { resolvePost = resolve }))

        const user = userEvent.setup()
        renderAddNote()

        await user.type(screen.getByPlaceholderText(/write a note/i), 'Test note')

        const btn = screen.getByRole('button')

        // Click twice rapidly
        await user.click(btn)
        await user.click(btn)

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledTimes(1)
        })

        await act(async () => { resolvePost({ data: { note_id: 1, noteText: 'Test note' } }) })
    })

    it('submit button re-enables after failed submission', async () => {
        api.post.mockRejectedValue(new Error('Network error'))
        const user = userEvent.setup()
        renderAddNote()

        await user.type(screen.getByPlaceholderText(/write a note/i), 'Test note')
        const btn = screen.getByRole('button')
        await user.click(btn)

        await waitFor(() => {
            expect(btn).not.toBeDisabled()
        })
    })

    it('shows error toast when API call fails', async () => {
        api.post.mockRejectedValue(new Error('Network error'))
        const user = userEvent.setup()
        renderAddNote()

        await user.type(screen.getByPlaceholderText(/write a note/i), 'Test note')
        await user.click(screen.getByRole('button'))

        await waitFor(() => {
            expect(showToast).toHaveBeenCalledWith(
                mockToastRef,
                expect.objectContaining({ severity: 'error' }),
            )
        })
    })

    it('calls onAddNote callback with response data on success', async () => {
        const noteData = { note_id: 5, noteText: 'My note' }
        api.post.mockResolvedValue({ data: noteData })
        const user = userEvent.setup()
        renderAddNote()

        await user.type(screen.getByPlaceholderText(/write a note/i), 'My note')
        await user.click(screen.getByRole('button'))

        await waitFor(() => {
            expect(mockOnAddNote).toHaveBeenCalledWith(noteData)
        })
    })
})
