import os

# handler.py reads TABLE_NAME and creates a boto3 client when it's imported.
# Dummy values let the tests import it; nothing here talks to AWS.
os.environ.setdefault("TABLE_NAME", "test-table")
os.environ.setdefault("AWS_DEFAULT_REGION", "eu-west-2")
