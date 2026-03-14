# /open-app

Safely restore the local dev runtime and open the main application homepage.

## Required workflow
1. use `dev-runtime`
2. run `bash .cursor/local/bin/status.sh`
3. if the stack is down or unhealthy, run `bash .cursor/local/bin/restart.sh`
4. if app startup still looks unhealthy, inspect `bash .cursor/local/bin/logs.sh app`
5. once healthy, open the application homepage route

## Output
Report:
- runtime status before action
- whether restart was needed
- any app-log findings
- the route that was opened
