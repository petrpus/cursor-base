# Security Baseline

Security review should be triggered when changing routes, actions, loaders, auth, permissions, uploads, external integrations, job handlers, or sensitive data flows.

Always review:
- authentication and authorization impact
- input validation and output exposure
- tenant / ownership boundaries
- secret handling
- auditability of sensitive operations
- risky file upload behavior
- unsafe logging of confidential data
