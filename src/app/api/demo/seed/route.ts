import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const now = Date.now();

const DEMO_FAILURES = [
  {
    id: "demo-org:frontend-app:100001",
    pipeline_name: "CI / Build & Test",
    status: "failure",
    failed_stage: "Build",
    error_summary: "TypeScript compilation failed due to missing type declarations for the axios package in the frontend application.",
    root_cause: "Missing @types/axios package in devDependencies causing TypeScript strict mode to reject the import",
    category: "dependency",
    fix_suggestion: "Run `npm install --save-dev @types/axios` and commit the updated package.json and package-lock.json files to the repository.",
    key_error_lines: [
      "error TS7016: Could not find a declaration file for module 'axios'.",
      "  node_modules/axios/index.js implicitly has an 'any' type.",
      "  Try `npm i --save-dev @types/axios` if it exists or add a new declaration (.d.ts) file containing `declare module 'axios';`"
    ],
    severity: "high",
    confidence: 96,
    explanation: "TypeScript strict mode requires type declarations for all imported third-party packages. The axios package ships without bundled types and requires @types/axios to be installed separately.",
    command: "npm run build",
    error_log: "Run npm run build\n> next build\n\ninfo  - Loaded env from .env.local\nerror - Failed to compile.\n\n./src/utils/api.ts:2:22\nType error: Could not find a declaration file for module 'axios'.\n'node_modules/axios/index.js' implicitly has an 'any' type.\nTry `npm i --save-dev @types/axios` if it exists.\n\nError: Command failed: npm run build",
    repo_owner: "demo-org",
    repo_name: "frontend-app",
    run_id: 100001,
    created_at: new Date(now - 1 * 60 * 60 * 1000).toISOString(),
    created_pull_request: null,
  },
  {
    id: "demo-org:api-service:100002",
    pipeline_name: "Deploy to Production",
    status: "failure",
    failed_stage: "Test",
    error_summary: "Unit tests failed because the database connection string environment variable is not set in the CI environment.",
    root_cause: "DATABASE_URL environment variable missing from GitHub Actions secrets, causing all database-dependent tests to throw connection errors",
    category: "configuration",
    fix_suggestion: "Add DATABASE_URL as a GitHub Actions secret under Settings → Secrets and Variables → Actions. Use a dedicated test database URL, not the production database.",
    key_error_lines: [
      "Error: connect ECONNREFUSED 127.0.0.1:5432",
      "  at TCPConnectWrap.afterConnect [as oncomplete]",
      "DatabaseError: getaddrinfo ENOTFOUND undefined",
      "  Environment variable DATABASE_URL is not defined"
    ],
    severity: "high",
    confidence: 92,
    explanation: "The test suite requires a live database connection. The DATABASE_URL secret was not configured in the repository's GitHub Actions environment, causing all integration tests to fail with connection refused errors.",
    command: "npm test",
    error_log: "Run npm test\n> jest --coverage\n\nFAIL src/db/users.test.ts\n  ● User repository › should create user\n\n    DatabaseError: getaddrinfo ENOTFOUND undefined\n    Environment variable DATABASE_URL is not defined\n\n    at Object.<anonymous> (src/db/connection.ts:8:11)\n\nTests: 0 passed, 12 failed\nTest Suites: 3 failed, 3 total",
    repo_owner: "demo-org",
    repo_name: "api-service",
    run_id: 100002,
    created_at: new Date(now - 3 * 60 * 60 * 1000).toISOString(),
    created_pull_request: null,
  },
  {
    id: "demo-org:mobile-app:100003",
    pipeline_name: "Android Release Build",
    status: "failure",
    failed_stage: "Build",
    error_summary: "Gradle build failed because the keystore file for signing the Android release APK is not present in the CI environment.",
    root_cause: "The release keystore file (release.keystore) is not stored in the repository and was not provided as a CI secret or artifact, causing the signing step to fail",
    category: "configuration",
    fix_suggestion: "Encode the keystore file as a Base64 string and store it as a GitHub secret KEYSTORE_BASE64. Add a build step to decode it: `echo $KEYSTORE_BASE64 | base64 -d > release.keystore` before running the Gradle build.",
    key_error_lines: [
      "FAILURE: Build failed with an exception.",
      "* What went wrong:",
      "Execution failed for task ':app:packageRelease'.",
      "> KeyStore file '/runner/work/mobile-app/release.keystore' not found for signing config 'release'."
    ],
    severity: "high",
    confidence: 98,
    explanation: "Android release builds require a keystore file for APK signing. This file should never be committed to source control. Instead, it should be base64-encoded and stored as a CI secret, then decoded at build time.",
    command: "./gradlew assembleRelease",
    error_log: "Run ./gradlew assembleRelease\n> Task :app:packageRelease FAILED\n\nFAILURE: Build failed with an exception.\n\n* What went wrong:\nExecution failed for task ':app:packageRelease'.\n> KeyStore file '/runner/work/mobile-app/release.keystore' not found for signing config 'release'.\n\n* Try:\nRun with --info or --debug option to get more log output.",
    repo_owner: "demo-org",
    repo_name: "mobile-app",
    run_id: 100003,
    created_at: new Date(now - 5 * 60 * 60 * 1000).toISOString(),
    created_pull_request: null,
  },
  {
    id: "demo-org:data-pipeline:100004",
    pipeline_name: "ETL Data Pipeline",
    status: "failure",
    failed_stage: "Test",
    error_summary: "Python unit tests failed due to an import error caused by a version conflict between pandas 2.0 and the legacy data transformation code.",
    root_cause: "pandas 2.0 removed the DataFrame.append() method which was deprecated in 1.4. The data transformation module still uses this removed API.",
    category: "code",
    fix_suggestion: "Replace all instances of `df.append(other)` with `pd.concat([df, other], ignore_index=True)` in src/transforms/merger.py. This is the pandas 2.0 compatible equivalent.",
    key_error_lines: [
      "AttributeError: 'DataFrame' object has no attribute 'append'",
      "  File \"src/transforms/merger.py\", line 47, in merge_datasets",
      "    result = result.append(chunk, ignore_index=True)",
      "Note: DataFrame.append was deprecated in version 1.4.0 and removed in 2.0.0."
    ],
    severity: "medium",
    confidence: 99,
    explanation: "pandas 2.0 is a major release that removed several deprecated APIs. The DataFrame.append() method was replaced by pd.concat() which is more explicit and performs better.",
    command: "pytest tests/ -v",
    error_log: "Run pytest tests/ -v\ncollected 34 items\n\ntests/test_merger.py::test_merge_daily FAILED\ntests/test_merger.py::test_merge_weekly FAILED\n\n================================= FAILURES =================================\n____________________ test_merge_daily ____________________\n\nAttributeError: 'DataFrame' object has no attribute 'append'\n\nFile \"src/transforms/merger.py\", line 47, in merge_datasets\n    result = result.append(chunk, ignore_index=True)\n\n====== 2 failed, 32 passed in 4.21s ======",
    repo_owner: "demo-org",
    repo_name: "data-pipeline",
    run_id: 100004,
    created_at: new Date(now - 8 * 60 * 60 * 1000).toISOString(),
    created_pull_request: null,
  },
  {
    id: "demo-org:backend-api:100005",
    pipeline_name: "CI / Lint, Test & Build",
    status: "failure",
    failed_stage: "Install Dependencies",
    error_summary: "npm install failed due to a peer dependency conflict between react-query v5 and the legacy version of react-table which requires react-query v4.",
    root_cause: "react-table@7.8.0 has a peer dependency on react-query@4.x, but the project upgraded to react-query@5.x which introduced breaking API changes and is incompatible",
    category: "dependency",
    fix_suggestion: "Either downgrade react-query to ^4.36.1 (`npm install react-query@4`) or upgrade react-table to @tanstack/react-table@8 which is compatible with react-query v5. The @tanstack/react-table v8 migration guide is at tanstack.com/table/v8/docs/guide/migrating.",
    key_error_lines: [
      "npm ERR! code ERESOLVE",
      "npm ERR! ERESOLVE unable to resolve dependency tree",
      "npm ERR! peer react-query@\"^4.0.0\" from react-table@7.8.0",
      "npm ERR! Conflicting peer dependency: react-query@4.36.1"
    ],
    severity: "medium",
    confidence: 94,
    explanation: "react-query v5 (@tanstack/react-query) introduced breaking changes and is not backwards compatible with packages that depend on react-query v4. The peer dependency constraint prevents npm from resolving the dependency tree.",
    command: "npm install",
    error_log: "Run npm install\nnpm ERR! code ERESOLVE\nnpm ERR! ERESOLVE unable to resolve dependency tree\nnpm ERR!\nnpm ERR! While resolving: backend-api@1.0.0\nnpm ERR! Found: react-query@5.17.19\nnpm ERR! node_modules/react-query\nnpm ERR!   react-query@\"^5.0.0\" from the root project\nnpm ERR!\nnpm ERR! Could not resolve dependency:\nnpm ERR! peer react-query@\"^4.0.0\" from react-table@7.8.0\nnpm ERR! node_modules/react-table",
    repo_owner: "demo-org",
    repo_name: "backend-api",
    run_id: 100005,
    created_at: new Date(now - 12 * 60 * 60 * 1000).toISOString(),
    created_pull_request: null,
  },
  {
    id: "demo-org:infra-terraform:100006",
    pipeline_name: "Terraform Plan & Apply",
    status: "failure",
    failed_stage: "Deploy",
    error_summary: "Terraform apply failed because the AWS IAM role used by GitHub Actions does not have permission to create CloudWatch log groups.",
    root_cause: "The GitHub Actions IAM role is missing the logs:CreateLogGroup permission in its IAM policy, preventing the Lambda function deployment from completing",
    category: "infrastructure",
    fix_suggestion: "Add `logs:CreateLogGroup` to the IAM policy attached to the GitHub Actions deployment role. The policy ARN is arn:aws:iam::123456789:policy/GitHubActionsDeployPolicy. Add the permission for resource `arn:aws:logs:*:*:*`.",
    key_error_lines: [
      "Error: creating CloudWatch Log Group (/aws/lambda/api-handler): AccessDeniedException:",
      "User: arn:aws:sts::123456789:assumed-role/GitHubActionsRole/session",
      "is not authorized to perform: logs:CreateLogGroup",
      "on resource: arn:aws:logs:us-east-1:123456789:log-group:/aws/lambda/api-handler"
    ],
    severity: "high",
    confidence: 97,
    explanation: "AWS Lambda functions automatically create CloudWatch log groups on first invocation or during deployment. The GitHub Actions IAM role needs explicit permission to create these log groups as part of the infrastructure deployment.",
    command: "terraform apply -auto-approve",
    error_log: "Run terraform apply -auto-approve\n\nmodule.lambda.aws_lambda_function.api_handler: Creating...\nmodule.lambda.aws_cloudwatch_log_group.api_handler: Creating...\n╷\n│ Error: creating CloudWatch Log Group (/aws/lambda/api-handler): AccessDeniedException: \n│ User: arn:aws:sts::123456789:assumed-role/GitHubActionsRole/session is not authorized to perform: logs:CreateLogGroup\n│ \n│   with module.lambda.aws_cloudwatch_log_group.api_handler,\n│   on modules/lambda/main.tf line 34, in resource \"aws_cloudwatch_log_group\" \"api_handler\":\n│   34: resource \"aws_cloudwatch_log_group\" \"api_handler\" {\n╵",
    repo_owner: "demo-org",
    repo_name: "infra-terraform",
    run_id: 100006,
    created_at: new Date(now - 24 * 60 * 60 * 1000).toISOString(),
    created_pull_request: null,
  },
];

export async function POST() {
  try {
    const { error } = await supabase
      .from("pipeline_failures")
      .upsert(DEMO_FAILURES, { onConflict: "id" });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ seeded: DEMO_FAILURES.length });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Seed failed" },
      { status: 500 }
    );
  }
}
