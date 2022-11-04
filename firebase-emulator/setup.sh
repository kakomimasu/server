#!/bin/sh

set -e
set -x

curl -sL https://firebase.tools | upgrade=true bash

firebase setup:emulators:database
firebase setup:emulators:firestore
# firebase setup:emulators:storage
# firebase setup:emulators:ui