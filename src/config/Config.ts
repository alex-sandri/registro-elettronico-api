/**
 * Global configuration options for the API
 */
export class Config
{
    /**
     * The domain used to auto-generate new email addresses.
     * 
     * @see
     * `EMAIL_AUTO_GEN_MODE`
     */
    public static readonly EMAIL_DOMAIN = "example.com";

    /**
     * Pattern for auto-generated email addresses.\
     * If `false` you must specify the email address when creating a new user.
     * 
     * @default
     * false
     * 
     * @example
     * - "first.last": john.doe
     * - "f.last": j.doe
     * - "flast": jdoe
     */
    public static readonly EMAIL_AUTO_GEN_MODE: "first.last" | "f.last" | "flast" | false = false;

    /**
     * The required minimum length for every password added through the API.
     * 
     * @default
     * 8
     */
    public static readonly PASSWORD_MIN_LENGTH = 8;

    /**
     * Represents the duration of a session in seconds.
     * 
     * @default
     * 30 days
     */
    public static readonly SESSION_DURATION = 60 * 60 * 24 * 30;
}