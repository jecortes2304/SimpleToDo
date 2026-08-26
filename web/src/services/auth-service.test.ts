import {afterEach, describe, expect, it, vi} from 'vitest'

describe('googleOAuthURL', () => {
    afterEach(() => {
        vi.unstubAllEnvs()
        vi.resetModules()
    })

    it('uses the configured API origin without duplicating slashes', async () => {
        vi.stubEnv('VITE_API_BASE_URL', 'https://todo.example.com/')
        const {googleOAuthURL} = await import('./auth-service.ts')

        expect(googleOAuthURL()).toBe('https://todo.example.com/api/v1/auth/oauth/google')
    })
})
