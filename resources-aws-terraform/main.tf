terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

resource "aws_dynamodb_table" "swapi_characters_cache_table" {
  name           = "swapi-characters-cache-table"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"
  range_key      = "created_at"

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "N"
  }

  attribute {
    name = "id_sorted"
    type = "S"
  }

  global_secondary_index {
    name               = "created_at_index"
    hash_key           = "id_sorted"
    range_key          = "created_at"
    projection_type    = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Environment = "development"
    Project     = "challengue-rimac"
    ManagedBy   = "terraform"
  }
}

resource "aws_dynamodb_table" "custom_data_table" {
  name           = "custom-data-table"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  tags = {
    Environment = "development"
    Project     = "challengue-rimac"
    ManagedBy   = "terraform"
  }
}

resource "aws_ssm_parameter" "swapi_characters_cache_table_name" {
  name  = "/challengue-rimac/dynamodb/swapi_characters_cache_table_name"
  type  = "String"
  value = aws_dynamodb_table.swapi_characters_cache_table.name

  tags = {
    Environment = "development"
    Project     = "challengue-rimac"
  }
}

resource "aws_ssm_parameter" "custom_data_table_name" {
  name  = "/challengue-rimac/dynamodb/custom_data_table_name"
  type  = "String"
  value = aws_dynamodb_table.custom_data_table.name

  tags = {
    Environment = "development"
    Project     = "challengue-rimac"
    ManagedBy   = "terraform"
  }
}

resource "aws_ssm_parameter" "swapi_characters_cache_table_arn" {
  name  = "/challengue-rimac/dynamodb/swapi_characters_cache_table_arn"
  type  = "String"
  value = aws_dynamodb_table.swapi_characters_cache_table.arn

  tags = {
    Environment = "development"
    Project     = "challengue-rimac"
  }
}

resource "aws_ssm_parameter" "custom_data_table_arn" {
  name  = "/challengue-rimac/dynamodb/custom_data_table_arn"
  type  = "String"
  value = aws_dynamodb_table.custom_data_table.arn

  tags = {
    Environment = "development"
    Project     = "challengue-rimac"
  }
}

data "aws_api_gateway_rest_api" "retrieve_merged_data_api" {
  name = "dev-retrieve-merged-data-lambda"
}

resource "aws_api_gateway_usage_plan" "daily_limit_plan" {
  name        = "daily-limit-plan"
  description = "Limit API usage to 100 requests per day"

  api_stages {
    api_id = data.aws_api_gateway_rest_api.retrieve_merged_data_api.id
    stage  = "dev"
  }

  quota_settings {
    limit  = 100
    period = "DAY"
  }

  throttle_settings {
    rate_limit  = 5
    burst_limit = 10
  }
}

resource "aws_api_gateway_api_key" "my_api_key" {
  name    = "my-api-key"
  enabled = true
}

resource "aws_api_gateway_usage_plan_key" "my_usage_plan_key" {
  key_id        = aws_api_gateway_api_key.my_api_key.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.daily_limit_plan.id
}

output "api_key_value" {
  value     = aws_api_gateway_api_key.my_api_key.value
  sensitive = true
}

output "table_name" {
  value = aws_dynamodb_table.swapi_characters_cache_table.name
}

output "table_arn" {
  value = aws_dynamodb_table.swapi_characters_cache_table.arn
}
