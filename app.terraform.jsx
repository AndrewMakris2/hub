// Terraform chunk — compiled separately by build.js and lazy-loaded via
// loadChunk("terraform", ...) only when the Terraform page is opened.
//
// Curriculum content, quizzes, and capstone details are static course
// material, embedded below as plain data (parsed once from the
// Terraform-Study repo's course/terraform_course_prompt.md — see
// scripts/parse-terraform-course.js in that repo's history — same pattern
// as MO_TOOLS/HABIT_SUGGESTIONS in the core app). No runtime fetch, no
// dependency on that repo being deployed anywhere.
//
// Content viewer + progress tracker + quiz engine, plus (as of the
// Workspace tab) a real editor and terraform fmt/validate/plan/apply —
// but Hub itself still never holds an AWS credential and never runs
// Terraform. The Workspace tab talks to a small local companion process
// (terraform-bridge/, run by the user on their own machine) over
// 127.0.0.1 — see that directory's README.md for the full security model
// (origin+token gating, no shell, apply can only apply a plan the bridge
// just generated). This chunk only ever calls that bridge's fixed HTTP API;
// it has no other path to a shell or to cloud credentials.
// Assignment code review stays chat-driven — Hub only tracks a
// reviewed/complete checkbox, it doesn't review code itself. Building
// automated in-app review would mean shipping an AI API key to the browser
// or standing up a paid server-side proxy for it; chat already gets the
// same outcome with neither of those costs.
//
// Quiz 3 (Advanced Patterns) and Quiz 4 (Security & Compliance) have no
// written-out questions in the source course material — just a one-line
// topic summary and a passing threshold. Rather than inventing course
// content, they render as "not yet written" with that summary shown, same
// honesty the rest of Hub applies to empty states.
const { useState, useEffect, useMemo, useRef } = React;
const { Card, EmptyState, SectionLabel, Segmented, toast, cardBackgroundStyle, STORAGE_KEYS, usePersistentState, IconClose } = window.__v;

