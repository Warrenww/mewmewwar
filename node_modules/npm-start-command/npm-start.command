#!/usr/bin/env bash

# make a shell script change to the folder in which it is located
cd -- "$(dirname "$BASH_SOURCE")"

if [ -e package.json ]; then
  npm install
  npm start
else
  osascript -e 'tell app "System Events" to display dialog "File package.json not found"'
  echo
fi

