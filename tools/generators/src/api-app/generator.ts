import {
  Tree,
  formatFiles,
  generateFiles,
  joinPathFragments,
  readProjectConfiguration,
  addProjectConfiguration,
  logger,
} from "@nx/devkit";
import type { ApiAppSchema } from "./schema";

/**
 * Scaffolds a new Kotlin Spring Boot multi-module API app by cloning
 * apps/api and substituting package/name tokens.
 */
export default async function apiAppGenerator(
  tree: Tree,
  schema: ApiAppSchema,
) {
  const { name, packageName, port = 8080 } = schema;
  const projectRoot = `apps/${name}`;

  if (tree.exists(projectRoot)) {
    throw new Error(`Directory already exists: ${projectRoot}`);
  }

  const packagePath = packageName.replace(/\./g, "/");

  copyExampleApi(tree, "apps/api", projectRoot, {
    name,
    packageName,
    packagePath,
    port,
  });

  addProjectConfiguration(tree, name, {
    root: projectRoot,
    projectType: "application",
    sourceRoot: projectRoot,
    targets: {
      serve: {
        executor: "nx:run-commands",
        options: {
          cwd: projectRoot,
          command: "node ../../scripts/run-gradle.mjs :app:bootRun",
        },
      },
      build: {
        executor: "nx:run-commands",
        cache: true,
        outputs: [`{projectRoot}/app/build/libs`],
        options: {
          cwd: projectRoot,
          command: "node ../../scripts/run-gradle.mjs :app:bootJar",
        },
      },
      test: {
        executor: "nx:run-commands",
        cache: true,
        options: {
          cwd: projectRoot,
          command: "node ../../scripts/run-gradle.mjs test",
        },
      },
      lint: {
        executor: "nx:run-commands",
        cache: true,
        options: {
          cwd: projectRoot,
          command: "node ../../scripts/run-gradle.mjs ktlintCheck",
        },
      },
    },
    tags: ["lang:kotlin", "scope:api"],
  });

  await formatFiles(tree);

  logger.info(`
✓ Created apps/${name}
  Next steps:
    cd apps/${name}
    ./gradlew :app:bootRun
`);
}

/**
 * Naive file tree copy with string substitution.
 * For production you can swap this with generateFiles() + EJS templates under files/.
 */
function copyExampleApi(
  tree: Tree,
  source: string,
  target: string,
  tokens: {
    name: string;
    packageName: string;
    packagePath: string;
    port: number;
  },
) {
  const children = tree.children(source);
  for (const child of children) {
    const sourcePath = joinPathFragments(source, child);
    const targetPath = joinPathFragments(
      target,
      replacePathTokens(child, tokens),
    );

    if (tree.isFile(sourcePath)) {
      const content = tree.read(sourcePath)?.toString("utf-8") ?? "";
      tree.write(targetPath, replaceContentTokens(content, tokens));
    } else {
      copyExampleApi(tree, sourcePath, targetPath, tokens);
    }
  }
}

function replacePathTokens(
  path: string,
  tokens: { packagePath: string },
): string {
  return path.replace(/com\/example\/template/g, tokens.packagePath);
}

function replaceContentTokens(
  content: string,
  tokens: {
    name: string;
    packageName: string;
    port: number;
  },
): string {
  return content
    .replace(/com\.example\.template/g, tokens.packageName)
    .replace(/rootProject\.name = "api"/g, `rootProject.name = "${tokens.name}"`)
    .replace(/spring:\n  application:\n    name: api/g,
      `spring:\n  application:\n    name: ${tokens.name}`)
    .replace(/API_PORT:8080/g, `API_PORT:${tokens.port}`);
}
