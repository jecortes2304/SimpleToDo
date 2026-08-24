import {renderToStaticMarkup} from 'react-dom/server'
import {describe, expect, it, vi} from 'vitest'
import {OAuthProviderButton} from './oauth-provider-button.tsx'

vi.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key: string) => key}),
}))

describe('OAuthProviderButton', () => {
    it('renders the Google login action', () => {
        const html = renderToStaticMarkup(<OAuthProviderButton mode="login"/>)

        expect(html).toContain('auth.continueWithGoogle')
        expect(html).toContain('viewBox="0 0 24 24"')
        expect(html).toContain('type="button"')
    })

    it('renders the Google registration action', () => {
        const html = renderToStaticMarkup(<OAuthProviderButton mode="register"/>)

        expect(html).toContain('auth.signUpWithGoogle')
    })
})
