import {renderToStaticMarkup} from 'react-dom/server';
import {describe, expect, it, vi} from 'vitest';
import EditUserModal from './edit-user-modal.tsx';

vi.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key: string) => key}),
}));

describe('EditUserModal', () => {
    it('allows avatar and password changes without exposing an email input', () => {
        const html = renderToStaticMarkup(
            <EditUserModal
                user={{
                    id: 7,
                    firstName: 'Ada',
                    lastName: 'Lovelace',
                    email: 'immutable@example.com',
                    username: 'ada',
                    role: 'USER',
                }}
                saving={false}
                onClose={() => undefined}
                onSubmit={async () => undefined}
            />,
        );

        expect(html).not.toContain('type="email"');
        expect(html).not.toContain('immutable@example.com');
        expect(html).toContain('type="file"');
        expect(html.match(/type="password"/g)).toHaveLength(2);
    });
});

