#!/bin/bash

cd /home/glyphic/record-collection/backend || exit 1

# Ensure the script is executable
chmod +x collection_importer.py

# Write cron job to run every day at 3am
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/bin/python3 /home/glyphic/record-collection/backend/collection_importer.py >> /home/glyphic/record-collection/import_log.txt 2>&1") | crontab -

echo "Cron job installed to run collection_importer.py daily at 3am."
