# GitHub publication

The intended repository name is `combat-robot-arena` under the user's GitHub account.
Use a private repository unless the user explicitly requests public visibility.
Do not place this game in an unrelated repository, such as another project's repository.

## Source and release layout

Commit source, public assets, tests, lockfile, launchers, documentation and prompts.
Keep generated `node_modules`, `runtime` and `dist` out of normal Git commits.
Attach the complete offline ZIP to a GitHub Release. That release supplies everything needed for disconnected play and builds.
Do not use GitHub Pages as a replacement for the requested offline package.

## Publish from Windows

Install Git and GitHub CLI before using the helper. These publication tools are not needed to play the game.
Sign in with GitHub CLI through its normal secure flow. Do not paste a token into project files or prompts.
Then run PowerShell from this folder:

```powershell
.\PUBLISH-GITHUB.ps1 -ZipPath "C:\path\Combat_Robot_Arena_Offline_Codex.zip"
```

The helper creates a private repository, commits source and attaches the ZIP to a new dated release.
It stops when a repository name exists without a matching local remote. It never force-pushes.
Review the exact repository name and current diff before running it.
Use `-Public` only after an explicit decision to expose the project and included assets.

## Manual equivalent

1. Create a private empty repository for this project.
2. Initialize Git in this folder if needed. Review `.gitignore`.
3. Add and commit the source files.
4. Add the new repository as `origin`.
5. Push the branch without force.
6. Create a release and upload the full offline ZIP as its asset.
7. Verify the repository file tree and download the release ZIP once.

Do not commit credentials, environment files, browser profiles or an unrelated project's source.
The ZIP integrity manifest covers its included files. The final ZIP SHA-256 belongs beside the download, not inside itself.
