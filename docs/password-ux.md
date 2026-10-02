# Shared password validation

Sign Up and Reset Password use `components/auth/password-fields.tsx` and the authoritative rules in `lib/password-policy.ts`. Registration field validation is shared through `lib/signup-validation.ts`. Account Center's new-password API also imports this same password policy; existing passwords remain usable for sign-in.

Required: at least 10 characters, ASCII uppercase and lowercase letters, a digit, a punctuation/symbol character, no leading/trailing whitespace, and exact confirmation. Empty values fail. The existing Account Center ceiling of 200 characters is consistently enforced and displayed. Internal spaces are allowed but do not count as symbols. Passwords are never trimmed or normalized.

Both forms show live requirement states, confirmation status, independent keyboard-accessible visibility buttons, and a labelled five-level strength meter. Text and icons supplement color. Inputs have explicit labels, descriptions and invalid-state attributes; changing feedback uses polite status announcements.

Strength is estimated locally using zxcvbn-ts with common/English dictionaries and keyboard-pattern recognition. It considers predictable passwords, repetition, sequences, personal inputs and other patterns. Dictionaries load lazily; passwords are not sent to an estimation service. Strength is advice, while the shared policy determines validity. The UI shows a loading/unavailable state instead of inventing a score if the estimator cannot load.

Create Account remains disabled until name, email, Thailand phone, password, confirmation and agreements validate. Server actions repeat that validation. Reset Password additionally requires a server-verified, unused, unexpired token. An expired link disables an open form and provides a new-link action. The server atomically claims the token during the password update, preventing concurrent reuse, and revokes old sessions.

## Verification

The full suite passed **273 tests**, with 16 existing opt-in tests skipped. Production build, TypeScript and focused ESLint checks passed. `scripts/verify-password-ux.mjs` passed **63 browser assertions** on the actual components with offline server-action stubs; no real accounts or emails were created. Screenshots were checked at 320, 768 and 1280 pixels. Backend tests use an isolated PGlite database and the real auth actions.

| Requested check | Evidence |
| --- | --- |
| Sign Up starts disabled | Browser assertion before entering fields |
| Checklist updates while typing | Each missing rule checked on both forms before submission |
| Strength updates dynamically | Common password scored below unpredictable password on both forms |
| Missing uppercase/lowercase/number/symbol | Browser rejects each; direct server calls also reject each |
| Fewer than 10 characters | Browser and server rejection |
| Confirmation mismatch | Live mismatch status and disabled buttons; server rejection |
| Valid Sign Up enables button | All fields and agreements checked; invalidating each disables it again |
| Reset uses identical requirements | Both forms mount the same component and import the same schema |
| Reset starts disabled and requires valid token | Invalid/expired/used tokens tested in server rendering and actions; browser expiry tested |
| Backend bypass protection | Direct sign-up/reset action calls with each invalid password are rejected without changing records |
| Existing authentication/session flow | Legacy sign-in and membership return-route integration tests pass |
| Forgot Password to Reset Password | Real token creation, mocked email capture, reset, session revocation, single-use rejection and subsequent sign-in pass |
| Concurrent reset attempts | Only one request can claim the token |
| Accessibility/responsive behavior | Keyboard toggles, independent visibility, labels/status attributes and no horizontal overflow at all three widths |

Estimator reference: [zxcvbn-ts documentation](https://zxcvbn-ts.github.io/zxcvbn/guide/getting-started/).

A browser smoke check against the actual Next.js production build also passed: signup hydration and lazy strength loading, valid-form enablement, membership return-path preservation, invalid-reset protection, the Forgot Password page, and dashboard-to-sign-in routing. It submitted no forms.

Railway deployment `9f11a6e3-552f-4d39-a58f-3b09444b9e67` completed successfully. Production startup logs confirmed Next.js ready and the existing transactional email worker healthy, with no pending or failed messages reported.
