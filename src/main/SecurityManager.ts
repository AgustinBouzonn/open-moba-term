import keytar from 'keytar';

export class SecurityManager {
    private serviceName = 'OpenMoba';

    async setPassword(account: string, password: string): Promise<void> {
        try {
            await keytar.setPassword(this.serviceName, account, password);
        } catch (error) {
            console.error(`[SecurityManager] Failed to set password for ${account}:`, error);
        }
    }

    async getPassword(account: string): Promise<string | null> {
        try {
            return await keytar.getPassword(this.serviceName, account);
        } catch (error) {
            console.error(`[SecurityManager] Failed to get password for ${account}:`, error);
            return null;
        }
    }

    async deletePassword(account: string): Promise<void> {
        try {
            await keytar.deletePassword(this.serviceName, account);
        } catch (error) {
            console.error(`[SecurityManager] Failed to delete password for ${account}:`, error);
        }
    }
}

export const securityManager = new SecurityManager();