const TERRAFORM_CURRICULUM = {"phases":[{"id":"phase-1","num":1,"title":"FOUNDATIONS & PREREQUISITES","weeks":"Weeks 1-2: Building Your Knowledge Base","modules":[{"id":"1.1","title":"Cloud Infrastructure Fundamentals","isQuiz":false,"objectives":["Understand cloud provider service models (IaaS, PaaS, SaaS)","Know the difference between imperative vs. declarative infrastructure","Map Terraform's role in the infrastructure lifecycle","Understand networking basics for infrastructure deployment"],"lecture":[{"type":"subheading","text":"What is Infrastructure as Code (IaC)?"},{"type":"p","text":"Every cloud resource can be created two ways: click through a console or run one-off CLI commands (imperative — you describe the *steps*), or write down the *end state* you want and let a tool figure out the steps (declarative — Terraform's approach). The difference matters most six months later, when someone asks \"what does our production network actually look like, and why.\" With imperative changes, the answer lives in people's memory and support tickets. With Terraform, the answer is a file in version control — you can `git blame` a security group rule the same way you'd `git blame` a line of application code."},{"type":"code","text":"# Imperative: create a security group by hand (AWS CLI)\naws ec2 create-security-group \\\n  --group-name web-sg --description \"Web tier\"\naws ec2 authorize-security-group-ingress \\\n  --group-id sg-0123456789abcdef0 \\\n  --protocol tcp --port 22 --cidr 203.0.113.4/32\n# ...works, but nothing records *why* this rule exists, or catches\n# someone else widening it to 0.0.0.0/0 next week.\n\n# Declarative: the same rule, as Terraform\nresource \"aws_security_group\" \"web\" {\n  name        = \"web-sg\"\n  description = \"Web tier\"\n\n  ingress {\n    description = \"SSH from my IP only\"\n    from_port   = 22\n    to_port     = 22\n    protocol    = \"tcp\"\n    cidr_blocks = [\"203.0.113.4/32\"]\n  }\n}\n# This is reviewable in a pull request, diffable against the last\n# known-good state, and `terraform plan` will flag it the moment\n# someone tries to widen that cidr_blocks value."},{"type":"bullets","items":["Imperative approach: Step-by-step instructions (CLI commands, manual clicks)","Declarative approach: Describe desired state (Terraform's philosophy)","Why it matters for security: Version control, audit trails, reproducibility, compliance"]},{"type":"subheading","text":"Cloud Provider Knowledge (Pick ONE to focus on initially)"},{"type":"p","text":"Pick one provider and get genuinely comfortable with its networking and IAM model before spreading out — the Terraform syntax for `resource`/`data`/`variable` is identical everywhere, but the actual security decisions (how AWS security groups differ from Azure NSGs, how IAM policies differ from Azure RBAC) are provider-specific and don't transfer. This course's examples default to AWS since it's the most common target for the assignments ahead, but the concepts map directly if you're on Azure or GCP."},{"type":"bullets","items":["AWS: EC2, VPC, Security Groups, IAM, S3, RDS","Azure: Virtual Machines, Virtual Networks, Network Security Groups, Identity & Access Management","GCP: Compute Engine, VPC Networks, Firewall Rules, Cloud IAM"]},{"type":"subheading","text":"Security Perspective"},{"type":"p","text":"This is the throughline for the whole course, not just this module: every assignment from here on asks you to build something and then prove it's *secure by construction* — least-privilege security group rules, encrypted state, no secrets in plaintext — rather than building it first and bolting security on after. Terraform makes that easier than click-ops because the rules are text you can lint, diff, and review before anything is ever created."},{"type":"bullets","items":["Infrastructure drift detection","Configuration compliance scanning","Immutable infrastructure principles","Least privilege access via IaC"]}],"assignments":[{"id":"1.1A","title":"Cloud Provider Walkthrough","task":"Using your chosen cloud provider's console or CLI:","taskSteps":["Create a simple VM/compute instance","Create a security group/network ACL with specific ingress/egress rules","Document the steps required (list 8-15 steps)","Take screenshots of the configuration"],"deliverable":"Markdown file with step-by-step process and 3-5 screenshots showing network configuration","success":["VM is created and accessible","Security group allows only SSH (port 22) from your IP","Documentation is clear enough for someone else to replicate"]},{"id":"1.1B","title":"Networking Deep Dive","task":"Draw and explain:","taskSteps":["A VPC with 2 public subnets, 2 private subnets, NAT Gateway","Security group rules for a web server (HTTP/HTTPS in, SSH restricted)","Network flow from user → load balancer → app server → database"],"deliverable":"Diagram (ASCII, Mermaid, or hand-drawn + scanned) with written explanations","success":[]}]},{"id":"1.2","title":"Terraform Fundamentals","isQuiz":false,"objectives":["Understand what Terraform is and what it isn't","Know the Terraform lifecycle (plan, apply, destroy)","Grasp HCL (HashiCorp Configuration Language) syntax basics","Set up your local Terraform environment"],"lecture":[{"type":"subheading","text":"What is Terraform?"},{"type":"bullets","items":["Infrastructure provisioning tool, NOT configuration management","Manages the \"create/read/update/delete\" (CRUD) lifecycle of infrastructure","Provider-agnostic (AWS, Azure, GCP, on-prem, etc.)","Stateful (maintains state file—critical for security/operations)"]},{"type":"subheading","text":"The Terraform Lifecycle"},{"type":"p","text":"`plan` is the step that actually matters for security review: it computes a diff between your `.tf` files and the last known state (or real infrastructure) and shows you exactly what would change — additions in green, destructions in red — *without changing anything*. Get in the habit of reading a plan's output line by line before ever running `apply`, the same way you'd read a code diff before merging it. A plan that shows an unexpected `-/+` (destroy and recreate) on something like a database is the kind of thing you want to catch here, not in production."},{"type":"steps","items":["Write: Author HCL configuration","Plan: Preview changes (`terraform plan`) - Security checkpoint: review before apply","Apply: Execute changes (`terraform apply`)","Destroy: Tear down resources (`terraform destroy`)"]},{"type":"subheading","text":"HCL Basics"},{"type":"code","lang":"hcl","text":"# Blocks: resource, data, variable, output, locals, terraform\n# Resource: declares infrastructure object\nresource \"aws_instance\" \"example\" {\n  ami           = \"ami-0c55b159cbfafe1f0\"\n  instance_type = \"t2.micro\"\n\n  tags = {\n    Name        = \"SecurityServer\"\n    Environment = \"production\"\n    Owner       = \"SecurityTeam\"\n  }\n}\n\n# Variables: input parameters\nvariable \"instance_count\" {\n  type        = number\n  default     = 1\n  description = \"Number of instances to create\"\n}\n\n# Outputs: expose values for external use\noutput \"instance_public_ip\" {\n  value       = aws_instance.example.public_ip\n  description = \"Public IP of the instance\"\n}\n\n# Locals: internal intermediate values\nlocals {\n  common_tags = {\n    ManagedBy   = \"Terraform\"\n    CostCenter  = \"InfoSec\"\n  }\n}"},{"type":"subheading","text":"Terraform State (CRITICAL)"},{"type":"p","text":"State is the part of Terraform most likely to bite you if you don't respect it early. It's the only place that maps your `.tf` config to *real* resource IDs, which means: it often contains sensitive values in plaintext (see Module 4.1), it must never be edited by hand, and if two people `apply` from stale local state at the same time you can get resources silently duplicated or destroyed. Module 3.3 covers the real fix (remote state with locking) — for now, the habit to build is running `terraform plan` immediately before every `apply`, never trusting that nothing changed since you last looked."},{"type":"bullets","items":["State file (`.tfstate`) is the source of truth","Stores real-world resource IDs and metadata","Security consideration: State files contain sensitive data (passwords, keys)—store in secure backend (S3 + encryption, Terraform Cloud, Azure Storage)","Remote state enables team collaboration"]},{"type":"subheading","text":"Providers"},{"type":"bullets","items":["Plugins that interact with cloud/on-prem APIs","AWS, Azure, GCP, Kubernetes, Datadog, Vault, etc.","Version pinning: `required_providers` block"]}],"assignments":[{"id":"1.2A","title":"Terraform Installation & Setup","task":"","taskSteps":["Install Terraform (latest version)","Verify installation: `terraform version`","Create a project directory: `infra-learning`","Set up AWS CLI credentials (or equivalent for your chosen provider)","Verify provider access with a simple `terraform init`"],"deliverable":"Screenshot showing `terraform version` and successful `terraform init`","success":["Terraform CLI is functional","You can run `terraform init` without errors","Your cloud provider credentials are configured"],"validates":"validate"},{"id":"1.2B","title":"HCL Syntax Practice","task":"Create a file `main.tf` with:","taskSteps":["A `terraform` block specifying required AWS provider (>= 4.0)","A `variable` block for \"environment\" (string, default \"dev\")","A `locals` block defining common tags (Environment, Owner, ManagedBy)","A `resource` block for an AWS security group (don't apply yet—just write)"],"deliverable":"`main.tf` file with proper syntax","success":["File has zero syntax errors (validate with `terraform validate`)","All blocks are present and properly formatted","Comments explain each block's purpose"],"validates":"validate"}]},{"id":"1.3","title":"Quiz & Knowledge Check","isQuiz":true,"quizId":"quiz-1","objectives":[],"lecture":[],"assignments":[]}]},{"id":"phase-2","num":2,"title":"CORE TERRAFORM CONCEPTS","weeks":"Weeks 3-4: Building Your First Infrastructure","modules":[{"id":"2.1","title":"Resources, Data Sources, and Outputs","isQuiz":false,"objectives":["Create and manage infrastructure resources","Query existing infrastructure with data sources","Export values for downstream consumption","Implement naming conventions and tagging strategies for security compliance"],"lecture":[{"type":"subheading","text":"Resources: The Building Blocks"},{"type":"p","text":"The two quoted strings after `resource` are the resource *type* (`aws_instance` — defined by the provider, not something you invent) and a *local name* (`web_server` — yours to choose, used to reference this resource elsewhere in your config as `aws_instance.web_server`). Everything inside the `{ }` configures that specific resource. This pairing — type you don't control, name you do — is the same shape for every resource block you'll write, in every provider."},{"type":"code","lang":"hcl","text":"resource \"aws_instance\" \"web_server\" {\n  ami             = data.aws_ami.ubuntu.id  # Use data source\n  instance_type   = var.instance_type        # Use variable\n  subnet_id       = aws_subnet.public.id     # Reference another resource\n\n  security_groups = [aws_security_group.web.id]\n\n  tags = merge(\n    local.common_tags,\n    {\n      Name = \"WebServer-${var.environment}\"\n    }\n  )\n\n  monitoring = true  # CloudWatch detailed monitoring (security benefit)\n\n  depends_on = [aws_internet_gateway.main]  # Explicit dependency\n}"},{"type":"subheading","text":"Data Sources: Query Existing Infrastructure"},{"type":"p","text":"`data` blocks look almost identical to `resource` blocks but do the opposite job: they read something that already exists (an AMI, an existing VPC, the account you're authenticated as) instead of creating anything. Reaching for a data source instead of hardcoding an ID — like filtering for \"latest Ubuntu 22.04\" instead of pasting in `ami-0abc123...` — means your config doesn't silently rot: hardcoded AMI IDs get deprecated, region-specific, and stale in ways that only surface as a failed `apply` months later."},{"type":"code","lang":"hcl","text":"# Find the latest Ubuntu 22.04 AMI\ndata \"aws_ami\" \"ubuntu\" {\n  most_recent = true\n\n  filter {\n    name   = \"name\"\n    values = [\"ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*\"]\n  }\n\n  owners = [\"099720109477\"]  # Canonical's AWS account\n}\n\n# Fetch existing VPC\ndata \"aws_vpc\" \"default\" {\n  default = true\n}\n\n# Query AWS account metadata\ndata \"aws_caller_identity\" \"current\" {}"},{"type":"subheading","text":"Outputs: Export Infrastructure Data"},{"type":"p","text":"Outputs are how a Terraform configuration exposes values to the outside world — to you, running `terraform output` on the CLI; to another Terraform config consuming this one as a module (Module 3.1); or to remote state (Module 3.3). Marking one `sensitive = true` (like the AWS account ID above) stops Terraform printing it to the console on `plan`/`apply`, but — important distinction covered again in Module 4.1 — it does *not* encrypt or omit it from the state file itself."},{"type":"code","lang":"hcl","text":"output \"instance_public_ip\" {\n  value       = aws_instance.web_server.public_ip\n  description = \"Public IP of web server\"\n  sensitive   = false\n}\n\noutput \"instance_security_group_id\" {\n  value       = aws_security_group.web.id\n  description = \"Security group ID for reference by other modules\"\n  sensitive   = false\n}\n\noutput \"aws_account_id\" {\n  value       = data.aws_caller_identity.current.account_id\n  description = \"AWS Account ID (for compliance documentation)\"\n  sensitive   = true  # Don't log this value\n}"},{"type":"subheading","text":"Security Best Practices"},{"type":"bullets","items":["Always use `monitoring = true` for production EC2 instances","Implement mandatory tagging: Owner, Environment, CostCenter, DataClassification, ComplianceScope","Use `sensitive = true` for outputs containing secrets, IPs, or identifiable data","Reference security groups by ID, never by name (names are not globally unique)"]}],"assignments":[{"id":"2.1A","title":"VPC + EC2 + Security Group","task":"Write Terraform configuration to:","taskSteps":["Create a VPC (10.0.0.0/16)","Create a public subnet (10.0.1.0/24)","Create an Internet Gateway","Create a security group allowing:"],"deliverable":"","success":["`terraform plan` shows creation of VPC, subnet, IGW, security group, and EC2","`terraform validate` passes with zero errors","Outputs section includes at least 2 exports","Security group only allows SSH from your specific IP"],"validates":"plan"},{"id":"2.1B","title":"Data Sources Deep Dive","task":"Extend Assignment 2.1A with:","taskSteps":["Use a `data` source to fetch the latest Ubuntu 22.04 LTS AMI (don't hardcode the AMI ID)","Use `data.aws_availability_zones` to fetch available AZs in your region","Create the subnet in the first AZ using: `availability_zone = data.aws_availability_zones.available.names[0]`","Add an output that displays the AMI ID and all available AZ names"],"deliverable":"Updated `main.tf` and `outputs.tf`","success":["`terraform plan` shows data sources being queried","AMI data source filters for Ubuntu 22.04","Subnet is placed in a specific AZ via data source","Output displays both AMI ID and AZ list"],"validates":"plan"}]},{"id":"2.2","title":"Variables, Locals, and Terraform.tfvars","isQuiz":false,"objectives":["Define and validate input variables","Use locals for computed values and DRY principles","Manage environments (dev/staging/prod) with .tfvars files","Implement variable validation for security compliance"],"lecture":[{"type":"subheading","text":"Variables: Input Parameters"},{"type":"p","text":"A `validation` block turns a bad input into an immediate, readable error at `terraform plan` time instead of a confusing failure halfway through `apply` — or worse, infrastructure that gets created wrong and has to be torn down. Writing validation rules for anything security-relevant (an allowed CIDR range, an environment name that gates which IAM permissions get attached) is cheap insurance: it's the difference between catching a typo in code review and catching it in an incident retro."},{"type":"code","lang":"hcl","text":"variable \"environment\" {\n  type        = string\n  default     = \"dev\"\n  description = \"Environment name (dev, staging, prod)\"\n\n  validation {\n    condition     = contains([\"dev\", \"staging\", \"prod\"], var.environment)\n    error_message = \"Environment must be dev, staging, or prod.\"\n  }\n}\n\nvariable \"instance_type\" {\n  type        = string\n  description = \"EC2 instance type\"\n\n  validation {\n    condition     = can(regex(\"^t[23]\\\\.\", var.instance_type))\n    error_message = \"Production instances must be t2 or t3 types (cost control).\"\n  }\n}\n\nvariable \"allowed_ssh_cidrs\" {\n  type        = list(string)\n  description = \"CIDR blocks allowed SSH access (security compliance)\"\n\n  validation {\n    condition = alltrue([\n      for cidr in var.allowed_ssh_cidrs : can(cidrhost(cidr, 0))\n    ])\n    error_message = \"All SSH CIDRs must be valid CIDR notation.\"\n  }\n}\n\nvariable \"enable_encryption\" {\n  type        = bool\n  default     = true\n  description = \"Enable EBS encryption for volumes\"\n}\n\nvariable \"tags\" {\n  type = object({\n    Owner              = string\n    CostCenter         = string\n    DataClassification = string\n    ComplianceScope    = string\n  })\n  description = \"Mandatory tags for compliance\"\n}"},{"type":"subheading","text":"Locals: Computed, Reusable Values"},{"type":"p","text":"The distinction that trips people up: a `variable` is an *input* — something the person running `apply` can set. A `local` is *computed* from other values (often from variables) and can't be overridden from outside. Use locals for anything derived — a naming convention built from `var.environment`, a merged tags map — so that logic lives in exactly one place instead of being copy-pasted across every resource block that needs it."},{"type":"code","lang":"hcl","text":"locals {\n  # Common tags used across all resources\n  common_tags = merge(\n    var.tags,\n    {\n      Environment = var.environment\n      ManagedBy   = \"Terraform\"\n      CreatedDate = timestamp()\n    }\n  )\n\n  # Environment-specific settings\n  instance_specs = {\n    dev = {\n      instance_type = \"t2.micro\"\n      volume_size   = 20\n    }\n    staging = {\n      instance_type = \"t3.small\"\n      volume_size   = 50\n    }\n    prod = {\n      instance_type = \"t3.medium\"\n      volume_size   = 100\n    }\n  }\n\n  # Derived values\n  current_instance_type = local.instance_specs[var.environment].instance_type\n  is_production          = var.environment == \"prod\"\n}"},{"type":"subheading","text":"Terraform.tfvars: Environment-Specific Values"},{"type":"p","text":"Splitting `terraform.dev.tfvars` from `terraform.prod.tfvars` is how real teams keep one set of `.tf` files driving multiple environments without duplicating the resource definitions themselves — the assignment ahead (2.2B) leans on exactly this pattern. It's also a natural security boundary: a dev `.tfvars` file can be permissive (open SSH, small instance types) while the prod one is deliberately locked down, and the difference is visible in a one-line diff between the two files instead of buried in conditional logic."},{"type":"code","lang":"hcl","text":"# terraform.dev.tfvars\nenvironment       = \"dev\"\ninstance_type     = \"t2.micro\"\nallowed_ssh_cidrs = [\"203.0.113.0/32\"]  # Your office IP\ntags = {\n  Owner              = \"SecurityTeam\"\n  CostCenter         = \"InfoSec\"\n  DataClassification = \"Internal\"\n  ComplianceScope    = \"PCI-DSS\"\n}"},{"type":"code","lang":"hcl","text":"# terraform.prod.tfvars\nenvironment       = \"prod\"\ninstance_type     = \"t3.medium\"\nallowed_ssh_cidrs = [\"203.0.113.0/32\", \"198.51.100.0/24\"]  # Multiple secure sources\ntags = {\n  Owner              = \"SecurityOps\"\n  CostCenter         = \"InfoSec\"\n  DataClassification = \"Confidential\"\n  ComplianceScope    = \"PCI-DSS,SOC2\"\n}"},{"type":"subheading","text":"Apply with Environment File"},{"type":"code","lang":"bash","text":"terraform plan -var-file=terraform.dev.tfvars\nterraform plan -var-file=terraform.prod.tfvars"}],"assignments":[{"id":"2.2A","title":"Variables with Validation","task":"","taskSteps":["Create `variables.tf` with variables for: environment, instance_type, allowed_ssh_cidrs, enable_encryption, tags object","Add `validation` blocks ensuring:"],"deliverable":"","success":["`terraform validate` passes","Variable validation catches invalid inputs","Both .tfvars files are syntactically correct","Dev config is minimal/cost-optimized; prod config is hardened"],"validates":"validate"},{"id":"2.2B","title":"Locals & Multi-Environment Configuration","task":"","taskSteps":["Create `locals.tf` with:"],"deliverable":"`locals.tf` with 3+ computed locals","success":["`terraform plan` shows locals being computed correctly","Instance type changes based on environment","Tags are properly merged","Security group rules differ by environment"],"validates":"plan"}]},{"id":"2.3","title":"Implementing Security Groups & Network ACLs","isQuiz":false,"objectives":["Design least-privilege security groups","Understand ingress vs. egress rules","Implement network segmentation","Create security baseline configurations for compliance"],"lecture":[{"type":"subheading","text":"Security Group Best Practices"},{"type":"p","text":"The three-tier shape below — web tier open to the internet, app tier reachable only from the web tier's security group, database tier reachable only from the app tier's — is the single most common real-world security group pattern, and it's exactly what Assignment 2.3A asks you to build. Notice the ingress rules reference *other security groups* (`security_groups = [aws_security_group.web.id]`) rather than CIDR blocks wherever possible: that ties the rule to \"anything running as part of the web tier,\" which keeps working correctly as instances are added, removed, or replaced, instead of a static IP list that goes stale."},{"type":"code","lang":"hcl","text":"# Web tier security group\nresource \"aws_security_group\" \"web_tier\" {\n  name_prefix = \"web-tier-\"\n  description = \"Security group for web tier servers\"\n  vpc_id      = aws_vpc.main.id\n\n  tags = merge(local.common_tags, { Name = \"web-tier-sg\" })\n\n  lifecycle {\n    create_before_destroy = true\n  }\n}\n\n# Separate ingress rules for clarity and management\nresource \"aws_vpc_security_group_ingress_rule\" \"web_http\" {\n  security_group_id = aws_security_group.web_tier.id\n\n  from_port   = 80\n  to_port     = 80\n  ip_protocol = \"tcp\"\n\n  cidr_ipv4   = \"0.0.0.0/0\"\n  description = \"HTTP from internet\"\n\n  tags = { Name = \"allow-http\" }\n}\n\nresource \"aws_vpc_security_group_ingress_rule\" \"web_https\" {\n  security_group_id = aws_security_group.web_tier.id\n\n  from_port   = 443\n  to_port     = 443\n  ip_protocol = \"tcp\"\n\n  cidr_ipv4   = \"0.0.0.0/0\"\n  description = \"HTTPS from internet\"\n\n  tags = { Name = \"allow-https\" }\n}\n\n# App tier security group (receives from web tier only)\nresource \"aws_security_group\" \"app_tier\" {\n  name_prefix = \"app-tier-\"\n  description = \"Security group for application tier\"\n  vpc_id      = aws_vpc.main.id\n\n  tags = merge(local.common_tags, { Name = \"app-tier-sg\" })\n}\n\nresource \"aws_vpc_security_group_ingress_rule\" \"app_from_web\" {\n  security_group_id = aws_security_group.app_tier.id\n\n  from_port                    = 8080\n  to_port                      = 8080\n  ip_protocol                  = \"tcp\"\n  referenced_security_group_id = aws_security_group.web_tier.id\n  description                  = \"App server port from web tier\"\n\n  tags = { Name = \"allow-from-web\" }\n}\n\n# Database tier security group (receives from app tier only)\nresource \"aws_security_group\" \"db_tier\" {\n  name_prefix = \"db-tier-\"\n  description = \"Security group for database tier\"\n  vpc_id      = aws_vpc.main.id\n\n  tags = merge(local.common_tags, { Name = \"db-tier-sg\" })\n}\n\nresource \"aws_vpc_security_group_ingress_rule\" \"db_from_app\" {\n  security_group_id = aws_security_group.db_tier.id\n\n  from_port                    = 3306\n  to_port                      = 3306\n  ip_protocol                  = \"tcp\"\n  referenced_security_group_id = aws_security_group.app_tier.id\n  description                  = \"MySQL from app tier\"\n\n  tags = { Name = \"allow-from-app\" }\n}\n\n# Egress: Allow all outbound by default (modify per security requirements)\nresource \"aws_vpc_security_group_egress_rule\" \"all_outbound\" {\n  security_group_id = aws_security_group.web_tier.id\n\n  from_port   = 0\n  to_port     = 65535\n  ip_protocol = \"-1\"\n\n  cidr_ipv4   = \"0.0.0.0/0\"\n  description = \"All outbound traffic\"\n\n  tags = { Name = \"allow-all-out\" }\n}\n\n# Bastion/Jump Host for secure SSH access\nresource \"aws_security_group\" \"bastion\" {\n  name_prefix = \"bastion-\"\n  description = \"Security group for bastion host\"\n  vpc_id      = aws_vpc.main.id\n\n  tags = merge(local.common_tags, { Name = \"bastion-sg\" })\n}\n\nresource \"aws_vpc_security_group_ingress_rule\" \"bastion_ssh\" {\n  security_group_id = aws_security_group.bastion.id\n\n  from_port   = 22\n  to_port     = 22\n  ip_protocol = \"tcp\"\n  cidr_ipv4   = var.admin_cidr  # Your office or VPN IP only\n  description = \"SSH from admin network\"\n\n  tags = { Name = \"allow-ssh-from-admin\" }\n}\n\n# App tier receives SSH only from bastion\nresource \"aws_vpc_security_group_ingress_rule\" \"app_ssh_from_bastion\" {\n  security_group_id = aws_security_group.app_tier.id\n\n  from_port                    = 22\n  to_port                      = 22\n  ip_protocol                  = \"tcp\"\n  referenced_security_group_id = aws_security_group.bastion.id\n  description                  = \"SSH from bastion host\"\n\n  tags = { Name = \"allow-ssh-from-bastion\" }\n}"},{"type":"subheading","text":"Security Groups vs. Network ACLs"},{"type":"p","text":"In practice you'll reach for security groups for almost everything — they're stateful (a response to allowed inbound traffic is automatically allowed back out) and scoped to specific resources, which is what the tiered design above depends on. Network ACLs are stateless and apply at the subnet level; they're worth adding as a second, coarser layer of defense (e.g. explicitly denying a known-bad CIDR range at the subnet boundary) rather than as your primary access control."},{"type":"bullets","items":["Security groups: stateful, instance-level, easier to manage","NACLs: stateless, subnet-level, granular but complex","Recommendation: Use security groups for most cases; NACLs for egress filtering or DDoS mitigation"]}],"assignments":[{"id":"2.3A","title":"Three-Tier Network with Security Groups","task":"Create a complete three-tier architecture:","taskSteps":["Web Tier: ALB + EC2 instances, allow HTTP/HTTPS from internet","App Tier: EC2 instances, allow only from web tier","Database Tier: RDS instance, allow only from app tier","Bastion: Jump host for administrative access","All tiers have restricted egress (only what's needed)"],"deliverable":"","success":["Each tier receives traffic only from the tier above it","No direct internet access to app or DB tiers","SSH access to app/DB instances only through bastion","`terraform plan` shows all security groups with proper rules","No overly permissive rules (0.0.0.0/0 only for web tier HTTP/HTTPS)"],"validates":"plan"},{"id":"2.3B","title":"Security Compliance Checklist","task":"For your three-tier infrastructure, create a compliance checklist:","taskSteps":["Are all security groups named and tagged appropriately?","Are all inbound rules limited to specific ports/protocols?","Is there a bastion host for administrative access?","Are there no public IPs on DB instances?","Are all rules justified and documented?"],"deliverable":"Markdown file with pass/fail for each item and remediation plan","success":["Checklist covers 8+ compliance points","All points are marked pass (or documented remediation)","Each rule has a description explaining its purpose"]}]},{"id":"2.4","title":"Quiz & Knowledge Check","isQuiz":true,"quizId":"quiz-2","objectives":[],"lecture":[],"assignments":[]}]},{"id":"phase-3","num":3,"title":"ADVANCED PATTERNS & STATE MANAGEMENT","weeks":"Weeks 5-6: Scaling and Team Collaboration","modules":[{"id":"3.1","title":"Modules—Organizing Infrastructure Code","isQuiz":false,"objectives":["Understand module structure and reusability","Create reusable modules for common patterns (VPC, security, databases)","Implement module registries and version control","Design modules for security compliance and auditing"],"lecture":[{"type":"subheading","text":"Module Structure"},{"type":"p","text":"A module is just a directory of `.tf` files with its own `variables.tf` (its inputs) and `outputs.tf` (what it exposes to whatever calls it) — the same three-file shape as a root configuration, which is why modules compose so cleanly. The payoff is real: once the VPC module below is written and tested once, every environment (dev/staging/prod) and every future project calls the same module with different variables instead of copy-pasting the same 100 lines of networking code three times and having them slowly drift apart."},{"type":"code","lang":"text","text":"terraform-modules/\n├── modules/\n│   ├── vpc/\n│   │   ├── main.tf\n│   │   ├── variables.tf\n│   │   ├── outputs.tf\n│   │   └── terraform.tfvars\n│   ├── security_group/\n│   │   ├── main.tf\n│   │   ├── variables.tf\n│   │   └── outputs.tf\n│   ├── ec2_instance/\n│   │   ├── main.tf\n│   │   ├── variables.tf\n│   │   └── outputs.tf\n│   └── rds_database/\n│       ├── main.tf\n│       ├── variables.tf\n│       └── outputs.tf\n├── environments/\n│   ├── dev/\n│   │   ├── main.tf\n│   │   ├── variables.tf\n│   │   ├── terraform.tfvars\n│   │   └── backend.tf\n│   ├── staging/\n│   └── prod/\n└── README.md"},{"type":"subheading","text":"Module Example: VPC Module"},{"type":"code","lang":"hcl","text":"# modules/vpc/main.tf\nresource \"aws_vpc\" \"main\" {\n  cidr_block = var.vpc_cidr\n\n  tags = merge(var.common_tags, { Name = var.vpc_name })\n}\n\nresource \"aws_subnet\" \"public\" {\n  count             = length(var.public_subnet_cidrs)\n  vpc_id            = aws_vpc.main.id\n  cidr_block        = var.public_subnet_cidrs[count.index]\n  availability_zone = data.aws_availability_zones.available.names[count.index % length(data.aws_availability_zones.available.names)]\n\n  map_public_ip_on_launch = true\n\n  tags = merge(var.common_tags, {\n    Name = \"public-subnet-${count.index + 1}\"\n    Tier = \"public\"\n  })\n}\n\nresource \"aws_subnet\" \"private\" {\n  count             = length(var.private_subnet_cidrs)\n  vpc_id            = aws_vpc.main.id\n  cidr_block        = var.private_subnet_cidrs[count.index]\n  availability_zone = data.aws_availability_zones.available.names[count.index % length(data.aws_availability_zones.available.names)]\n\n  tags = merge(var.common_tags, {\n    Name = \"private-subnet-${count.index + 1}\"\n    Tier = \"private\"\n  })\n}\n\n# modules/vpc/variables.tf\nvariable \"vpc_name\" {\n  type        = string\n  description = \"Name of the VPC\"\n}\n\nvariable \"vpc_cidr\" {\n  type        = string\n  description = \"CIDR block for VPC\"\n\n  validation {\n    condition     = can(cidrhost(var.vpc_cidr, 0))\n    error_message = \"VPC CIDR must be valid CIDR notation.\"\n  }\n}\n\nvariable \"public_subnet_cidrs\" {\n  type        = list(string)\n  description = \"List of public subnet CIDR blocks\"\n}\n\nvariable \"private_subnet_cidrs\" {\n  type        = list(string)\n  description = \"List of private subnet CIDR blocks\"\n}\n\nvariable \"common_tags\" {\n  type        = map(string)\n  description = \"Common tags for all resources\"\n}\n\n# modules/vpc/outputs.tf\noutput \"vpc_id\" {\n  value       = aws_vpc.main.id\n  description = \"VPC ID\"\n}\n\noutput \"public_subnet_ids\" {\n  value       = aws_subnet.public[*].id\n  description = \"List of public subnet IDs\"\n}\n\noutput \"private_subnet_ids\" {\n  value       = aws_subnet.private[*].id\n  description = \"List of private subnet IDs\"\n}\n\n# Root configuration: environments/prod/main.tf\nmodule \"vpc\" {\n  source = \"../../modules/vpc\"\n\n  vpc_name             = \"prod-vpc\"\n  vpc_cidr             = \"10.0.0.0/16\"\n  public_subnet_cidrs  = [\"10.0.1.0/24\", \"10.0.2.0/24\"]\n  private_subnet_cidrs = [\"10.0.10.0/24\", \"10.0.11.0/24\"]\n\n  common_tags = local.common_tags\n}\n\n# Reference module outputs\nresource \"aws_instance\" \"web_server\" {\n  ami           = data.aws_ami.ubuntu.id\n  instance_type = \"t3.medium\"\n\n  subnet_id       = module.vpc.public_subnet_ids[0]\n  security_groups = [aws_security_group.web.id]\n\n  tags = merge(local.common_tags, { Name = \"web-server-prod\" })\n}"},{"type":"p","text":"A root configuration calls this module by pointing `source` at its directory and passing in the variables it declared:"},{"type":"code","text":"# root main.tf — calling the module above\nmodule \"vpc\" {\n  source   = \"./modules/vpc\"\n  vpc_cidr = \"10.0.0.0/16\"\n  common_tags = {\n    Environment = var.environment\n    ManagedBy   = \"terraform\"\n  }\n}\n\n# outputs.tf in the module make its resources usable elsewhere:\nresource \"aws_instance\" \"app\" {\n  subnet_id = module.vpc.public_subnet_id  # module output, referenced by name\n}"},{"type":"subheading","text":"Module Registry (HashiCorp Terraform Registry)"},{"type":"p","text":"Pulling a module from the public registry (or a third party's Git repo) means running code you didn't write with the same permissions your AWS credentials have — treat that source line with the same scrutiny as adding a new dependency to an application. Always pin an exact version (`version = \"5.1.2\"`, not a floating `>= 5.0`) so an upstream update can't silently change what gets provisioned under you, and skim the module's source for anything that looks like it's reaching further than it should before pointing real credentials at it."},{"type":"code","lang":"hcl","text":"# Use a public module from the registry\nmodule \"vpc\" {\n  source  = \"terraform-aws-modules/vpc/aws\"\n  version = \"~> 5.0\"\n\n  name = \"prod-vpc\"\n  cidr = \"10.0.0.0/16\"\n\n  azs             = [\"us-east-1a\", \"us-east-1b\"]\n  private_subnets = [\"10.0.1.0/24\", \"10.0.2.0/24\"]\n  public_subnets  = [\"10.0.101.0/24\", \"10.0.102.0/24\"]\n\n  enable_nat_gateway = true\n  enable_vpn_gateway = true\n\n  tags = local.common_tags\n}"}],"assignments":[{"id":"3.1A","title":"Create a Reusable VPC Module","task":"","taskSteps":["Create a `modules/vpc/` directory with main.tf, variables.tf, outputs.tf","Module should provision:"],"deliverable":"","success":["Module is self-contained and reusable","`terraform plan` shows VPC, subnets, IGW, NAT gateway","Module outputs can be referenced in root configuration","Variables have validation rules"],"validates":"plan"},{"id":"3.1B","title":"Create a Security Group Module + Apply to 3 Environments","task":"","taskSteps":["Create `modules/security_group/` module that accepts:"],"deliverable":"","success":["Module is DRY and doesn't hardcode rule sets","Prod environment has most restrictive rules","Dev environment is more permissive for testing","`terraform plan -var-file=terraform.prod.tfvars` shows different security groups than dev"],"validates":"plan","validatesVarFiles":["terraform.dev.tfvars","terraform.prod.tfvars"]}]},{"id":"3.2","title":"Count and For_Each—Dynamic Resource Creation","isQuiz":false,"objectives":["Use `count` for simple resource duplication","Use `for_each` for complex resource creation patterns","Understand when to use each approach","Implement dynamic security configurations"],"lecture":[{"type":"subheading","text":"Count: Simple Repetition"},{"type":"p","text":"`count` identifies each created resource by its numeric index — `aws_instance.app[0]`, `aws_instance.app[1]`, and so on. That's fine as long as the list never changes shape, but remove item `[1]` from the middle of a list driving `count` and Terraform sees every subsequent index shift by one, which it reads as \"destroy this, create that\" for resources that didn't actually need to change. That fragility is the exact problem `for_each` solves next."},{"type":"code","lang":"hcl","text":"# Create multiple EC2 instances\nresource \"aws_instance\" \"app_servers\" {\n  count           = var.app_server_count\n  ami             = data.aws_ami.ubuntu.id\n  instance_type   = \"t3.medium\"\n  subnet_id       = module.vpc.private_subnet_ids[count.index % length(module.vpc.private_subnet_ids)]\n  security_groups = [aws_security_group.app.id]\n\n  tags = merge(local.common_tags, {\n    Name = \"app-server-${count.index + 1}\"\n  })\n}\n\n# Output all instance IDs\noutput \"app_server_ids\" {\n  value = aws_instance.app_servers[*].id\n}\n\n# Reference specific instance\noutput \"first_app_server_id\" {\n  value = aws_instance.app_servers[0].id\n}"},{"type":"subheading","text":"For_Each: Complex Mapping"},{"type":"p","text":"`for_each` over a map identifies each resource by its *key* instead of a position — `aws_security_group.app[\"web\"]`, `aws_security_group.app[\"api\"]` — so removing `\"api\"` from the map only touches the `\"api\"` resource; every other key's resource is left completely alone on the next `plan`. For anything where entries get added or removed over time (security groups per service, per-environment resources), `for_each` is the safer default; reach for `count` only for genuinely uniform, ordered repetition like \"N identical instances.\""},{"type":"code","lang":"hcl","text":"# Create security groups for multiple applications\nvariable \"security_groups\" {\n  type = map(object({\n    description = string\n    ingress_rule = object({\n      from_port   = number\n      to_port     = number\n      cidr_blocks = list(string)\n    })\n  }))\n\n  default = {\n    web = {\n      description = \"Web tier\"\n      ingress_rule = {\n        from_port   = 80\n        to_port     = 80\n        cidr_blocks = [\"0.0.0.0/0\"]\n      }\n    }\n    api = {\n      description = \"API tier\"\n      ingress_rule = {\n        from_port   = 8080\n        to_port     = 8080\n        cidr_blocks = [\"10.0.0.0/16\"]\n      }\n    }\n    db = {\n      description = \"Database tier\"\n      ingress_rule = {\n        from_port   = 3306\n        to_port     = 3306\n        cidr_blocks = [\"10.0.10.0/24\"]\n      }\n    }\n  }\n}\n\n# Create security group for each application tier\nresource \"aws_security_group\" \"app_tiers\" {\n  for_each    = var.security_groups\n  name_prefix = \"${each.key}-tier-\"\n  description = each.value.description\n  vpc_id      = aws_vpc.main.id\n\n  tags = merge(local.common_tags, { Name = \"${each.key}-tier-sg\" })\n}\n\n# Create ingress rule for each SG\nresource \"aws_vpc_security_group_ingress_rule\" \"app_tiers_ingress\" {\n  for_each           = var.security_groups\n  security_group_id = aws_security_group.app_tiers[each.key].id\n\n  from_port   = each.value.ingress_rule.from_port\n  to_port     = each.value.ingress_rule.to_port\n  ip_protocol = \"tcp\"\n  cidr_ipv4   = join(\",\", each.value.ingress_rule.cidr_blocks)\n  description = \"Ingress for ${each.key} tier\"\n\n  tags = { Name = \"allow-${each.key}\" }\n}\n\n# Output all security group IDs\noutput \"app_tier_sgs\" {\n  value = {\n    for key, sg in aws_security_group.app_tiers : key => sg.id\n  }\n}\n\n# Reference specific SG\noutput \"web_sg_id\" {\n  value = aws_security_group.app_tiers[\"web\"].id\n}"},{"type":"subheading","text":"Count vs. For_Each"},{"type":"bullets","items":["Use Count: Simple repetition, ordered list (create N instances)","Use For_Each: Complex mapping, keyed resources, changes to order don't cause disruption"]}],"assignments":[{"id":"3.2A","title":"Multi-Environment Instance Deployment with Count","task":"","taskSteps":["Create EC2 instances using `count` based on variable `environment_instance_counts`","Each instance gets: unique name, unique subnet (cycling through available subnets), unique tags","Output all instance IDs and private IPs","Set count value to 2 for dev, 4 for staging, 6 for prod"],"deliverable":"","success":["`terraform plan -var-file=terraform.dev.tfvars` shows 2 instances","`terraform plan -var-file=terraform.prod.tfvars` shows 6 instances","Each instance has a unique name and is in a different subnet","Output lists all IPs"],"validates":"plan","validatesVarFiles":["terraform.dev.tfvars","terraform.prod.tfvars"]},{"id":"3.2B","title":"Multi-Tier Security Group Configuration with For_Each","task":"","taskSteps":["Create 4 security groups (web, api, worker, database) using for_each","Each SG defined in a map with description and ingress rules","Create ingress rules for each SG based on the configuration","Dev environment has more permissive rules; prod is highly restrictive","Output all SG IDs keyed by tier name"],"deliverable":"","success":["`terraform plan` shows 4 security groups created","Prod has minimal ingress; dev is more open","Changing SG order in map doesn't cause unnecessary updates","Output is keyed for easy reference"],"validates":"plan"}]},{"id":"3.3","title":"Remote State & Team Collaboration","isQuiz":false,"objectives":["Understand state file security and storage","Configure remote backends (S3, Azure, Terraform Cloud)","Enable state locking for concurrent operations","Implement state encryption and access controls"],"lecture":[{"type":"subheading","text":"Why Remote State?"},{"type":"p","text":"The failure mode remote state with locking actually prevents: two people (or two CI runs) call `terraform apply` from stale local state at the same moment, both compute a plan against infrastructure that's already changed underneath them, and now you have two processes racing to write conflicting state — commonly ending in duplicated resources or one apply silently undoing the other's work. A locking backend (S3 + DynamoDB, or Terraform Cloud) makes the second `apply` simply wait its turn instead of racing."},{"type":"bullets","items":["Local `.tfstate` files are not suitable for teams","Remote backends enable:","State locking (prevent concurrent modifications)","Encryption at rest and in transit","Centralized access control","Disaster recovery","Audit logging"]},{"type":"subheading","text":"S3 Backend with Encryption"},{"type":"p","text":"Treat the state bucket itself as sensitive infrastructure, not an implementation detail: state files routinely contain resource IDs, and — until you've applied Module 4.1's `sensitive` handling everywhere it matters — plaintext secrets too. Versioning lets you recover from a bad `apply` by rolling state back; encryption and a locked-down bucket policy keep that same file from being a soft target if anything else in the account is compromised."},{"type":"code","lang":"hcl","text":"# backend.tf\nterraform {\n  backend \"s3\" {\n    bucket         = \"my-terraform-state-prod\"\n    key            = \"prod/terraform.tfstate\"\n    region         = \"us-east-1\"\n    encrypt        = true\n    dynamodb_table = \"terraform-locks\"\n  }\n}"},{"type":"subheading","text":"Create S3 Bucket & DynamoDB Table for Locking"},{"type":"code","lang":"bash","text":"# Note: This is created outside Terraform (bootstrap)\naws s3api create-bucket --bucket my-terraform-state-prod --region us-east-1\naws s3api put-bucket-versioning --bucket my-terraform-state-prod --versioning-configuration Status=Enabled\naws s3api put-bucket-encryption --bucket my-terraform-state-prod \\\n  --server-side-encryption-configuration '{\n    \"Rules\": [{\n      \"ApplyServerSideEncryptionByDefault\": {\n        \"SSEAlgorithm\": \"AES256\"\n      }\n    }]\n  }'\n\naws dynamodb create-table \\\n  --table-name terraform-locks \\\n  --attribute-definitions AttributeName=LockID,AttributeType=S \\\n  --key-schema AttributeName=LockID,KeyType=HASH \\\n  --billing-mode PAY_PER_REQUEST"},{"type":"subheading","text":"Terraform Cloud Backend"},{"type":"code","lang":"hcl","text":"terraform {\n  cloud {\n    organization = \"my-org\"\n\n    workspaces {\n      name = \"prod\"\n    }\n  }\n}"},{"type":"subheading","text":"State File Security Best Practices"},{"type":"bullets","items":["Enable versioning on S3 bucket","Use bucket policies to restrict access (IAM)","Enable MFA delete","Enable CloudTrail logging for S3 access","Use KMS key for additional encryption layer","Never commit .tfstate files to Git"]},{"type":"subheading","text":"Accessing Remote State Outputs"},{"type":"code","lang":"hcl","text":"# In another Terraform configuration\ndata \"terraform_remote_state\" \"vpc\" {\n  backend = \"s3\"\n  config = {\n    bucket = \"my-terraform-state-prod\"\n    key    = \"prod/terraform.tfstate\"\n    region = \"us-east-1\"\n  }\n}\n\n# Reference VPC ID from remote state\nresource \"aws_security_group\" \"app\" {\n  vpc_id      = data.terraform_remote_state.vpc.outputs.vpc_id\n  name_prefix = \"app-tier-\"\n}"}],"assignments":[{"id":"3.3A","title":"Configure S3 Backend with Locking & Encryption","task":"","taskSteps":["Create an S3 bucket with:"],"deliverable":"","success":["`terraform init` initializes with S3 backend","Local .tfstate file is deleted after migration","`terraform state list` shows resources (confirming state is in S3)","S3 bucket has versioning and encryption enabled"],"validates":"validate","validatesNote":"Checks syntax only — confirming the backend migration and state file structure needs reviewing `terraform init`/`state list` output yourself."},{"id":"3.3B","title":"Multi-Environment State Files with Backend Configuration","task":"","taskSteps":["Create separate backend configurations for dev, staging, prod:"],"deliverable":"","success":["`terraform init -backend-config=\"key=dev/terraform.tfstate\"` initializes dev","`terraform init -backend-config=\"key=prod/terraform.tfstate\"` initializes prod","Each environment has separate state file in S3","CloudTrail logs all S3 access to state files"],"validates":"validate","validatesNote":"Checks syntax only — confirming separate state files per environment needs reviewing `terraform init -backend-config=...` output yourself."}]},{"id":"3.4","title":"Quiz & Knowledge Check","isQuiz":true,"quizId":"quiz-3","objectives":[],"lecture":[],"assignments":[]}]},{"id":"phase-4","num":4,"title":"SECURITY, COMPLIANCE & ENTERPRISE PATTERNS","weeks":"Weeks 7-8: Security-Focused Infrastructure","modules":[{"id":"4.1","title":"Secrets Management & Sensitive Data","isQuiz":false,"objectives":["Handle secrets securely in Terraform","Integrate AWS Secrets Manager, HashiCorp Vault","Prevent accidental secret exposure","Implement rotation and audit logging"],"lecture":[{"type":"subheading","text":"Managing Database Credentials Securely"},{"type":"p","text":"The pattern below — generate the password with Terraform's `random_password` resource, hand it straight to Secrets Manager, and never assign it to a variable a human typed in — means the plaintext password exists for exactly one Terraform run and then lives only inside Secrets Manager, retrieved at runtime by whatever needs it (an EC2 instance's IAM role, in the success criteria for this assignment) rather than baked into an AMI, a startup script, or an environment variable checked into anything."},{"type":"code","lang":"hcl","text":"# Generate a random password\nresource \"random_password\" \"rds_password\" {\n  length  = 32\n  special = true\n}\n\n# Store in Secrets Manager\nresource \"aws_secretsmanager_secret\" \"rds_password\" {\n  name_prefix = \"rds-\"\n  description = \"RDS master password\"\n\n  recovery_window_in_days = 0  # Delete immediately (for testing only)\n\n  tags = merge(local.common_tags, { Name = \"rds-password-secret\" })\n}\n\nresource \"aws_secretsmanager_secret_version\" \"rds_password\" {\n  secret_id = aws_secretsmanager_secret.rds_password.id\n  secret_string = jsonencode({\n    username = \"admin\"\n    password = random_password.rds_password.result\n  })\n}\n\n# RDS instance using secret\nresource \"aws_db_instance\" \"main\" {\n  identifier     = \"prod-database\"\n  engine         = \"mysql\"\n  engine_version = \"8.0\"\n\n  username = jsondecode(aws_secretsmanager_secret_version.rds_password.secret_string).username\n  password = jsondecode(aws_secretsmanager_secret_version.rds_password.secret_string).password\n\n  allocated_storage = 100\n  storage_type      = \"gp3\"\n  storage_encrypted = true\n\n  db_subnet_group_name   = aws_db_subnet_group.main.name\n  vpc_security_group_ids = [aws_security_group.db.id]\n\n  multi_az                 = true\n  backup_retention_days    = 30\n  skip_final_snapshot      = false\n  final_snapshot_identifier = \"prod-database-final-snapshot-${formatdate(\"YYYY-MM-DD-hhmm\", timestamp())}\"\n\n  tags = merge(local.common_tags, { Name = \"prod-database\" })\n}\n\n# Output secret ARN (not the secret itself!)\noutput \"rds_secret_arn\" {\n  value       = aws_secretsmanager_secret.rds_password.arn\n  description = \"ARN of RDS password secret\"\n  sensitive   = true\n}"},{"type":"subheading","text":"Prevent Secrets in State with `sensitive = true`"},{"type":"p","text":"This is the misconception worth being precise about: `sensitive = true` stops a value from being printed in `plan`/`apply` output and in `terraform output` — it does **not** encrypt it or omit it from the state file. The password is still sitting in plaintext inside `.tfstate` either way. That's *why* Module 3.3's encrypted, access-controlled remote state backend isn't optional once real secrets are involved — `sensitive` protects your terminal output; the backend is what actually protects the data."},{"type":"code","lang":"hcl","text":"output \"database_password\" {\n  value       = random_password.rds_password.result\n  sensitive   = true  # Prevents logging in terraform apply output\n  description = \"RDS master password (sensitive)\"\n}\n\n# Even better: Don't output secrets directly, reference the secret\noutput \"database_secret_arn\" {\n  value       = aws_secretsmanager_secret.rds_password.arn\n  description = \"ARN to fetch password from Secrets Manager\"\n  sensitive   = false\n}"},{"type":"subheading","text":"HashiCorp Vault Integration"},{"type":"code","lang":"hcl","text":"terraform {\n  required_providers {\n    vault = {\n      source  = \"hashicorp/vault\"\n      version = \"~> 3.0\"\n    }\n  }\n}\n\nprovider \"vault\" {\n  address = \"https://vault.example.com\"\n  # Authentication via environment variable VAULT_TOKEN or IAM\n}\n\n# Fetch secret from Vault\ndata \"vault_generic_secret\" \"api_key\" {\n  path = \"secret/data/api-keys/prod\"\n}\n\nresource \"aws_instance\" \"app\" {\n  ami                          = data.aws_ami.ubuntu.id\n  instance_type                = \"t3.medium\"\n  associate_public_ip_address  = false\n\n  tags = merge(local.common_tags, { Name = \"app-server\" })\n}"},{"type":"subheading","text":"Block Accidental Secret Exposure in Git"},{"type":"code","lang":"text","text":"# In .gitignore\n*.tfstate\n*.tfstate.*\n.terraform/\n.env\nterraform.tfvars\noverride.tf"}],"assignments":[{"id":"4.1A","title":"Secure RDS Deployment with Secrets Manager","task":"","taskSteps":["Create an RDS MySQL instance with:"],"deliverable":"","success":["RDS is created without public IP","Password is not exposed in terraform apply output","Secret is stored in Secrets Manager","EC2 IAM role can fetch the secret","`terraform plan` shows no sensitive data leakage"],"validates":"plan"},{"id":"4.1B","title":"Rotate Secrets Using Lambda & EventBridge","task":"","taskSteps":["Create a Lambda function that rotates RDS password monthly","Configure EventBridge rule to trigger Lambda on schedule (1st of month)","Lambda updates RDS password and stores new password in Secrets Manager","Implement notification via SNS when rotation occurs"],"deliverable":"","success":["Lambda is triggered by EventBridge schedule","Lambda can update RDS password","New password is stored in Secrets Manager","SNS notification is sent after rotation","Logs show successful rotation"],"validates":"validate","validatesNote":"Checks syntax only — confirming the rotation actually runs (Lambda trigger, SNS notification) needs live testing in AWS, not just validate."}]},{"id":"4.2","title":"Compliance & Audit Logging","isQuiz":false,"objectives":["Implement comprehensive logging and monitoring","Track infrastructure changes with CloudTrail","Enable VPC Flow Logs for network monitoring","Implement cost allocation tags for compliance"],"lecture":[{"type":"subheading","text":"CloudTrail for API Audit Logging"},{"type":"p","text":"Multi-region trail coverage and log file validation are both here for the same reason: an attacker with temporary access will often pivot to a region your team doesn't normally look at, and log file validation (SHA-256 digests Terraform enables here) is what lets you later prove in an investigation that a CloudTrail log wasn't tampered with after the fact — not just that logging was \"on.\""},{"type":"code","lang":"hcl","text":"resource \"aws_s3_bucket\" \"cloudtrail_logs\" {\n  bucket_prefix = \"cloudtrail-logs-\"\n\n  tags = merge(local.common_tags, { Name = \"cloudtrail-logs\" })\n}\n\nresource \"aws_s3_bucket_versioning\" \"cloudtrail_logs\" {\n  bucket = aws_s3_bucket.cloudtrail_logs.id\n  versioning_configuration {\n    status = \"Enabled\"\n  }\n}\n\nresource \"aws_s3_bucket_public_access_block\" \"cloudtrail_logs\" {\n  bucket = aws_s3_bucket.cloudtrail_logs.id\n\n  block_public_acls       = true\n  block_public_policy     = true\n  ignore_public_acls      = true\n  restrict_public_buckets = true\n}\n\nresource \"aws_s3_bucket_policy\" \"cloudtrail_logs\" {\n  bucket = aws_s3_bucket.cloudtrail_logs.id\n\n  policy = jsonencode({\n    Version = \"2012-10-17\"\n    Statement = [\n      {\n        Effect    = \"Allow\"\n        Principal = { Service = \"cloudtrail.amazonaws.com\" }\n        Action    = \"s3:GetBucketVersioning\"\n        Resource  = aws_s3_bucket.cloudtrail_logs.arn\n      },\n      {\n        Effect    = \"Allow\"\n        Principal = { Service = \"cloudtrail.amazonaws.com\" }\n        Action    = \"s3:PutObject\"\n        Resource  = \"${aws_s3_bucket.cloudtrail_logs.arn}/*\"\n        Condition = {\n          StringEquals = { \"s3:x-amz-acl\" = \"bucket-owner-full-control\" }\n        }\n      }\n    ]\n  })\n}\n\nresource \"aws_cloudtrail\" \"main\" {\n  name                          = \"organization-trail\"\n  s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.id\n  include_global_service_events = true\n  is_multi_region_trail         = true\n  enable_log_file_validation    = true\n  depends_on                    = [aws_s3_bucket_policy.cloudtrail_logs]\n\n  event_selector {\n    read_write_type           = \"All\"\n    include_management_events = true\n  }\n\n  tags = merge(local.common_tags, { Name = \"organization-trail\" })\n}"},{"type":"subheading","text":"VPC Flow Logs for Network Monitoring"},{"type":"p","text":"CloudTrail and Flow Logs answer different questions and both matter for a complete picture: CloudTrail records *API calls* (who created/modified/deleted a resource, from where), while Flow Logs record *network traffic* (what actually talked to what, on which port, accepted or rejected) — including traffic between resources that never touched the AWS API at all, like one EC2 instance quietly connecting to another it shouldn't be able to reach."},{"type":"code","lang":"hcl","text":"resource \"aws_cloudwatch_log_group\" \"vpc_flow_logs\" {\n  name              = \"/aws/vpc/flow-logs\"\n  retention_in_days = 90\n\n  tags = merge(local.common_tags, { Name = \"vpc-flow-logs\" })\n}\n\nresource \"aws_iam_role\" \"vpc_flow_logs\" {\n  name_prefix = \"vpc-flow-logs-\"\n\n  assume_role_policy = jsonencode({\n    Version = \"2012-10-17\"\n    Statement = [{\n      Effect    = \"Allow\"\n      Principal = { Service = \"vpc-flow-logs.amazonaws.com\" }\n      Action    = \"sts:AssumeRole\"\n    }]\n  })\n\n  tags = merge(local.common_tags, { Name = \"vpc-flow-logs-role\" })\n}\n\nresource \"aws_iam_role_policy\" \"vpc_flow_logs\" {\n  name_prefix = \"vpc-flow-logs-\"\n  role        = aws_iam_role.vpc_flow_logs.id\n\n  policy = jsonencode({\n    Version = \"2012-10-17\"\n    Statement = [{\n      Effect = \"Allow\"\n      Action = [\n        \"logs:CreateLogGroup\",\n        \"logs:CreateLogStream\",\n        \"logs:PutLogEvents\",\n        \"logs:DescribeLogGroups\",\n        \"logs:DescribeLogStreams\"\n      ]\n      Resource = \"${aws_cloudwatch_log_group.vpc_flow_logs.arn}:*\"\n    }]\n  })\n}\n\nresource \"aws_flow_log\" \"vpc\" {\n  iam_role_arn    = aws_iam_role.vpc_flow_logs.arn\n  log_destination = \"${aws_cloudwatch_log_group.vpc_flow_logs.arn}:*\"\n  traffic_type    = \"ALL\"  # ACCEPT, REJECT, or ALL\n  vpc_id          = aws_vpc.main.id\n\n  tags = merge(local.common_tags, { Name = \"vpc-flow-logs\" })\n}"},{"type":"subheading","text":"Mandatory Tagging for Compliance"},{"type":"code","lang":"hcl","text":"variable \"compliance_tags\" {\n  type = object({\n    Owner              = string\n    Environment        = string\n    CostCenter         = string\n    DataClassification = string\n    ComplianceScope    = string\n    BackupPolicy       = string\n    EncryptionRequired = bool\n  })\n\n  description = \"Mandatory compliance tags\"\n\n  validation {\n    condition = contains(\n      [\"Internal\", \"Confidential\", \"Secret\", \"Public\"],\n      var.compliance_tags.DataClassification\n    )\n    error_message = \"DataClassification must be Internal, Confidential, Secret, or Public.\"\n  }\n}\n\nlocals {\n  compliance_tags = {\n    Owner              = var.compliance_tags.Owner\n    Environment        = var.environment\n    CostCenter         = var.compliance_tags.CostCenter\n    DataClassification = var.compliance_tags.DataClassification\n    ComplianceScope    = var.compliance_tags.ComplianceScope\n    BackupPolicy       = var.compliance_tags.BackupPolicy\n    EncryptionRequired = var.compliance_tags.EncryptionRequired\n    ManagedBy          = \"Terraform\"\n    CreatedDate        = timestamp()\n  }\n}\n\nresource \"aws_instance\" \"example\" {\n  ami           = data.aws_ami.ubuntu.id\n  instance_type = \"t3.medium\"\n\n  tags = merge(local.compliance_tags, { Name = \"example-server\" })\n}"}],"assignments":[{"id":"4.2A","title":"Complete Logging & Audit Setup","task":"","taskSteps":["Create S3 bucket with versioning and encryption for CloudTrail logs","Configure CloudTrail with multi-region support and log file validation","Enable CloudWatch Logs for CloudTrail events","Create VPC Flow Logs to CloudWatch","Set up log retention policies (90 days for Flow Logs, 1 year for CloudTrail)","Create a CloudWatch alarm if suspicious activity is detected (e.g., root access)"],"deliverable":"","success":["CloudTrail is enabled across all regions","S3 bucket is encrypted and versioned","VPC Flow Logs are flowing to CloudWatch","Log retention is set per compliance requirements","CloudWatch alarm is configured"],"validates":"validate","validatesNote":"Checks syntax only — confirming logs are actually flowing and the alarm fires needs verification in the AWS console."},{"id":"4.2B","title":"Tag Compliance Enforcement","task":"","taskSteps":["Create an AWS Config rule that checks for mandatory tags (Owner, Environment, CostCenter, DataClassification, ComplianceScope)","Create SNS topic for non-compliant resource notifications","Create remediation Lambda that automatically tags non-compliant resources","Test with a resource created without proper tags"],"deliverable":"","success":["Config rule detects resources missing mandatory tags","SNS notification is sent","Lambda automatically applies missing tags","Non-compliant resources become compliant"],"validates":"validate","validatesNote":"Checks syntax only — confirming detection and auto-remediation actually work needs a live test against a non-compliant resource."}]},{"id":"4.3","title":"Infrastructure Testing & Validation","isQuiz":false,"objectives":["Validate infrastructure before deployment","Implement Terraform fmt, validate, and plan reviews","Use Checkov for policy as code scanning","Integrate testing into CI/CD pipeline"],"lecture":[{"type":"subheading","text":"Terraform Validation"},{"type":"p","text":"It's worth being precise about what each command actually checks, since they catch different classes of mistakes: `fmt` only fixes whitespace/style; `validate` checks that your HCL is syntactically correct and internally consistent (referencing a variable that doesn't exist, a type mismatch) *without* needing any cloud credentials or network access; `plan` goes further and checks against real provider state, which is the only one of the three that can catch \"this security group rule conflicts with an existing one.\" Run `validate` constantly (it's instant and free) and treat a clean `plan` as the real gate before `apply`."},{"type":"code","lang":"bash","text":"# Format code\nterraform fmt -recursive\n\n# Validate syntax\nterraform validate\n\n# Run terraform plan and save to file\nterraform plan -out=tfplan\nterraform show -json tfplan > tfplan.json\n\n# Review before apply\nterraform plan\n# (manual review)\nterraform apply"},{"type":"subheading","text":"Checkov: Policy as Code for Terraform"},{"type":"p","text":"Checkov (and tools like it — tfsec, Terrascan) scan your `.tf` files for known-bad patterns — a security group open to `0.0.0.0/0`, an unencrypted S3 bucket, a database with public accessibility enabled — *before* anything is ever created, which is a fundamentally cheaper time to catch a misconfiguration than after `apply`. Wiring a scan like this into CI as a required check (rather than a manual step someone might skip) is what turns \"we have a security policy\" into \"it's actually enforced.\""},{"type":"code","lang":"bash","text":"# Install Checkov\npip install checkov\n\n# Scan Terraform configuration\ncheckov -d . --framework terraform\n\n# Scan and output JSON report\ncheckov -d . --framework terraform -o json > checkov_report.json"},{"type":"subheading","text":"Example Checkov Policy (Custom)"},{"type":"code","lang":"python","text":"# checks/cis_aws_foundations.py\nfrom checkov.common.checks.base_check import BaseResourceCheck\nfrom checkov.runner_filter import RunnerFilter\nfrom checkov.terraform.checks.resource.registry import Registry\n\nclass EBSEncryption(BaseResourceCheck):\n    name = \"Ensure EBS volumes are encrypted\"\n    id = \"CKV_AWS_2\"\n    supported_resources = [\"aws_ebs_volume\", \"aws_instance\"]\n\n    def scan_resource_conf(self, conf):\n        if self.entity_type == \"aws_ebs_volume\":\n            if \"encrypted\" in conf:\n                if conf[\"encrypted\"][0]:\n                    return CheckResult.PASSED\n        elif self.entity_type == \"aws_instance\":\n            if \"root_block_device\" in conf:\n                root_device = conf[\"root_block_device\"][0]\n                if isinstance(root_device, dict):\n                    if root_device.get(\"encrypted\", [False])[0]:\n                        return CheckResult.PASSED\n        return CheckResult.FAILED\n\ncheck = EBSEncryption()"},{"type":"subheading","text":"Terraform Test Framework (TF Test)"},{"type":"code","lang":"hcl","text":"# tests/vpc_test.tf\nrun \"vpc_creation\" {\n  command = apply\n\n  variables {\n    vpc_name              = \"test-vpc\"\n    vpc_cidr              = \"10.0.0.0/16\"\n    public_subnet_cidrs   = [\"10.0.1.0/24\"]\n    private_subnet_cidrs  = [\"10.0.10.0/24\"]\n  }\n\n  assert {\n    condition     = aws_vpc.main.cidr_block == \"10.0.0.0/16\"\n    error_message = \"VPC CIDR block is incorrect\"\n  }\n\n  assert {\n    condition     = length(aws_subnet.public) == 1\n    error_message = \"Expected 1 public subnet\"\n  }\n}\n\nrun \"vpc_destruction\" {\n  command = destroy\n}"}],"assignments":[{"id":"4.3A","title":"Pre-Deployment Security Scanning with Checkov","task":"","taskSteps":["Install Checkov","Scan your Terraform code with Checkov","Fix all HIGH and CRITICAL findings:"],"deliverable":"","success":["All HIGH/CRITICAL findings are resolved","Checkov scan shows no violations","Suppressed checks have documented justifications","Report is generated and saved"],"validates":"validate","validatesNote":"Checks Terraform syntax only — the Checkov scan itself must be run locally; this doesn't confirm HIGH/CRITICAL findings are resolved."},{"id":"4.3B","title":"Terraform Tests for Infrastructure Validation","task":"","taskSteps":["Create test files for your VPC module:"],"deliverable":"","success":["All tests pass","Tests validate both resource creation and output values","At least one test validates error conditions","Terraform test runs without errors"],"validates":"test"}]},{"id":"4.4","title":"Quiz & Knowledge Check","isQuiz":true,"quizId":"quiz-4","objectives":[],"lecture":[],"assignments":[]}]},{"id":"phase-5","num":5,"title":"CAPSTONE PROJECTS & REAL-WORLD SCENARIOS","weeks":"Weeks 8-10: Building Complete Solutions","modules":[]}],"capstones":[{"id":"capstone-1","title":"Secure Multi-Tier Web Application Infrastructure","intro":[],"requirements":[{"type":"p","text":"You will build production-ready infrastructure for a secure web application with the following components:"},{"type":"subheading","text":"Architecture Components"},{"type":"steps","items":["**Networking:**"]},{"type":"bullets","items":["VPC with public and private subnets across 2 AZs","Internet Gateway, NAT Gateways","Network ACLs and Security Groups (three-tier)","VPC Flow Logs enabled"]},{"type":"steps","items":["**Compute:**"]},{"type":"bullets","items":["Application Load Balancer (ALB) in public subnets","EC2 instances in private subnets (auto-scaling group)","Bastion host in public subnet for administrative access"]},{"type":"steps","items":["**Database:**"]},{"type":"bullets","items":["RDS MySQL instance in private subnet, multi-AZ","Encrypted at rest with KMS","Automated backups and snapshots"]},{"type":"steps","items":["**Storage:**"]},{"type":"bullets","items":["S3 bucket for application assets (encrypted, versioned, not public)","S3 bucket for application logs (lifecycle policies)"]},{"type":"steps","items":["**Security:**"]},{"type":"bullets","items":["All passwords in Secrets Manager","IAM roles for EC2 instances and Lambda","VPC endpoints for private AWS service access","AWS Systems Manager Session Manager for bastion-less access"]},{"type":"steps","items":["**Monitoring & Logging:**"]},{"type":"bullets","items":["CloudTrail for API audit logging","VPC Flow Logs for network monitoring","CloudWatch Logs for application logs","CloudWatch alarms for cost and security anomalies"]},{"type":"steps","items":["**Compliance:**"]},{"type":"bullets","items":["Mandatory resource tagging (Owner, Environment, CostCenter, DataClassification, ComplianceScope)","Config rules for tag compliance","Terraform modules for reusability"]}],"deliverables":[{"type":"bullets","items":["Complete Terraform configuration (modules + root)","`terraform.prod.tfvars` configuration","Comprehensive `README.md` with architecture diagram, setup instructions, security considerations","`COMPLIANCE.md` documenting how infrastructure meets compliance requirements","Cost estimation report","Deployment guide with pre-deployment checklist"]}],"success":[{"type":"bullets","items":["`terraform validate` and `terraform fmt` pass","`terraform plan` shows no errors/warnings","Checkov scan shows no HIGH/CRITICAL findings","All resources are properly tagged","Application is accessible via ALB","All logging is configured and functional"]}],"estimatedTime":"30-40 hours"},{"id":"capstone-2","title":"Security Compliance Framework (PCI-DSS for E-Commerce)","intro":[],"requirements":[{"type":"p","text":"Design a Terraform-based infrastructure that meets PCI-DSS compliance requirements for an e-commerce platform."},{"type":"subheading","text":"Compliance Components"},{"type":"steps","items":["**Network Architecture:**"]},{"type":"bullets","items":["Cardholder Data Environment (CDE) isolated in private subnets","DMZ in public subnets for frontend","Requirement 1: Firewall configuration (Security Groups, NACLs)","Requirement 2: Default security parameters"]},{"type":"steps","items":["**Access Control:**"]},{"type":"bullets","items":["IAM roles with least privilege","Bastion host for administrative access","MFA requirements documented","Requirement 3: Restrict access by business need-to-know"]},{"type":"steps","items":["**Encryption:**"]},{"type":"bullets","items":["TLS 1.2+ for data in transit","AES-256 for data at rest","Key management in AWS KMS","Requirement 4: Encryption of cardholder data"]},{"type":"steps","items":["**Monitoring & Logging:**"]},{"type":"bullets","items":["All access to cardholder data logged","90-day log retention","Log integrity validation","Real-time alerting","Requirement 10: Logging and monitoring"]},{"type":"steps","items":["**Vulnerability Management:**"]},{"type":"bullets","items":["Regular vulnerability scanning configuration","Patch management automation","Requirement 6: Secure development and maintenance"]},{"type":"steps","items":["**Certification & Assessment:**"]},{"type":"bullets","items":["AWS Config rules for continuous compliance","Custom checks for PCI-DSS requirements","Assessment report generation"]}],"deliverables":[{"type":"bullets","items":["Terraform modules for PCI-DSS compliance","`pci-dss-compliance.tf` configuration","`PCI_DSS_MAPPING.md` documenting how each requirement is addressed","Terraform cloud setup for compliance as code","Evidence collection script for audits","Compliance assessment checklist"]}],"success":[{"type":"bullets","items":["All PCI-DSS Requirement sections (1-10) are addressed in code","Config rules automatically detect non-compliance","Logging captures all access to sensitive data","Infrastructure passes security scanning"]}],"estimatedTime":"35-45 hours"},{"id":"capstone-3","title":"Disaster Recovery & Business Continuity","intro":[],"requirements":[{"type":"p","text":"Design a Terraform-based DR/BC solution with failover capabilities."},{"type":"subheading","text":"DR Components"},{"type":"steps","items":["**Primary Region Infrastructure:**"]},{"type":"bullets","items":["All resources deployed in us-east-1","Database with automated backups"]},{"type":"steps","items":["**Disaster Recovery Region:**"]},{"type":"bullets","items":["Standby infrastructure in us-west-2","RDS read replica"]},{"type":"steps","items":["**Failover Automation:**"]},{"type":"bullets","items":["Lambda function to promote read replica to standalone","Route 53 health checks and failover routing","SNS notifications for failover events"]},{"type":"steps","items":["**Testing & Validation:**"]},{"type":"bullets","items":["Terraform test plan for DR failover","RTO/RPO documentation","Failover runbook"]}],"deliverables":[{"type":"bullets","items":["Multi-region Terraform configuration","Route 53 failover setup","Lambda failover automation","DR test plan and results","RTO/RPO calculations"]}],"success":[{"type":"bullets","items":["Primary region fully functional","Secondary region can assume workload with automated failover","Failover time < 5 minutes (RTO)","Data loss < 1 hour (RPO)","Test failover successful"]}],"estimatedTime":"25-35 hours"}]};
const TERRAFORM_QUIZZES = [{"id":"quiz-1","num":1,"title":"Foundations","passScore":{"correct":6,"total":8,"pct":75},"questions":[{"q":"What is the key difference between imperative and declarative IaC?","options":[{"label":"A","text":"Imperative is faster","correct":false},{"label":"B","text":"Imperative describes steps to reach state; declarative describes desired state","correct":true},{"label":"C","text":"Declarative is only for Kubernetes","correct":false},{"label":"D","text":"They are the same","correct":false}]},{"q":"What does the Terraform state file store?","options":[{"label":"A","text":"Configuration only","correct":false},{"label":"B","text":"Real-world resource IDs, metadata, and attributes","correct":true},{"label":"C","text":"Credentials only","correct":false},{"label":"D","text":"Logs of all operations","correct":false}]},{"q":"In the Terraform lifecycle, what does `terraform plan` do?","options":[{"label":"A","text":"Applies all changes immediately","correct":false},{"label":"B","text":"Destroys all infrastructure","correct":false},{"label":"C","text":"Shows what changes will be made without applying them","correct":true},{"label":"D","text":"Deletes the state file","correct":false}]},{"q":"Why is state file security important in an InfoSec context?","options":[{"label":"A","text":"State files don't matter","correct":false},{"label":"B","text":"State files contain sensitive data (passwords, keys) and should be encrypted/remotely stored","correct":true},{"label":"C","text":"Only DevOps teams need to worry about this","correct":false},{"label":"D","text":"State is automatically encrypted","correct":false}]},{"q":"What is a Terraform provider?","options":[{"label":"A","text":"A person who manages Terraform","correct":false},{"label":"B","text":"A plugin that enables Terraform to interact with APIs (AWS, Azure, GCP, etc.)","correct":true},{"label":"C","text":"A backup service","correct":false},{"label":"D","text":"A configuration file","correct":false}]},{"q":"Which block would you use to accept user input in Terraform?","options":[{"label":"A","text":"`locals`","correct":false},{"label":"B","text":"`output`","correct":false},{"label":"C","text":"`variable`","correct":true},{"label":"D","text":"`resource`","correct":false}]},{"q":"What does the `required_providers` block do?","options":[{"label":"A","text":"Lists required team members","correct":false},{"label":"B","text":"Specifies provider versions and sources","correct":true},{"label":"C","text":"Creates providers","correct":false},{"label":"D","text":"Backs up state","correct":false}]},{"q":"In a security context, which Terraform storage backend would you recommend for team environments?","options":[{"label":"A","text":"Local .tfstate file","correct":false},{"label":"B","text":"Git repository","correct":false},{"label":"C","text":"S3 with encryption, Terraform Cloud, or Azure Storage","correct":true},{"label":"D","text":"Any of the above equally","correct":false}]}],"topic":null,"comingSoon":false,"phase":1},{"id":"quiz-2","num":2,"title":"Core Concepts","passScore":{"correct":8,"total":10,"pct":80},"questions":[{"q":"What is a data source in Terraform?","options":[{"label":"A","text":"A backup of state files","correct":false},{"label":"B","text":"A way to query and fetch existing infrastructure","correct":true},{"label":"C","text":"A file that stores sensitive credentials","correct":false},{"label":"D","text":"A resource that creates infrastructure","correct":false}]},{"q":"Why use locals instead of hardcoding values?","options":[{"label":"A","text":"Terraform requires it","correct":false},{"label":"B","text":"DRY principle, reusability, and easier maintenance","correct":true},{"label":"C","text":"Locals are faster than variables","correct":false},{"label":"D","text":"No real benefit","correct":false}]},{"q":"What is the benefit of using separate .tfvars files for dev/prod?","options":[{"label":"A","text":"Faster deployment","correct":false},{"label":"B","text":"Different configurations per environment, easy switching","correct":true},{"label":"C","text":"Required by Terraform","correct":false},{"label":"D","text":"Improves security automatically","correct":false}]},{"q":"In a security group, why would you reference another security group in an ingress rule?","options":[{"label":"A","text":"Required by AWS","correct":false},{"label":"B","text":"Makes the rule more permissive","correct":false},{"label":"C","text":"Establishes a trust relationship between tiers without exposing CIDR blocks","correct":true},{"label":"D","text":"Improves performance","correct":false}]},{"q":"What is the security benefit of implementing a bastion host?","options":[{"label":"A","text":"No benefit","correct":false},{"label":"B","text":"Single point for logging/auditing SSH access and hiding internal servers","correct":true},{"label":"C","text":"Faster connections","correct":false},{"label":"D","text":"Reduces infrastructure costs","correct":false}]},{"q":"Why use `aws_vpc_security_group_ingress_rule` instead of inline ingress blocks?","options":[{"label":"A","text":"Inline blocks are better","correct":false},{"label":"B","text":"Separate rules allow independent management and prevent accidental deletions","correct":true},{"label":"C","text":"Required for security groups","correct":false},{"label":"D","text":"Makes Terraform run faster","correct":false}]},{"q":"What should outputs be used for?","options":[{"label":"A","text":"Storing secrets","correct":false},{"label":"B","text":"Exporting infrastructure values for other modules or external consumption","correct":true},{"label":"C","text":"Configuration only","correct":false},{"label":"D","text":"Debugging only","correct":false}]},{"q":"What is the purpose of the `lifecycle` block with `create_before_destroy = true`?","options":[{"label":"A","text":"Deletes resources faster","correct":false},{"label":"B","text":"Creates new resource before destroying old one (zero-downtime updates)","correct":true},{"label":"C","text":"Required for all resources","correct":false},{"label":"D","text":"Improves security","correct":false}]},{"q":"In a three-tier architecture, which tier should be accessible from the internet?","options":[{"label":"A","text":"Database","correct":false},{"label":"B","text":"Application","correct":false},{"label":"C","text":"Web tier only","correct":true},{"label":"D","text":"All tiers","correct":false}]},{"q":"Why validate input variables in Terraform?","options":[{"label":"A","text":"Not necessary","correct":false},{"label":"B","text":"To catch invalid inputs early and ensure compliance requirements","correct":true},{"label":"C","text":"Required by AWS","correct":false},{"label":"D","text":"To make Terraform faster","correct":false}]}],"topic":null,"comingSoon":false,"phase":2},{"id":"quiz-3","num":3,"title":"Advanced Patterns","passScore":{"correct":8,"total":10,"pct":80},"questions":[],"topic":"Covers modules, count/for_each, and remote state.","comingSoon":true,"phase":3},{"id":"quiz-4","num":4,"title":"Security & Compliance","passScore":{"correct":8,"total":10,"pct":80},"questions":[],"topic":"Covers secrets management, logging, compliance, and testing.","comingSoon":true,"phase":4}];

