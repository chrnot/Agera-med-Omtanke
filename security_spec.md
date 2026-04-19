# Security Specification - Agera med Omtanke

## Data Invariants
1. A Case must always have a valid `schoolId` and `reporterUid`.
2. A Case cannot be updated to a terminal status ('avslutat') without a validation of all required investigation fields.
3. Access to a Case is hierarchical: Global Admin > Authority Admin > Principal > Investigator > Reporter.
4. PII (student names/SSN) must be protected.

## The "Dirty Dozen" Payloads (Anti-Patterns to Reject)
1. **Identity Spoofing**: Creating a case with a `reporterUid` that is not the current user's UID.
2. **Privilege Escalation**: A 'staff' user attempting to set themselves as 'principal' in their user document.
3. **Draft Bypass**: Updating a case status directly to 'avslutat' without going through 'utredning'.
4. **Orphaned Write**: Creating a case with a `schoolId` that doesn't exist.
5. **Ghost Field Injection**: Adding an `isAdmin: true` field to a Case document.
6. **Shadow Update**: Changing the `reporterUid` of an existing case to take ownership.
7. **Cross-School Leak**: A Principal from School A trying to list/read cases from School B.
8. **PII Scraping**: A logged-in user trying to list all user emails/names via the `/users` collection.
9. **Audit Tampering**: Deleting or modifying logs in `/cases/{caseId}/audit`.
10. **Notification Hijack**: Reading or deleting notifications belonging to another `recipientUid`.
11. **SLA Shortcut**: Modifying `createdAt` or `investigationStartedAt` to hide SLA breaches.
12. **Anonymous Over-reach**: An 'anonymous' reporter trying to read any document in the system.

## Test Strategy (Verification)
Validation rules will be implemented in `firestore.rules`. The service layer will enforce these by scoping queries to prevent blanket rejections for non-admin users.
