variable "product" {
}

variable "component" {
}

variable "location" {
  default = "UK South"
}

variable "env" {
}

variable "node_environment" {
  default     = "dev"
  description = "Infrastructure environment to point to"
}

variable "subscription" {
}

variable "common_tags" {
  type = map(string)
}

variable "family" {
  default     = "C"
  description = "The SKU family/pricing group to use. Valid values are `C` (for Basic/Standard SKU family) and `P` (for Premium). Use P for higher availability, but beware it costs a lot more."
}

variable "sku_name" {
  default     = "Basic"
  description = "The SKU of Redis to use. Possible values are `Basic`, `Standard` and `Premium`."
}

variable "capacity" {
  default     = "1"
  description = "The size of the Redis cache to deploy. Valid values are 1, 2, 3, 4, 5"
}

variable "managed_redis_sku" {
  description = "Managed Redis SKU. Override per environment in <env>.tfvars."
  type        = string
  default     = "Balanced_B0"
}

variable "managed_redis_persistence_rdb_frequency" {
  description = "RDB backup frequency for Managed Redis (1h, 6h, 12h). null = no persistence."
  type        = string
  default     = null
}

variable "private_dns_subscription_id" {
  description = "Subscription ID containing the private DNS zone for Managed Redis private endpoints."
  type        = string
  default     = "1baf5470-1c3e-40d3-a6f7-74bfbce4b348"
}
