# Security Policy

## Supported Versions

Security updates are provided for the current `main` branch and the latest
published release.

## Reporting a Vulnerability

Please do not report security vulnerabilities through public GitHub issues.

Report suspected vulnerabilities by emailing security@example.com with:

- A description of the issue and potential impact
- Steps to reproduce, proof-of-concept code, or screenshots if available
- The affected version, commit, endpoint, or component
- Whether the vulnerability has been disclosed anywhere else

We aim to acknowledge reports within 3 business days and provide an initial
assessment within 10 business days. If the issue is confirmed, we will work on a
fix, coordinate disclosure timing with the reporter when appropriate, and credit
the reporter unless they prefer to remain anonymous.

## Security Expectations

- Never commit populated `.env` files, private keys, service-account JSON, API
  tokens, database dumps, or production credentials.
- Server-side API keys must be read from `process.env.*` and must not use a
  `VITE_` prefix.
- User-supplied content must be validated and sanitized before storage or
  rendering.
- Authentication and authorization checks must be enforced server-side for all
  protected APIs.
- Dependencies should be kept current and reviewed for critical or high
  severity vulnerabilities before release.

## Secret Rotation

If a secret is committed or exposed, treat it as compromised. Revoke or rotate
the credential in the issuing service, update deployment secrets, and then
rewrite git history before publishing any cleaned repository.

## Additional Security Notes

Lex Grove uses Firebase Authentication, Firestore security rules, server-side
API validation, CSRF protections for state-changing routes, HTTP security
headers, dependency scanning, and secret scanning as part of the expected
security posture.
