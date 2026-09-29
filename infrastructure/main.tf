provider "azurerm" {
  features {}
}

locals {
  azureVaultName = "finrem-${var.env}"
}

data "azurerm_key_vault" "finrem_key_vault" {
  name                = local.azureVaultName
  resource_group_name = local.azureVaultName
}

data "azurerm_subnet" "redis_private_endpoint" {
  name                 = "core-infra-subnet-2-${var.env}"
  resource_group_name  = "core-infra-${var.env}"
  virtual_network_name = "core-infra-vnet-${var.env}"
}

module "managed_redis" {
  source = "git@github.com:hmcts/terraform-module-azure-managed-redis?ref=main"

  product     = var.product
  component   = var.component
  env         = var.env
  location    = var.location
  common_tags = var.common_tags

  sku_name = var.managed_redis_sku

  public_network_access   = "Disabled"
  create_private_endpoint = true
  subnet_id               = data.azurerm_subnet.redis_private_endpoint.id
  private_dns_zone_ids = [
    "/subscriptions/${var.private_dns_subscription_id}/resourceGroups/core-infra-intsvc-rg/providers/Microsoft.Network/privateDnsZones/privatelink.redis.azure.net"
  ]

  access_keys_authentication_enabled = true
  persistence_rdb_backup_frequency   = var.managed_redis_persistence_rdb_frequency
}

resource "azurerm_key_vault_secret" "managed_redis_connection_string" {
  name         = "azure-managed-redis-connection-string"
  value        = "rediss://default:${urlencode(module.managed_redis.primary_access_key)}@${module.managed_redis.hostname}:${module.managed_redis.port}"
  key_vault_id = data.azurerm_key_vault.finrem_key_vault.id

  content_type = "secret"
  tags = merge(var.common_tags, {
    "source" : "managed redis ${module.managed_redis.hostname}"
  })
}
