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



output "table_name" {
  value = aws_dynamodb_table.swapi_characters_cache_table.name
}

output "table_arn" {
  value = aws_dynamodb_table.swapi_characters_cache_table.arn
}
