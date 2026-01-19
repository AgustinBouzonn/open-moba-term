import Store from 'electron-store';
import { securityManager } from './SecurityManager';

export interface Session {
    id: string;
    label: string;
    description?: string;
    host: string;
    port: number;
    username: string;
    authType: 'password' | 'key' | 'agent';
    privateKeyPath?: string;
    group?: string;
    icon?: string;
    color?: string;
    password?: string; // Kept in memory but stripped before saving to JSON
}

interface StoreSchema {
    sessions: Session[];
}

const store = new Store<StoreSchema>({
    defaults: {
        sessions: []
    }
});

export const sessionStore = {
    getSessions: async (): Promise<Session[]> => {
        const sessions = store.get('sessions');

        // Auto-migration and hydration
        const hydratedSessions = await Promise.all(sessions.map(async (session) => {
            // Migration: Logic to move password from JSON to Keychain
            // If session has a password in JSON, save it to keychain and remove it from object
            if (session.password && session.password.length > 0) {
                console.log(`[Store] Migrating password for session ${session.id} to Keychain`);
                await securityManager.setPassword(session.id, session.password);
                // Remove from local variable to avoid re-saving it later if we save back the store immediately?
                // Actually, we should save the store back without passwords after migration.
            }

            // Hydration: Fetch from Keychain
            const securePass = await securityManager.getPassword(session.id);
            if (securePass) {
                session.password = securePass;
            }
            return session;
        }));

        // Check if any migration happened (any session still had a password in the *source* JSON?)
        // The above mapping modifies the objects in memory if they had passwords.
        // But to be cleaner, we should re-save the store if we found plaintext passwords.
        // However, checking efficiently is tricky without cloning.
        // Let's just strip passwords and save-back if 'sessions' contained passwords.
        // A simple heuristic: if any input session had a password, we save back the stripped version.

        const needsMigrationSave = sessions.some(s => s.password && s.password.length > 0 && !s.privateKeyPath); // Basic check
        if (needsMigrationSave) {
            const cleanSessions = sessions.map(s => {
                const { password, ...rest } = s;
                return rest as Session;
            });
            store.set('sessions', cleanSessions);
        }

        return hydratedSessions;
    },

    saveSession: async (session: Session): Promise<void> => {
        const sessions = store.get('sessions');
        const index = sessions.findIndex(s => s.id === session.id);

        // Security: Save password to Keychain
        if (session.password) {
            await securityManager.setPassword(session.id, session.password);
        }

        // Security: Remove password from the object to be saved in JSON
        const { password, ...sessionToSave } = session;

        if (index !== -1) {
            sessions[index] = sessionToSave as Session;
        } else {
            sessions.push(sessionToSave as Session);
        }

        store.set('sessions', sessions);
    },

    deleteSession: async (id: string): Promise<void> => {
        const sessions = store.get('sessions');
        const filtered = sessions.filter(s => s.id !== id);
        store.set('sessions', filtered);

        // Security: Delete from Keychain
        await securityManager.deletePassword(id);
    }
};
