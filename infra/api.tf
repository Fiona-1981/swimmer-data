resource "aws_apigatewayv2_api" "http" {
  name          = "swimmer-data"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = [
      "https://swimmerdata.dev",
      "http://localhost:5173",
    ]
    allow_methods = ["POST"]
    allow_headers = ["content-type"]
  }
}

resource "aws_apigatewayv2_integration" "sessions" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.sessions.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "post_sessions" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "POST /sessions"
  target    = "integrations/${aws_apigatewayv2_integration.sessions.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true

  default_route_settings {
    throttling_burst_limit = 10
    throttling_rate_limit  = 5
  }
}

resource "aws_lambda_permission" "api" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.sessions.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}

output "api_url" {
  value = aws_apigatewayv2_stage.default.invoke_url
}