function useTerraformSubRoute() {
  function resolve() {
    const raw = window.location.hash.replace(/^#/, "");
    if (!raw.startsWith("terraform")) return [];
    const rest = raw.slice("terraform".length).replace(/^\//, "");
    return rest ? rest.split("/") : [];
  }
  const [segments, setSegments] = useState(resolve);
  useEffect(() => {
    function onHashChange() { setSegments(resolve()); }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function navigate(path) {
    window.location.hash = path ? `terraform/${path}` : "terraform";
  }
  return [segments, navigate];
}

function DEFAULT_TERRAFORM_PROGRESS_SHAPE() {
  return { phase: 1, module: "1.1", completedAssignments: [], quizzes: {}, capstones: {}, lastUpdated: null };
}

const TOTAL_ASSIGNMENTS = TERRAFORM_CURRICULUM.phases.reduce(
  (n, p) => n + p.modules.reduce((m, mod) => m + mod.assignments.length, 0),
  0
);
const TOTAL_QUIZZES = TERRAFORM_QUIZZES.length;
const TOTAL_CAPSTONES = TERRAFORM_CURRICULUM.capstones.length;

function terraformStats(progress) {
  const p = progress || DEFAULT_TERRAFORM_PROGRESS_SHAPE();
  const assignmentsDone = (p.completedAssignments || []).length;
  const quizzesPassed = Object.values(p.quizzes || {}).filter((q) => q && q.passed).length;
  const capstonesDone = Object.values(p.capstones || {}).filter((c) => c === "complete").length;
  const totalSteps = TOTAL_ASSIGNMENTS + TOTAL_QUIZZES + TOTAL_CAPSTONES;
  const doneSteps = assignmentsDone + quizzesPassed + capstonesDone;
  return {
    assignmentsDone, totalAssignments: TOTAL_ASSIGNMENTS,
    quizzesPassed, totalQuizzes: TOTAL_QUIZZES,
    capstonesDone, totalCapstones: TOTAL_CAPSTONES,
    pct: totalSteps ? Math.round((doneSteps / totalSteps) * 100) : 0,
  };
}

function findModuleTitle(id) {
  for (const phase of TERRAFORM_CURRICULUM.phases) {
    const mod = phase.modules.find((m) => m.id === id);
    if (mod) return { phase, mod };
  }
  return null;
}

// ---- text rendering: inline **bold** spans within otherwise-plain block text ----
function InlineText({ text }) {
  const parts = String(text || "").split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**")) return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part.startsWith("*") && part.endsWith("*") && part.length > 1) return <em key={i}>{part.slice(1, -1)}</em>;
        return <React.Fragment key={i}>{part}</React.Fragment>;
      })}
    </>
  );
}

