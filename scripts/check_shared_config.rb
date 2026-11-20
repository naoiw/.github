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

Dir[".github/workflows/*.yml"].each do |file|
  YAML.parse_file(file) || abort("#{file}: empty YAML")
end

["reusable-node-ci.yml", "reusable-vite-pages.yml"].each do |name|
  file = File.join(".github/workflows", name)
  abort "#{file}: missing workflow_call" unless File.read(file).match?(/^  workflow_call:/)
end

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
  templates/AGENTS.md
  templates/.cursor/rules/naoiw-default.mdc
  templates/.github/copilot-instructions.md
]
required.each { |file| abort "Missing #{file}" unless File.file?(file) }

puts "Issue Forms, workflow YAML, shared standards and templates: OK"
