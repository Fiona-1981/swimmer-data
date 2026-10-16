data "archive_file" "backend" {
  type        = "zip"
  # Only the handler is zipped, so tests and dev requirements stay out of the Lambda
  source_file = "${path.module}/../backend/handler.py"
  output_path = "${path.module}/build/backend.zip"
}

resource "aws_iam_role" "lambda" {
  name = "swimmer-data-lambda"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_lambda_function" "sessions" {
  function_name    = "swimmer-data-sessions"
  role             = aws_iam_role.lambda.arn
  runtime          = "python3.13"
  handler          = "handler.handler"
  filename         = data.archive_file.backend.output_path
  source_code_hash = data.archive_file.backend.output_base64sha256
  timeout          = 10
    environment {
    variables = {
      TABLE_NAME = aws_dynamodb_table.swimmer_data.name
    }
  }
}

resource "aws_iam_role_policy" "lambda_dynamodb" {
  name = "write-sessions"
  role = aws_iam_role.lambda.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect   = "Allow"
      Action   = ["dynamodb:PutItem"]
      Resource = aws_dynamodb_table.swimmer_data.arn
    }]
  })
}