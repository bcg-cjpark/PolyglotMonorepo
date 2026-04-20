import {
  Tree,
  formatFiles,
  joinPathFragments,
  addProjectConfiguration,
  logger,
} from "@nx/devkit";
import type { WebAppSchema } from "./schema";

export default async function webAppGenerator(
  tree: Tree,
  schema: WebAppSchema,
) {
  const { name, port = 3000 } = schema;
  const projectRoot = `apps/${name}`;

  if (tree.exists(projectRoot)) {
    throw new Error(`Directory already exists: ${projectRoot}`);
  }

  copyExampleWeb(tree, "apps/example-web", projectRoot, { name, port });

  addProjectConfiguration(tree, name, {
    root: projectRoot,
    projectType: "application",
    sourceRoot: `${projectRoot}/src`,
    tags: ["lang:typescript", "scope:web"],
  });

  await formatFiles(tree);

  logger.info(`
✓ Created apps/${name}
  Next steps:
    pnpm install
    nx run ${name}:dev
`);
}

function copyExampleWeb(
  tree: Tree,
  source: string,
  target: string,
  tokens: { name: string; port: number },
) {
  const children = tree.children(source);
  for (const child of children) {
    const sourcePath = joinPathFragments(source, child);
    const targetPath = joinPathFragments(target, child);

    if (tree.isFile(sourcePath)) {
      const content = tree.read(sourcePath)?.toString("utf-8") ?? "";
      tree.write(targetPath, replaceContentTokens(content, tokens));
    } else {
      copyExampleWeb(tree, sourcePath, targetPath, tokens);
    }
  }
}

function replaceContentTokens(
  content: string,
  tokens: { name: string; port: number },
): string {
  return content
    .replace(/"name": "example-web"/g, `"name": "${tokens.name}"`)
    .replace(/port: 3000/g, `port: ${tokens.port}`)
    .replace(/proxy_pass http:\/\/example-api:8080\//g,
      `proxy_pass http://example-api:8080/`);
}