function ContentBlocks({ theme, blocks }) {
  if (!blocks || !blocks.length) return null;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {blocks.map((b, i) => {
        if (b.type === "subheading") {
          return (
            <div key={i} style={{ fontSize: "13.5px", fontWeight: 700, color: theme.text, marginTop: i === 0 ? 0 : "4px" }}>
              <InlineText text={b.text} />
            </div>
          );
        }
        if (b.type === "p") {
          return (
            <div key={i} style={{ fontSize: "13.5px", color: theme.textMuted, lineHeight: 1.6 }}>
              <InlineText text={b.text} />
            </div>
          );
        }
        if (b.type === "bullets" || b.type === "steps") {
          const Tag = b.type === "steps" ? "ol" : "ul";
          return (
            <Tag key={i} style={{ margin: 0, paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "5px" }}>
              {b.items.map((it, k) => (
                <li key={k} style={{ fontSize: "13.5px", color: theme.textMuted, lineHeight: 1.55 }}>
                  <InlineText text={it} />
                </li>
              ))}
            </Tag>
          );
        }
        if (b.type === "code") {
          return (
            <pre
              key={i}
              style={{
                margin: 0, padding: "12px 14px", borderRadius: "10px",
                background: theme.chip, border: `1px solid ${theme.cardBorder}`,
                overflowX: "auto", fontSize: "12.5px", lineHeight: 1.5,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                color: theme.text,
              }}
            >
              <code>{b.text}</code>
            </pre>
          );
        }
        return null;
      })}
    </div>
  );
}

