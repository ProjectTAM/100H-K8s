#!/bin/bash
# Update Mkdocs-Material venv
# Default: latest

# Upgrade all requirements
pip list --format=columns \
    | awk 'NR>=3 {print $1}' \
    | xargs python -m pip install --upgrade

# Freeze to requirements.txt
pip freeze > requirements.txt
