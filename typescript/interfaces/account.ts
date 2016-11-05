/**
 * The representation of an account.
 */
export interface AccountInterface {
    /**
     * The UUID4 id of the account.
     */
    id: string;

    /**
     * The name of the person that owns the account.
     */
    name: string;

    /**
     * The e-mail address of the person that owns the account.
     */
    email_address: string;

    /**
     * The role of the account.
     */
    role: string;

    /**
     * The role of the account.
     */
    status: string;
}
