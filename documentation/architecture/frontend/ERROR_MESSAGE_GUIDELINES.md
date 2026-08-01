# Error Message Guidelines

| Situation | Message |
|---|---|
| Expired session | Your session has expired. Please sign in again. |
| Invalid credentials | Invalid email or password. |
| Forbidden action | You do not have permission to perform this action. |
| Missing record | The requested record could not be found. |
| Conflict | This record has changed. Refresh and try again. |
| Server failure | PropertyOS could not complete the request. Please try again. |
| Network failure | PropertyOS could not connect to the server. Check your connection and try again. |
| Unknown failure | Something went wrong. Please try again. |

## Never Display

- Raw JSON
- Stack traces
- SQL errors
- Tokens or authorization headers
- Internal paths
- Framework exception messages