function StatTile({ theme, label, value }) {
  return (
    <div style={{ flex: "1 1 100px" }}>
      <div style={{ fontSize: "11px", color: theme.textFaint }}>{label}</div>
      <div className="v-tabular" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "22px", fontWeight: 800, color: theme.text }}>{value}</div>
    </div>
  );
}

// ---- Dashboard tab ----
function TerraformDashboard({ theme, progress, navigate }) {
  const stats = terraformStats(progress);
  const current = findModuleTitle(progress.module);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <Card theme={theme} delay={0}>
        <SectionLabel theme={theme}>Progress</SectionLabel>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "12px" }}>
          <span className="v-tabular" style={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: "30px", fontWeight: 800, color: theme.text }}>{stats.pct}%</span>
          <span style={{ fontSize: "13px", color: theme.textMuted }}>
            {current ? `Module ${current.mod.id}: ${current.mod.title}` : "All modules complete"}
          </span>
        </div>
        <div style={{ display: "flex", gap: "5px", marginBottom: "8px" }}>
          {[1, 2, 3, 4, 5].map((p) => (
            <div
              key={p}
              style={{
                flex: 1, height: "10px", borderRadius: "4px",
                background: p < progress.phase ? theme.accent : p === progress.phase ? theme.accent : theme.progressTrack,
                opacity: p === progress.phase ? 0.55 : 1,
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: "11px", fontWeight: 700, color: theme.textFaint, textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "16px" }}>Phase {progress.phase} of 5</div>
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          <StatTile theme={theme} label="Assignments" value={`${stats.assignmentsDone}/${stats.totalAssignments}`} />
          <StatTile theme={theme} label="Quizzes passed" value={`${stats.quizzesPassed}/${stats.totalQuizzes}`} />
          <StatTile theme={theme} label="Capstones" value={`${stats.capstonesDone}/${stats.totalCapstones}`} />
        </div>
      </Card>

      <Card theme={theme} delay={40}>
        <SectionLabel theme={theme}>What's next</SectionLabel>
        {current ? (
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: theme.text, marginBottom: "4px" }}>
              Module {current.mod.id}: {current.mod.title}
            </div>
            <div style={{ fontSize: "12.5px", color: theme.textFaint, marginBottom: "12px" }}>{current.phase.title}</div>
            <button
              onClick={() => navigate("curriculum")}
              className="v-btn"
              style={{ background: theme.accent, color: theme.accentText, border: "none", borderRadius: "8px", padding: "8px 14px", fontSize: "12.5px", fontWeight: 700 }}
            >
              Open curriculum →
            </button>
          </div>
        ) : (
          <div style={{ fontSize: "13px", color: theme.textFaint }}>All modules complete.</div>
        )}
      </Card>
    </div>
  );
}

