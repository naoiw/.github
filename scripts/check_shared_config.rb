#!/usr/bin/env ruby
# frozen_string_literal: true

require "yaml"

forms = Dir[".github/ISSUE_TEMPLATE/0*.yml"].sort
abort "Expected four issue forms, got #{forms.size}" unless forms.size == 4

forms.each do |file|
  data = YAML.load_file(file)
  abort "#{file}: missing name/description/body" unless data.is_a?(Hash) &&
    data["name"].is_a?(String) && data["description"].is_a?(String) &&
    data["body"].is_a?(Array) && !data["body"].empty?
  data["body"].each do |item|
    abort "#{file}: form item missing type" unless item.is_a?(Hash) && item["type"].is_a?(String)
  end
end

YAML.load_file(".github/ISSUE_TEMPLATE/config.yml")
dependabot = YAML.load_file(".github/dependabot.yml")
abort "Dependabot configuration missing" unless dependabot.fetch("version", nil) == 2 &&
  dependabot.fetch("updates", []).size >= 2

# Guard against bundling breaking major upgrades into large PRs.
expected = {
  "github-actions" => "/",
  "npm" => "/templates/web-react"
}
expected.each do |ecosystem, directory|
  entry = dependabot.fetch("updates").find do |update|
    update["package-ecosystem"] == ecosystem && update["directory"] == directory
  end
  abort "Missing Dependabot #{ecosystem} in #{directory}" unless entry
  abort "Dependabot must not auto-merge" if entry["automerge"]
  abort "Dependabot must check monthly" unless entry.dig("schedule", "interval") == "monthly"
  abort "Dependabot timezone must be JST" unless entry.dig("schedule", "timezone") == "Asia/Tokyo"
  groups = entry.fetch("groups", {}).values
  abort "Missing routine minor/patch group for #{ecosystem}" unless groups.any? do |group|
    group["applies-to"] == "version-updates" &&
      group["patterns"] == ["*"] &&
      group["update-types"].sort == %w[minor patch]
  end
end

template_dependabot = YAML.load_file("templates/web-react/.github/dependabot.yml")
abort "React starter Dependabot config missing" unless template_dependabot["version"] == 2 &&
  template_dependabot.fetch("updates", []).any? { |u| u["package-ecosystem"] == "npm" && u["directory"] == "/" }

Dir[".github/workflows/*.yml"].each do |file|
  YAML.parse_file(file) || abort("#{file}: empty YAML")
end

["reusable-node-ci.yml", "reusable-vite-pages.yml", "reusable-sync-ai-rules.yml"].each do |name|
  file = File.join(".github/workflows", name)
  abort "#{file}: missing workflow_call" unless File.read(file).match?(/^  workflow_call:/)
end

Dir["templates/web-react/.github/workflows/*.yml", "templates/workflows/*.yml"].each do |file|
  YAML.parse_file(file) || abort("#{file}: empty YAML")
end

# New reusable-workflow caller examples must be pinned, never silently follow @main.
Dir["templates/workflows/*.yml", "templates/web-react/.github/workflows/*.yml"].each do |file|
  abort "#{file}: shared workflow reference must be SHA pinned" if File.read(file).match?(%r{uses:\s+naoiw/\.github/\.github/workflows/[^\s]+@main})
end

require "json"
package = JSON.parse(File.read("templates/web-react/package.json"))
abort "Missing React starter build script" unless package.fetch("scripts", {}).key?("build")
abort "Missing TypeScript in React starter" unless package.fetch("devDependencies", {}).key?("typescript")
abort "React starter must use pnpm@9.14.2" unless package["packageManager"] == "pnpm@9.14.2"
abort "Missing React starter pnpm-lock.yaml" unless File.file?("templates/web-react/pnpm-lock.yaml")
abort "Remove npm package-lock.json from React starter" if File.exist?("templates/web-react/package-lock.json")

required = %w[
  README.md
  AGENTS.md
  CONTRIBUTING.md
  .github/PULL_REQUEST_TEMPLATE.md
  standards/GITHUB_FLOW.md
  standards/AI_DEVELOPMENT.md
  standards/TECH_STACK.md
  standards/UI_STYLE.md
  standards/REPOSITORY_STRUCTURE.md
  standards/CI_AND_PAGES.md
  standards/AI_RULE_SYNC.md
  standards/LICENSING.md
  standards/DOCUMENTATION.md
  standards/WORKFLOW_RELEASES.md
  standards/REPOSITORY_AUDIT.md
  standards/WEB_TEMPLATE.md
  standards/SECURITY_AUTOMATION.md
  standards/BRANCH_PROTECTION.md
  versions/workflows.json
  scripts/audit-repositories.mjs
  scripts/test-audit-repositories.mjs
  scripts/export-web-template.mjs
  scripts/test-export-web-template.mjs
  .github/workflows/audit-repositories.yml
  .github/workflows/release-shared-workflows.yml
  .github/dependabot.yml
  templates/web-react/.github/dependabot.yml
  scripts/sync-agent-rules.mjs
  scripts/test-sync-agent-rules.mjs
  templates/agent-bundle/AGENTS.md
  templates/agent-bundle/.cursor/rules/naoiw-default.mdc
  templates/agent-bundle/.github/copilot-instructions.md
  templates/web-react/src/App.tsx
  templates/web-react/src/styles.css
  templates/web-react/LICENSE
  templates/web-react/README.md
  templates/web-react/docs/DEVELOPMENT.md
]
required.each { |file| abort "Missing #{file}" unless File.file?(file) }

puts "Issue Forms, reusable workflow YAML, AI sync and React starter structure: OK"
