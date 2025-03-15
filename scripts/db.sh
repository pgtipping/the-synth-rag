#!/bin/bash

# Load environment variables from .env
set -a
source .env
set +a

# Use the environment variables for database connection
psql -U $PGUSER -d $PGDATABASE -h $PGHOST "$@" 