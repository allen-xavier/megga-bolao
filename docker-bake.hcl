variable "REGISTRY" {
  default = "ghcr.io/seu-usuario"
}

group "default" {
  targets = ["backend", "frontend"]
}

target "backend" {
  context    = "./backend"
  dockerfile = "./backend/Dockerfile"
  tags       = ["${REGISTRY}/megga-bolao-backend:latest"]
  platforms  = ["linux/amd64"]
  output     = ["type=registry"]
}

target "frontend" {
  context    = "./frontend"
  dockerfile = "./frontend/Dockerfile"
  tags       = ["${REGISTRY}/megga-bolao-frontend:latest"]
  platforms  = ["linux/amd64"]
  output     = ["type=registry"]
}
