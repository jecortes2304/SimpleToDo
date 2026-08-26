APP_NAME := simpletodo
WEB_DIR := web
BUILD_DIR := build
AIR_VERSION := v1.67.3
SWAG_ARGS := init -g app_routers.go -d "./internal/app,./internal/router/v1,./internal/dto/request,./internal/dto/response" -o api --parseDependency --parseDependencyLevel 3 --parseFuncBody

ifeq ($(OS),Windows_NT)
	BINARY := $(BUILD_DIR)/$(APP_NAME).exe
	AIR_BINARY := $(BUILD_DIR)/tools/air.exe
	PREPARE_BUILD := powershell -NoProfile -Command "New-Item -ItemType Directory -Force '$(BUILD_DIR)' | Out-Null"
	PREPARE_TOOLS := powershell -NoProfile -Command "New-Item -ItemType Directory -Force '$(BUILD_DIR)/tools' | Out-Null"
	INSTALL_AIR := powershell -NoProfile -Command "$$env:GOBIN = (Resolve-Path '$(BUILD_DIR)/tools').Path; go install github.com/air-verse/air@$(AIR_VERSION)"
	DEV_COMMAND := powershell -NoProfile -Command "$$env:GOCACHE = (Resolve-Path '$(BUILD_DIR)').Path + '/go-cache'; $$env:OPEN_BROWSER = 'false'; & '$(AIR_BINARY)' -c .air.toml"
	RUN_BINARY := powershell -NoProfile -Command "$$ErrorActionPreference = 'Stop'; $$env:NO_COLOR = '1'; try { & '$(BINARY)'; exit $$LASTEXITCODE } catch { Write-Error $$_; exit 1 }"
	RUN_WEB = powershell -NoProfile -Command "$$env:NO_COLOR = '1'; $$env:FORCE_COLOR = '0'; $$ansi = [char]27 + '\[[0-9;]*[A-Za-z]'; & pnpm.cmd --dir '$(WEB_DIR)' $(1) 2>&1 | ForEach-Object { ($$_ -replace $$ansi, '') -replace '[^\x09\x20-\x7E]', '' }; $$code = $$LASTEXITCODE; exit $$code"
	RUN_GO = powershell -NoProfile -Command "$$cache = Join-Path (Get-Location) '$(BUILD_DIR)/go-cache'; New-Item -ItemType Directory -Force $$cache | Out-Null; $$env:GOCACHE = $$cache; $$env:NO_COLOR = '1'; & go $(1); exit $$LASTEXITCODE"
	CLEAN_COMMAND := powershell -NoProfile -Command "$$ErrorActionPreference = 'Stop'; $$root = (Get-Location).Path; $$prefix = $$root.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar; $$targets = @((Join-Path $$root '$(BUILD_DIR)'), (Join-Path $$root 'dist'), (Join-Path $$root '$(WEB_DIR)/dist')); $$webdist = [IO.Path]::GetFullPath((Join-Path $$root 'internal/app/webdist')); try { foreach ($$target in $$targets) { $$full = [IO.Path]::GetFullPath($$target); if (-not $$full.StartsWith($$prefix, [StringComparison]::OrdinalIgnoreCase)) { throw 'Refusing to clean path outside workspace: ' + $$full }; if (Test-Path -LiteralPath $$full) { Remove-Item -LiteralPath $$full -Recurse -Force } }; if (-not $$webdist.StartsWith($$prefix, [StringComparison]::OrdinalIgnoreCase)) { throw 'Refusing to clean path outside workspace: ' + $$webdist }; Get-ChildItem -LiteralPath $$webdist -Force | Where-Object Name -ne 'placeholder.txt' | Remove-Item -Recurse -Force } catch { Write-Error ('Unable to clean generated files. Stop make dev/run and try again. ' + $$_); exit 1 }"
else
	BINARY := $(BUILD_DIR)/$(APP_NAME)
	AIR_BINARY := $(BUILD_DIR)/tools/air
	PREPARE_BUILD := mkdir -p $(BUILD_DIR)
	PREPARE_TOOLS := mkdir -p $(BUILD_DIR)/tools
	INSTALL_AIR := GOBIN=$(CURDIR)/$(BUILD_DIR)/tools go install github.com/air-verse/air@$(AIR_VERSION)
	DEV_COMMAND := GOCACHE=$(CURDIR)/$(BUILD_DIR)/go-cache OPEN_BROWSER=false $(AIR_BINARY) -c .air.toml
	RUN_BINARY := NO_COLOR=1 $(BINARY)
	RUN_WEB = NO_COLOR=1 FORCE_COLOR=0 pnpm --dir $(WEB_DIR) $(1)
	RUN_GO = mkdir -p $(BUILD_DIR)/go-cache && GOCACHE=$(CURDIR)/$(BUILD_DIR)/go-cache NO_COLOR=1 go $(1)
	CLEAN_COMMAND := rm -rf $(BUILD_DIR) dist $(WEB_DIR)/dist && find internal/app/webdist -mindepth 1 ! -name placeholder.txt -exec rm -rf {} +
endif

.DEFAULT_GOAL := help

help: ## Show the available development commands
	@echo "SimpleTodo development commands:"
	@echo "  make install       Install frontend dependencies"
	@echo "  make dev           Watch frontend and backend; serve both from one Go server"
	@echo "  make run           Build the latest frontend and run the Go server"
	@echo "  make build         Build frontend, embed it, and compile the application"
	@echo "  make lint          Run frontend and Go linters"
	@echo "  make test          Run frontend and Go tests"
	@echo "  make clean         Remove generated binaries and caches"
	@echo "  make swagger       Regenerate Swagger documentation"
	@echo "  make docker-build  Build the latest frontend and production container"

install: web-install

web-install:
	$(call RUN_WEB,install --frozen-lockfile)

web-lint:
	$(call RUN_WEB,lint)

go-lint:
	$(call RUN_GO,vet ./...)

lint: web-lint go-lint

web-test:
	$(call RUN_WEB,test)

go-test:
	$(call RUN_GO,test ./...)

test: web-test go-test

format:
	$(call RUN_GO,fmt ./...)

web-build:
	$(call RUN_WEB,build)

web-sync: web-build

build: web-sync
	$(PREPARE_BUILD)
	$(call RUN_GO,build -buildvcs=false -o $(BINARY) ./cmd/app)

run: build
	$(RUN_BINARY)

dev-tools: $(AIR_BINARY)

$(AIR_BINARY):
	$(PREPARE_TOOLS)
	$(INSTALL_AIR)

dev: web-build dev-tools
	$(DEV_COMMAND)

swagger:
	$(call RUN_GO,tool swag $(SWAG_ARGS))

tidy:
	$(call RUN_GO,mod tidy)

clean:
	$(CLEAN_COMMAND)

docker-build: web-sync
	docker build -f deployments/Dockerfile -t simpletodo:local .

docker-run:
	docker run --rm -p 8000:8000 -v simpletodo-data:/data -e JWT_SECRET=change-me-with-a-long-random-secret simpletodo:local

docker-compose-up: web-sync
	docker compose -f deployments/docker-compose.yml up --build

docker-compose-down:
	docker compose -f deployments/docker-compose.yml down

.PHONY: help install web-install web-lint go-lint lint web-test go-test test format web-build web-sync build run dev-tools dev swagger tidy clean docker-build docker-run docker-compose-up docker-compose-down
