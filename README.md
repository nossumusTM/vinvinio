# Vuola Repository Notes

## Syncing with GitHub

The local clone of this repository does not define any Git remotes by default. As a result, new commits only exist in the local `work` branch until a remote such as `origin` is configured and the branch is pushed manually:

```bash
git remote add origin <your-github-url>
git push -u origin work
```

Without adding a remote, updates made in this environment cannot appear on GitHub or Netlify deployments.

You can confirm whether a remote is configured by running `git remote -v`. If the command prints no
entries, add the appropriate GitHub URL as shown above before attempting to push.
