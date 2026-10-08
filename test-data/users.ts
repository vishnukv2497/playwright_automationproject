export type UserKey =
    | 'standard'
    | 'lockedOut'
    | 'problem'
    | 'performanceGlitch'
    | 'error'
    | 'visual';

export interface SauceUser {
    username: string;
    password: string;
    /** true if logging in lands on /inventory.html. */
    canLogin: boolean;
    /** Error shown on the login page when canLogin is false. */
    loginError?: string;
    /** What to expect from this user after login. */
    expectedBehaviour: string;
}

function requireEnv(name: string): string {
    const value = process.env[name];
    // Azure Pipelines passes "$(NAME)" through literally when the pipeline variable isn't defined.
    if (!value || value === `$(${name})`) {
        throw new Error(`${name} is not set. Locally: copy .env.example to .env and fill it in. In CI: define it as a secret pipeline variable.`);
    }
    return value;
}

const password = requireEnv('SAUCE_PASSWORD');

/** Exact error texts shown on the login page. */
export const loginErrors = {
    lockedOut: 'Epic sadface: Sorry, this user has been locked out.',
    wrongCredentials: 'Epic sadface: Username and password do not match any user in this service',
    usernameRequired: 'Epic sadface: Username is required',
    passwordRequired: 'Epic sadface: Password is required',
} as const;

export const users: Record<UserKey, SauceUser> = {
    standard: {
        username: 'standard_user',
        password,
        canLogin: true,
        expectedBehaviour: 'Normal user with no known issues',
    },
    lockedOut: {
        username: 'locked_out_user',
        password,
        canLogin: false,
        loginError: loginErrors.lockedOut,
        expectedBehaviour: 'Login is blocked with an error message',
    },
    problem: {
        username: 'problem_user',
        password,
        canLogin: true,
        expectedBehaviour: 'Logs in successfully but has UI/functional issues',
    },
    performanceGlitch: {
        username: 'performance_glitch_user',
        password,
        canLogin: true,
        expectedBehaviour: 'Logs in successfully but responds slowly',
    },
    error: {
        username: 'error_user',
        password,
        canLogin: true,
        expectedBehaviour: 'Logs in successfully but triggers errors during cart/checkout actions',
    },
    visual: {
        username: 'visual_user',
        password,
        canLogin: true,
        expectedBehaviour: 'Logs in successfully but has visual layout differences',
    },
};

export interface InvalidLogin {
    scenario: string;
    username: string;
    password: string;
    expectedError: string;
}

/** Login attempts that must be rejected, with the exact error each one shows. */
export const invalidLogins: InvalidLogin[] = [
    {
        scenario: 'locked_out_user',
        username: users.lockedOut.username,
        password: users.lockedOut.password,
        expectedError: loginErrors.lockedOut,
    },
    {
        scenario: 'wrong password',
        username: users.standard.username,
        password: 'wrong_password',
        expectedError: loginErrors.wrongCredentials,
    },
    {
        scenario: 'empty username',
        username: '',
        password: users.standard.password,
        expectedError: loginErrors.usernameRequired,
    },
    {
        scenario: 'empty password',
        username: users.standard.username,
        password: '',
        expectedError: loginErrors.passwordRequired,
    },
];
