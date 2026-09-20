@ECHO OFF
SETLOCAL

SET "NODE_ROOT=%LOCALAPPDATA%\Temp\vex-node"
SET "NODE_EXE=%NODE_ROOT%\node.exe"
SET "NPM_CLI=%NODE_ROOT%\package\bin\npm-cli.js"

IF NOT EXIST "%NODE_EXE%" (
  SET "NODE_ROOT=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
  SET "NODE_EXE=%NODE_ROOT%\node.exe"
  SET "NPM_CLI=%NODE_ROOT%\node_modules\npm\bin\npm-cli.js"
)

IF NOT EXIST "%NODE_EXE%" (
  ECHO Node was not found. Install Node.js or ask Codex to reinstall the portable runtime.
  EXIT /B 1
)

IF NOT EXIST "%NPM_CLI%" (
  ECHO npm was not found next to the local Node runtime.
  EXIT /B 1
)

SET "NPM_SHIM_DIR=%TEMP%\vex-npm-shim"
IF NOT EXIST "%NPM_SHIM_DIR%" (
  MKDIR "%NPM_SHIM_DIR%"
)

(
  ECHO @ECHO OFF
  ECHO "%NODE_EXE%" "%NPM_CLI%" %%*
) > "%NPM_SHIM_DIR%\npm.cmd"

SET "PATH=%NPM_SHIM_DIR%;%NODE_ROOT%;%PATH%"
"%NODE_EXE%" "%NPM_CLI%" %*
