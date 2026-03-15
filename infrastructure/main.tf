provider "azurerm" {
  features {}
}

locals {
  azureVaultName = "finrem-${var.env}"
}

data "azurerm_key_vault" "finrem_key_vault" {
  name                = local.azureVaultName
  resource_group_name = var.key_vault_resource_group
}

module "redis-cache-v2" {
  source                        = "git@github.com:hmcts/cnp-module-redis?ref=4.x"
  product                       = var.product
  location                      = var.location
  env                           = var.env
  name                          = "${var.product}-${var.component}-v6-${var.env}"
  redis_version                 = "6"
  business_area                 = "cft"
  common_tags                   = var.common_tags
  public_network_access_enabled = false
  private_endpoint_enabled      = true
  sku_name                      = var.sku_name
  family                        = var.family
  capacity                      = var.capacity
}

resource "azurerm_key_vault_secret" "redis_access_key" {
  name         = "redis-access-key"
  value        = module.redis-cache-v2.access_key
  key_vault_id = data.azurerm_key_vault.finrem_key_vault.id

  content_type = "secret"
  tags = merge(var.common_tags, {
    "source" : "redis ${module.redis-cache-v2.host_name}"
  })
}

resource "azurerm_key_vault_secret" "redis_connection_string" {
  name         = "redis-connection-string"
  value        = "redis://:${urlencode(module.redis-cache-v2.access_key)}@${module.redis-cache-v2.host_name}:${module.redis-cache-v2.redis_port}?tls=true"
  key_vault_id = data.azurerm_key_vault.finrem_key_vault.id

  content_type = "secret"
  tags = merge(var.common_tags, {
    "source" : "redis ${module.redis-cache-v2.host_name}"
  })
}
