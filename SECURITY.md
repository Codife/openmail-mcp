# Security policy

Please report vulnerabilities privately to the repository security contact rather than opening a public issue. Do not include real provider tokens or email content. Rotate a compromised master key by decrypting each active credential with its recorded key version, re-encrypting with the new key, updating `key_version`, and retaining the old key only until every record is migrated. Revoke affected provider and MCP credentials immediately.
