variable "REGISTRY" {
  default = "ghcr.io/seu-usuario"
}

group "default" {
  targets = ["backend", "frontend", "nginx"]
}

target "backend" {
  context    = "./backend"
  dockerfile = "Dockerfile"
  tags       = ["${REGISTRY}/megga-bolao-backend:latest"]
  platforms  = ["linux/amd64"]
  output     = ["type=registry"]
}

target "frontend" {
  context    = "./frontend"
  dockerfile = "Dockerfile"
  tags       = ["${REGISTRY}/megga-bolao-frontend:latest"]
  platforms  = ["linux/amd64"]
  output     = ["type=registry"]
}

target "nginx" {
  context    = "./nginx"
  dockerfile = "Dockerfile"
  tags       = ["${REGISTRY}/megga-bolao-nginx:latest"]
  platforms  = ["linux/amd64"]
  output     = ["type=registry"]
}