// ---- Curriculum tab ----
function AssignmentCheckButton({ theme, label, busyLabel, busy, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={!!busy}
      className="v-btn"
      style={{ ...tfActionBtn(theme, "secondary"), opacity: busy ? 0.6 : 1 }}
    >
      {busy ? busyLabel : label}
    </button>
  );
}

function AssignmentCard({ theme, assignment, moduleId, progress, setProgress, bridgeToken }) {
  const key = moduleId + ":" + assignment.id;
  const done = (progress.completedAssignments || []).includes(key);
  const [checkBusy, setCheckBusy] = useState(null); // null | resultKey string
  const [checkResults, setCheckResults] = useState({}); // { [resultKey]: {type:"success"|"error", text} }

  function toggle() {
    setProgress((prev) => {
      const list = prev.completedAssignments || [];
      const next = done ? list.filter((k) => k !== key) : [...list, key];
      return { ...prev, completedAssignments: next, lastUpdated: new Date().toISOString() };
    });
  }

  function runCheck(action, endpoint, body, resultKey) {
    setCheckBusy(resultKey);
    tfBridgeFetch(bridgeToken, endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || data.error) {
          setCheckResults((prev) => ({ ...prev, [resultKey]: { type: "error", text: data.error || "Failed." } }));
          return;
        }
        if (action === "validate") {
          const valid = data.result && data.result.valid;
          setCheckResults((prev) => ({ ...prev, [resultKey]: { type: valid ? "success" : "error", text: data.raw } }));
        }
        if (action === "plan") {
          setCheckResults((prev) => ({ ...prev, [resultKey]: { type: "success", text: data.output } }));
        }
        if (action === "test") {
          setCheckResults((prev) => ({ ...prev, [resultKey]: { type: "success", text: data.raw } }));
        }
      })
      .catch(() => setCheckResults((prev) => ({ ...prev, [resultKey]: { type: "error", text: "Couldn't reach the bridge — is it still running?" } })))
      .finally(() => setCheckBusy(null));
  }

  const paired = !!bridgeToken;
  const validates = assignment.validates;

  return (
    <div style={{ border: `1px solid ${theme.cardBorder}`, borderRadius: "10px", padding: "12px 14px", background: done ? theme.accentSoft : "transparent" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        <button
          onClick={toggle}
          className="v-btn v-btn--tight"
          title={done ? "Mark not reviewed" : "Mark reviewed/complete"}
          style={{
            width: "20px", height: "20px", borderRadius: "5px", flexShrink: 0, marginTop: "2px",
            border: `1px solid ${done ? "transparent" : theme.cardBorder}`, background: done ? theme.accent : "transparent",
            color: theme.accentText, fontSize: "12px", lineHeight: 1, padding: 0,
          }}
        >
          {done ? "✓" : ""}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13.5px", fontWeight: 700, color: theme.text, marginBottom: "6px" }}>
            Assignment {assignment.id}: {assignment.title}
          </div>
          {assignment.task && <div style={{ fontSize: "12.5px", color: theme.textMuted, marginBottom: "6px" }}><InlineText text={assignment.task} /></div>}
          {assignment.taskSteps && assignment.taskSteps.length > 0 && (
            <ol style={{ margin: "0 0 6px", paddingLeft: "18px" }}>
              {assignment.taskSteps.map((s, i) => (
                <li key={i} style={{ fontSize: "12.5px", color: theme.textMuted, lineHeight: 1.5 }}><InlineText text={s} /></li>
              ))}
            </ol>
          )}
          {assignment.deliverable && (
            <div style={{ fontSize: "12px", color: theme.textFaint, marginBottom: "4px" }}>
              <strong style={{ color: theme.textMuted }}>Deliverable:</strong> <InlineText text={assignment.deliverable} />
            </div>
          )}
          {assignment.success && assignment.success.length > 0 && (
            <div style={{ fontSize: "12px", color: theme.textFaint }}>
              <strong style={{ color: theme.textMuted }}>Success criteria:</strong>
              <ul style={{ margin: "3px 0 0", paddingLeft: "18px" }}>
                {assignment.success.map((s, i) => <li key={i}><InlineText text={s} /></li>)}
              </ul>
            </div>
          )}

          {validates && (
            <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: `1px solid ${theme.divider}` }}>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: theme.textFaint, marginBottom: "4px" }}>
                Check your work
              </div>
              {assignment.validatesNote && (
                <div style={{ fontSize: "11.5px", color: theme.textFaint, marginBottom: "8px", lineHeight: 1.4 }}>{assignment.validatesNote}</div>
              )}
              {!paired ? (
                <div style={{ fontSize: "12px", color: theme.textFaint }}>
                  Pair the Terraform bridge in the Workspace tab to run a real check against your code.
                </div>
              ) : (
                <>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {(validates === "validate" || validates === "plan") && (
                      <AssignmentCheckButton
                        theme={theme}
                        label="Run terraform validate"
                        busyLabel="Validating…"
                        busy={checkBusy === "validate"}
                        onClick={() => runCheck("validate", "/validate", null, "validate")}
                      />
                    )}
                    {validates === "plan" && !assignment.validatesVarFiles && (
                      <AssignmentCheckButton
                        theme={theme}
                        label="Run terraform plan"
                        busyLabel="Planning…"
                        busy={checkBusy === "plan"}
                        onClick={() => runCheck("plan", "/plan", {}, "plan")}
                      />
                    )}
                    {validates === "plan" && assignment.validatesVarFiles && assignment.validatesVarFiles.map((vf) => (
                      <AssignmentCheckButton
                        key={vf}
                        theme={theme}
                        label={`Plan (${vf})`}
                        busyLabel="Planning…"
                        busy={checkBusy === "plan:" + vf}
                        onClick={() => runCheck("plan", "/plan", { varFile: vf }, "plan:" + vf)}
                      />
                    ))}
                    {validates === "test" && (
                      <AssignmentCheckButton
                        theme={theme}
                        label="Run terraform test"
                        busyLabel="Running tests…"
                        busy={checkBusy === "test"}
                        onClick={() => runCheck("test", "/test", null, "test")}
                      />
                    )}
                  </div>
                  {Object.entries(checkResults).map(([k, r]) => (
                    <pre
                      key={k}
                      style={{
                        marginTop: "8px", maxHeight: "220px", overflow: "auto",
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                        fontSize: "11px", lineHeight: 1.5, whiteSpace: "pre-wrap", wordBreak: "break-word",
                        padding: "10px", borderRadius: "8px",
                        background: r.type === "error" ? theme.dangerSoft : theme.chip,
                        color: r.type === "error" ? theme.danger : theme.chipText,
                      }}
                    >
                      {(r.type === "success" ? "✓ " : "✗ ") + k + "\n" + r.text}
                    </pre>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CapstoneCard({ theme, capstone, progress, setProgress }) {
  const status = (progress.capstones || {})[capstone.id] || "not-started";
  function setStatus(next) {
    setProgress((prev) => ({ ...prev, capstones: { ...(prev.capstones || {}), [capstone.id]: next }, lastUpdated: new Date().toISOString() }));
  }
  const STATUSES = [
    { id: "not-started", label: "Not started" },
    { id: "in-progress", label: "In progress" },
    { id: "complete", label: "Complete" },
  ];
  return (
    <Card theme={theme} delay={0}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: theme.text }}>{capstone.title}</div>
          {capstone.estimatedTime && <div style={{ fontSize: "12px", color: theme.textFaint }}>Estimated: {capstone.estimatedTime}</div>}
        </div>
        <Segmented theme={theme} value={status} onChange={setStatus} options={STATUSES} ariaLabel={capstone.title + " status"} />
      </div>
      {capstone.intro && capstone.intro.length > 0 && <div style={{ marginBottom: "10px" }}><ContentBlocks theme={theme} blocks={capstone.intro} /></div>}
      {capstone.requirements && capstone.requirements.length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: theme.textMuted, marginBottom: "6px" }}>Requirements</div>
          <ContentBlocks theme={theme} blocks={capstone.requirements} />
        </div>
      )}
      {capstone.deliverables && capstone.deliverables.length > 0 && (
        <div style={{ marginBottom: "10px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: theme.textMuted, marginBottom: "6px" }}>Deliverables</div>
          <ContentBlocks theme={theme} blocks={capstone.deliverables} />
        </div>
      )}
      {capstone.success && capstone.success.length > 0 && (
        <div>
          <div style={{ fontSize: "12px", fontWeight: 700, color: theme.textMuted, marginBottom: "6px" }}>Success criteria</div>
          <ContentBlocks theme={theme} blocks={capstone.success} />
        </div>
      )}
    </Card>
  );
}

function TerraformCurriculum({ theme, progress, setProgress, bridgeToken }) {
  const allModules = useMemo(() => {
    const out = [];
    TERRAFORM_CURRICULUM.phases.forEach((phase) => phase.modules.forEach((mod) => out.push({ phase, mod })));
    return out;
  }, []);
  const [selected, setSelected] = useState(progress.module || allModules[0].mod.id);
  const [view, setView] = useState("modules");
  const current = allModules.find((x) => x.mod.id === selected) || allModules[0];

  return (
    <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
      <div style={{ flex: "0 0 220px", minWidth: "200px", display: "flex", flexDirection: "column", gap: "10px" }}>
        <Segmented theme={theme} value={view} onChange={setView} options={[{ id: "modules", label: "Modules" }, { id: "capstones", label: "Capstones" }]} ariaLabel="Curriculum view" />
        {view === "modules" && TERRAFORM_CURRICULUM.phases.map((phase) => (
          <div key={phase.id}>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: theme.textFaint, margin: "6px 0 4px" }}>
              Phase {phase.num}
            </div>
            {phase.modules.map((mod) => (
              <button
                key={mod.id}
                onClick={() => setSelected(mod.id)}
                className="v-btn v-btn--tight"
                style={{
                  display: "block", width: "100%", textAlign: "left", padding: "7px 10px", borderRadius: "8px", marginBottom: "3px",
                  fontSize: "12.5px", fontWeight: selected === mod.id ? 700 : 500,
                  background: selected === mod.id ? theme.accentSoft : "transparent",
                  color: selected === mod.id ? theme.accent : theme.text, border: "none",
                }}
              >
                {mod.id} {mod.isQuiz ? "· Quiz" : ""} — {mod.title}
              </button>
            ))}
          </div>
        ))}
      </div>

      <div style={{ flex: "1 1 400px", minWidth: "280px" }}>
        {view === "capstones" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {TERRAFORM_CURRICULUM.capstones.map((c) => (
              <CapstoneCard key={c.id} theme={theme} capstone={c} progress={progress} setProgress={setProgress} />
            ))}
          </div>
        ) : current.mod.isQuiz ? (
          <Card theme={theme} delay={0}>
            <SectionLabel theme={theme}>{current.phase.title} · Module {current.mod.id}</SectionLabel>
            <div style={{ fontSize: "14px", color: theme.text, marginBottom: "10px" }}>{current.mod.title}</div>
            <button
              onClick={() => { window.location.hash = "terraform/quizzes"; }}
              className="v-btn"
              style={{ background: theme.accent, color: theme.accentText, border: "none", borderRadius: "8px", padding: "8px 14px", fontSize: "12.5px", fontWeight: 700 }}
            >
              Go to Quizzes →
            </button>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <Card theme={theme} delay={0}>
              <SectionLabel theme={theme}>{current.phase.title} · {current.phase.weeks}</SectionLabel>
              <div style={{ fontSize: "17px", fontWeight: 700, color: theme.text, marginBottom: "10px" }}>
                Module {current.mod.id}: {current.mod.title}
              </div>
              {current.mod.objectives.length > 0 && (
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: theme.textMuted, marginBottom: "6px" }}>Learning objectives</div>
                  <ul style={{ margin: 0, paddingLeft: "18px" }}>
                    {current.mod.objectives.map((o, i) => (
                      <li key={i} style={{ fontSize: "12.5px", color: theme.textMuted, lineHeight: 1.5 }}><InlineText text={o} /></li>
                    ))}
                  </ul>
                </div>
              )}
              <ContentBlocks theme={theme} blocks={current.mod.lecture} />
            </Card>

            {current.mod.assignments.length > 0 && (
              <Card theme={theme} delay={40}>
                <SectionLabel theme={theme}>Assignments</SectionLabel>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {current.mod.assignments.map((a) => (
                    <AssignmentCard key={a.id} theme={theme} assignment={a} moduleId={current.mod.id} progress={progress} setProgress={setProgress} bridgeToken={bridgeToken} />
                  ))}
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ---- Quizzes tab ----
function TerraformQuizRunner({ theme, quiz, progress, setProgress, onDone }) {
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = quiz.questions[idx];

  function pick(opt) {
    if (revealed) return;
    setSelected(opt.label);
    setRevealed(true);
    if (opt.correct) setCorrectCount((c) => c + 1);
  }

  function next() {
    if (idx + 1 < quiz.questions.length) {
      setIdx(idx + 1);
      setSelected(null);
      setRevealed(false);
    } else {
      const passed = correctCount >= quiz.passScore.correct;
      setProgress((prev) => ({
        ...prev,
        quizzes: { ...(prev.quizzes || {}), [quiz.id]: { passed, score: correctCount, total: quiz.questions.length, attemptedAt: new Date().toISOString() } },
        lastUpdated: new Date().toISOString(),
      }));
      if (passed) toast.success(`${quiz.title}: passed (${correctCount}/${quiz.questions.length}).`);
      else toast.info(`${quiz.title}: ${correctCount}/${quiz.questions.length} — needs ${quiz.passScore.correct}/${quiz.passScore.total} to pass.`);
      setFinished(true);
    }
  }

  if (finished) {
    const passed = correctCount >= quiz.passScore.correct;
    return (
      <Card theme={theme} delay={0}>
        <SectionLabel theme={theme}>{quiz.title} — Result</SectionLabel>
        <div style={{ fontSize: "30px", fontWeight: 800, color: passed ? theme.positive : theme.danger, marginBottom: "6px" }}>
          {correctCount}/{quiz.questions.length}
        </div>
        <div style={{ fontSize: "13px", color: theme.textMuted, marginBottom: "16px" }}>
          {passed ? "Passed" : "Not passed"} — needs {quiz.passScore.correct}/{quiz.passScore.total} ({quiz.passScore.pct}%)
        </div>
        <button
          onClick={onDone}
          className="v-btn"
          style={{ background: theme.accent, color: theme.accentText, border: "none", borderRadius: "8px", padding: "8px 14px", fontSize: "12.5px", fontWeight: 700 }}
        >
          Back to quizzes
        </button>
      </Card>
    );
  }

  return (
    <Card theme={theme} delay={0}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
        <SectionLabel theme={theme} style={{ margin: 0 }}>{quiz.title}</SectionLabel>
        <span className="v-tabular" style={{ fontSize: "12px", color: theme.textFaint }}>Question {idx + 1}/{quiz.questions.length}</span>
      </div>
      <div style={{ fontSize: "15px", fontWeight: 700, color: theme.text, marginBottom: "14px" }}>{question.q}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "16px" }}>
        {question.options.map((opt) => {
          const isSelected = selected === opt.label;
          const showCorrect = revealed && opt.correct;
          const showWrong = revealed && isSelected && !opt.correct;
          return (
            <button
              key={opt.label}
              onClick={() => pick(opt)}
              disabled={revealed}
              className="v-btn"
              style={{
                textAlign: "left", padding: "10px 12px", borderRadius: "9px", fontSize: "13px",
                border: `1px solid ${showCorrect ? theme.positive : showWrong ? theme.danger : theme.cardBorder}`,
                background: showCorrect ? theme.accentSoft : showWrong ? theme.dangerSoft : "transparent",
                color: theme.text, cursor: revealed ? "default" : "pointer",
              }}
            >
              <strong>{opt.label})</strong> {opt.text} {showCorrect ? " ✓" : showWrong ? " ✗" : ""}
            </button>
          );
        })}
      </div>
      {revealed && (
        <button
          onClick={next}
          className="v-btn"
          style={{ background: theme.accent, color: theme.accentText, border: "none", borderRadius: "8px", padding: "8px 14px", fontSize: "12.5px", fontWeight: 700 }}
        >
          {idx + 1 < quiz.questions.length ? "Next question →" : "See result"}
        </button>
      )}
    </Card>
  );
}

function TerraformQuizList({ theme, progress, onStart }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {TERRAFORM_QUIZZES.map((quiz) => {
        const attempt = (progress.quizzes || {})[quiz.id];
        return (
          <Card key={quiz.id} theme={theme} delay={0}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: "15px", fontWeight: 700, color: theme.text }}>{quiz.title}</div>
                <div style={{ fontSize: "12px", color: theme.textFaint }}>
                  {quiz.comingSoon
                    ? (quiz.topic || "Not yet written.")
                    : `${quiz.questions.length} questions · pass ${quiz.passScore.correct}/${quiz.passScore.total} (${quiz.passScore.pct}%)`}
                </div>
              </div>
              {quiz.comingSoon ? (
                <span style={{ fontSize: "11.5px", fontWeight: 700, color: theme.textFaint, background: theme.chip, padding: "5px 10px", borderRadius: "999px" }}>
                  Coming soon
                </span>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  {attempt && (
                    <span style={{ fontSize: "11.5px", fontWeight: 700, color: attempt.passed ? theme.positive : theme.textFaint }}>
                      {attempt.passed ? "Passed" : "Attempted"} · {attempt.score}/{attempt.total}
                    </span>
                  )}
                  <button
                    onClick={() => onStart(quiz)}
                    className="v-btn"
                    style={{ background: theme.accent, color: theme.accentText, border: "none", borderRadius: "8px", padding: "7px 12px", fontSize: "12.5px", fontWeight: 700 }}
                  >
                    {attempt ? "Retake" : "Start"}
                  </button>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ---- Page shell ----
// Fixed — never user-editable, so there's nothing to typo. See
// terraform-bridge/README.md for why this is safe to fetch from an HTTPS
// page (127.0.0.1 is exempt from mixed-content blocking) and what the
// bridge actually does with each of these calls.
const TF_BRIDGE_URL = "http://127.0.0.1:4787";

function tfBridgeFetch(token, path, options) {
  const opts = options || {};
  return fetch(TF_BRIDGE_URL + path, { ...opts, headers: { ...(opts.headers || {}), "X-Bridge-Token": token } });
}

const tfActionBtn = (theme, variant) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "6px",
  padding: "8px 14px",
  borderRadius: "8px",
  fontSize: "12.5px",
  fontWeight: 700,
  border: variant === "primary" || variant === "danger" ? "none" : `1px solid ${theme.inputBorder}`,
  background: variant === "primary" ? theme.accent : variant === "danger" ? theme.danger : "transparent",
  color: variant === "primary" ? theme.accentText : variant === "danger" ? "#fff" : theme.text,
});

function TerraformWorkspace({ theme, bridge, setBridge }) {
  const [tokenDraft, setTokenDraft] = useState("");
  const [status, setStatus] = useState(null); // null = loading, "unreachable", or {ready, workspace, terraformVersion}
  const [files, setFiles] = useState([]);
  const [activeFile, setActiveFile] = useState(null);
  const [content, setContent] = useState("");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(null);
  const [output, setOutput] = useState(null); // {type: "success"|"error", text}
  const [pendingPlan, setPendingPlan] = useState(null); // {planId, output}
  const [confirmingApply, setConfirmingApply] = useState(false);

  const paired = !!bridge.token;

  function refreshStatus() {
    if (!bridge.token) return;
    setStatus(null);
    tfBridgeFetch(bridge.token, "/status")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setStatus(data))
      .catch(() => setStatus("unreachable"));
  }

  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bridge.token]);

  useEffect(() => {
    if (!paired || !status || status === "unreachable") return;
    tfBridgeFetch(bridge.token, "/files")
      .then((res) => (res.ok ? res.json() : { files: [] }))
      .then((data) => setFiles(data.files || []))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paired, status]);

  function pair() {
    if (!tokenDraft.trim()) return;
    setBridge({ token: tokenDraft.trim() });
    setTokenDraft("");
  }

  function unpair() {
    setBridge({ token: "" });
    setStatus(null);
    setFiles([]);
    setActiveFile(null);
    setContent("");
    setOutput(null);
    setPendingPlan(null);
  }

  function openFile(name) {
    setBusy("open");
    tfBridgeFetch(bridge.token, `/file?path=${encodeURIComponent(name)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        setActiveFile(name);
        setContent(data.content || "");
        setDirty(false);
        setPendingPlan(null);
        setOutput(null);
      })
      .catch(() => toast.error("Couldn't read that file — is the bridge still running?"))
      .finally(() => setBusy(null));
  }

  function saveFile() {
    if (!activeFile) return;
    setBusy("save");
    tfBridgeFetch(bridge.token, "/file", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: activeFile, content }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(() => setDirty(false))
      .catch(() => toast.error("Couldn't save — is the bridge still running?"))
      .finally(() => setBusy(null));
  }

  function runAction(action, endpoint, body) {
    setBusy(action);
    setOutput(null);
    if (action !== "apply") setPendingPlan(null);
    tfBridgeFetch(bridge.token, endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body || {}),
    })
      .then((res) => res.json().then((data) => ({ ok: res.ok, data })))
      .then(({ ok, data }) => {
        if (!ok || data.error) {
          setOutput({ type: "error", text: data.error || "Failed." });
          return;
        }
        if (action === "fmt") setOutput({ type: "success", text: data.output || "Already formatted — no changes." });
        if (action === "validate") {
          const valid = data.result && data.result.valid;
          setOutput({ type: valid ? "success" : "error", text: data.raw });
        }
        if (action === "plan") {
          setPendingPlan({ planId: data.planId, output: data.output });
          setOutput({ type: "success", text: data.output });
        }
        if (action === "apply") {
          setPendingPlan(null);
          setConfirmingApply(false);
          setOutput({ type: "success", text: data.output });
        }
      })
      .catch(() => setOutput({ type: "error", text: "Couldn't reach the bridge — is it still running?" }))
      .finally(() => setBusy(null));
  }

  if (!paired) {
    return (
      <Card theme={theme}>
        <SectionLabel theme={theme}>Terraform Workspace</SectionLabel>
        <div style={{ fontSize: "13px", color: theme.textMuted, lineHeight: 1.6, marginBottom: "14px" }}>
          Lets you edit, format, validate, and plan/apply a real Terraform project from here — through a small
          companion process you run on your own machine. Hub never holds an AWS credential; this bridge just shells
          out to your own already-configured local <code>terraform</code>.
        </div>
        <ol style={{ margin: "0 0 16px", paddingLeft: "20px", fontSize: "13px", color: theme.text, lineHeight: 1.8 }}>
          <li>
            In a terminal, from this repo: <br />
            <code style={{ background: theme.chip, color: theme.chipText, padding: "2px 6px", borderRadius: "4px" }}>
              node terraform-bridge/terraform-bridge.js /path/to/your/terraform/project
            </code>
          </li>
          <li>It prints a pairing token the first time it runs — copy it.</li>
          <li>Paste it below. Leave that terminal running while you use this tab.</li>
        </ol>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            value={tokenDraft}
            onChange={(e) => setTokenDraft(e.target.value)}
            placeholder="Pairing token"
            aria-label="Bridge pairing token"
            className="v-input"
            style={{ flex: 1, background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: "8px", color: theme.inputText, padding: "9px 12px", fontSize: "13px" }}
          />
          <button onClick={pair} disabled={!tokenDraft.trim()} className="v-btn" style={{ ...tfActionBtn(theme, "primary"), opacity: tokenDraft.trim() ? 1 : 0.6 }}>
            Pair
          </button>
        </div>
      </Card>
    );
  }

  return (
    <Card theme={theme}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", flexWrap: "wrap", gap: "8px" }}>
        <SectionLabel theme={theme}>Terraform Workspace</SectionLabel>
        {status === null ? (
          <span style={{ fontSize: "12px", color: theme.textFaint }}>Checking bridge…</span>
        ) : status === "unreachable" ? (
          <span style={{ fontSize: "12px", color: theme.danger, fontWeight: 700 }}>● Bridge not reachable</span>
        ) : (
          <span style={{ fontSize: "12px", color: theme.positive, fontWeight: 700 }}>
            ● Connected — {status.workspace} ({status.terraformVersion})
          </span>
        )}
      </div>

      {status === "unreachable" && (
        <div style={{ fontSize: "13px", color: theme.danger, background: theme.dangerSoft, borderRadius: "8px", padding: "10px 12px", marginBottom: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
          <span>Make sure <code>terraform-bridge.js</code> is still running in your terminal.</span>
          <button onClick={refreshStatus} className="v-btn" style={{ border: "none", background: "transparent", color: theme.danger, fontWeight: 700, fontSize: "12px", flexShrink: 0 }}>
            Retry
          </button>
        </div>
      )}

      {status && status !== "unreachable" && (
        <>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "12px" }}>
            {files.length === 0 && <span style={{ fontSize: "12.5px", color: theme.textFaint }}>No .tf files found in the workspace.</span>}
            {files.map((f) => (
              <button
                key={f}
                onClick={() => openFile(f)}
                className="v-btn"
                style={{
                  padding: "5px 10px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontWeight: 600,
                  border: `1px solid ${activeFile === f ? theme.accent : theme.inputBorder}`,
                  background: activeFile === f ? theme.accentSoft : "transparent",
                  color: activeFile === f ? theme.text : theme.textMuted,
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {activeFile && (
            <>
              <textarea
                value={content}
                onChange={(e) => { setContent(e.target.value); setDirty(true); }}
                spellCheck={false}
                rows={16}
                aria-label={`Editing ${activeFile}`}
                style={{
                  width: "100%",
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                  fontSize: "12.5px",
                  lineHeight: 1.5,
                  background: theme.inputBg,
                  color: theme.inputText,
                  border: `1px solid ${theme.inputBorder}`,
                  borderRadius: "8px",
                  padding: "12px",
                  resize: "vertical",
                  marginBottom: "6px",
                }}
              />
              {dirty && (
                <div style={{ fontSize: "11.5px", color: theme.textFaint, marginBottom: "10px" }}>
                  Unsaved — Format/Validate/Plan act on the version on disk until you Save.
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
                <button onClick={saveFile} disabled={!dirty || busy === "save"} className="v-btn" style={{ ...tfActionBtn(theme, "primary"), opacity: !dirty || busy === "save" ? 0.6 : 1 }}>
                  {busy === "save" ? "Saving…" : "Save"}
                </button>
                <button onClick={() => runAction("fmt", "/fmt")} disabled={!!busy} className="v-btn" style={{ ...tfActionBtn(theme, "secondary"), opacity: busy ? 0.6 : 1 }}>
                  {busy === "fmt" ? "Formatting…" : "Format"}
                </button>
                <button onClick={() => runAction("validate", "/validate")} disabled={!!busy} className="v-btn" style={{ ...tfActionBtn(theme, "secondary"), opacity: busy ? 0.6 : 1 }}>
                  {busy === "validate" ? "Validating…" : "Validate"}
                </button>
                <button onClick={() => runAction("plan", "/plan")} disabled={!!busy} className="v-btn" style={{ ...tfActionBtn(theme, "secondary"), opacity: busy ? 0.6 : 1 }}>
                  {busy === "plan" ? "Planning…" : "Plan"}
                </button>
                {pendingPlan && !confirmingApply && (
                  <button onClick={() => setConfirmingApply(true)} disabled={!!busy} className="v-btn" style={tfActionBtn(theme, "danger")}>
                    Apply this plan
                  </button>
                )}
                {confirmingApply && (
                  <>
                    <span style={{ fontSize: "12.5px", color: theme.danger, fontWeight: 700, alignSelf: "center" }}>
                      This applies to real infrastructure. Sure?
                    </span>
                    <button
                      onClick={() => runAction("apply", "/apply", { planId: pendingPlan.planId })}
                      disabled={!!busy}
                      className="v-btn"
                      style={tfActionBtn(theme, "danger")}
                    >
                      {busy === "apply" ? "Applying…" : "Yes, apply"}
                    </button>
                    <button onClick={() => setConfirmingApply(false)} className="v-btn" style={tfActionBtn(theme, "secondary")}>
                      Cancel
                    </button>
                  </>
                )}
              </div>

              {output && (
                <pre
                  style={{
                    margin: 0,
                    maxHeight: "320px",
                    overflow: "auto",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
                    fontSize: "11.5px",
                    lineHeight: 1.5,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    padding: "12px",
                    borderRadius: "8px",
                    background: output.type === "error" ? theme.dangerSoft : theme.chip,
                    color: output.type === "error" ? theme.danger : theme.chipText,
                  }}
                >
                  {output.text}
                </pre>
              )}
            </>
          )}
        </>
      )}

      <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: `1px solid ${theme.divider}` }}>
        <button onClick={unpair} className="v-btn" style={{ border: "none", background: "transparent", color: theme.textFaint, fontSize: "11.5px", fontWeight: 600, padding: 0 }}>
          Unpair this browser from the bridge
        </button>
      </div>
    </Card>
  );
}

function TerraformPage({ theme, progress, setProgress }) {
  const [segments, navigate] = useTerraformSubRoute();
  const sub = segments[0] || "";
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [bridge, setBridge] = usePersistentState(STORAGE_KEYS.terraformBridge, { token: "" });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <Segmented
        theme={theme}
        value={sub || "dashboard"}
        onChange={(v) => { setActiveQuiz(null); navigate(v === "dashboard" ? "" : v); }}
        options={[{ id: "dashboard", label: "Dashboard" }, { id: "curriculum", label: "Curriculum" }, { id: "quizzes", label: "Quizzes" }, { id: "workspace", label: "Workspace" }]}
        ariaLabel="Terraform section"
      />

      {sub === "curriculum" && <TerraformCurriculum theme={theme} progress={progress} setProgress={setProgress} bridgeToken={bridge.token} />}
      {sub === "quizzes" && (
        activeQuiz ? (
          <TerraformQuizRunner theme={theme} quiz={activeQuiz} progress={progress} setProgress={setProgress} onDone={() => setActiveQuiz(null)} />
        ) : (
          <TerraformQuizList theme={theme} progress={progress} onStart={setActiveQuiz} />
        )
      )}
      {sub === "workspace" && <TerraformWorkspace theme={theme} bridge={bridge} setBridge={setBridge} />}
      {sub !== "curriculum" && sub !== "quizzes" && sub !== "workspace" && (
        <TerraformDashboard theme={theme} progress={progress} navigate={navigate} />
      )}
    </div>
  );
}

window.__vChunks = window.__vChunks || {};
window.__vChunks.terraform = { TerraformPage };
