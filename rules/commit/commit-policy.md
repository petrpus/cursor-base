# Commit Policy

**Prepare only; apply only on user approval:** The agent must **prepare** commits (propose commit boundaries and messages) and **must not** run `git add` or `git commit`. Present the proposed commits to the user and wait for explicit approval. The user applies the commits (e.g. by running git themselves or by explicitly asking the agent to apply after approval). Do not apply commits without the user having approved the proposal.

Always consult `commit-agent` before recommending final commit boundaries for any non-trivial task.

The commit recommendation must:
- follow verification
- avoid mixed concerns when possible
- describe the real scope of the change
- separate refactor-only work from behavior changes when practical
