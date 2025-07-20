#!/bin/bash

export GIT_REPOSITORY__URL="$GIT_REPOSITORY__URL"

git clone "$GIT_REPOSITORY__URL" /home/app/output --branch "$GIT_REPOSITORY_BRANCH"

exec node script.js