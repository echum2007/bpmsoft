---
title: "CC Address Normalization in UsrCcAddressResolver"
aliases: [cc-normalization, merge-addresses, cc-bug, copyrecepient-parsing]
tags: [bpmsoft, c-sharp, cc-notifications, gotcha, bug]
sources:
  - "daily/2026-04-08.md"
created: 2026-04-16
updated: 2026-04-16
---

# CC Address Normalization in UsrCcAddressResolver

BPMSoft's incoming email parser saves CC addresses in `email <email>` format (display name + angle-bracket email). The custom `UsrCcAddressResolver.MergeAddresses` method must strip angle-bracket tokens and filter non-address tokens to avoid storing duplicates or malformed values.

## Key Points

- Incoming email headers often produce `email <email>` tokens — the raw email address appears twice, once bare and once inside `<>`
- Splitting a raw CC string by space without normalization creates duplicate and malformed entries
- Tokens containing `<` or `>` must be stripped; tokens without `@` must be skipped entirely
- The correct address separator stored in the `CopyRecepient` (sic) field is semicolon-space (`; `) — `string.Join("; ", ...)`
- The JS-side CC field validator must split on `[\s;,]+` (not just `[;,]`) to handle space-separated addresses from the C# side

## Details

The bug was triggered when a reply arrived with CC recipients. BPMSoft's email adapter extracted the CC header and passed it to `UsrCcAddressResolver.MergeAddresses`. The method split the raw string by space (`Split(' ')`) and appended each token as a separate address. Because the header format was `user@example.com <user@example.com>`, this produced two tokens per recipient: the bare email and `<user@example.com>`. Both were stored, causing duplicates and a JS validation error (the `<>` characters failing the email regex).

The fix applies two normalization rules in `MergeAddresses`:
1. Strip `<` and `>` from every token
2. Skip tokens that do not contain `@` (they are display-name fragments or other non-address text)

After normalization, addresses are joined with `"; "` (semicolon + space) before being written to `CopyRecepient`. This is consistent with BPMSoft's standard email field convention.

On the frontend, the CC field validator was also corrected to split on `[\s;,]+` instead of `[;,]`. The original regex missed space as a delimiter, so pasted or auto-populated addresses separated by spaces were treated as one large invalid token rather than individual valid emails.

The fix was deployed to production on 2026-04-16; verification was expected 2026-04-17.

## Related Concepts

- [[concepts/cc-field-duality]] — which CC field this normalization applies to (case-level vs reply-level)
- [[concepts/labor-records-design-decisions]] — another project where data integrity at the boundary was a focus

## Sources

- [[daily/2026-04-08.md]] — Two bugs identified and fixed: `MergeAddresses` splitting by space without stripping `<>` tokens; JS validator splitting only on `[;,]` missing space separator. Deployed 2026-04-16.
