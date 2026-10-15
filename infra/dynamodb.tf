resource "aws_dynamodb_table" "swimmer_data" {
  name         = "swimmer-data"
  billing_mode = "PAY_PER_REQUEST"

  hash_key  = "PK"
  range_key = "SK"

  attribute {
    name = "PK"
    type = "S"
  }

  attribute {
    name = "SK"
    type = "S"
  }
}

output "table_name" {
  value = aws_dynamodb_table.swimmer_data.name
}