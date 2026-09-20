@ECHO OFF
SETLOCAL

SET "DOCKER_BIN=%LOCALAPPDATA%\Programs\DockerDesktop\resources\bin"
IF EXIST "%DOCKER_BIN%\docker.exe" (
  SET "PATH=%DOCKER_BIN%;%PATH%"
)

CALL "%~dp0npm-local.cmd" run local
