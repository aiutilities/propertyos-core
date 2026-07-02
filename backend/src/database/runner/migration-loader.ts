import * as fs from 'fs';
import * as path from 'path';

export interface MigrationFile {
  name: string;
  path: string;
  sql: string;
}

export function loadMigrationFiles(): MigrationFile[] {
  const migrationsRoot = path.join(process.cwd(), 'src', 'database', 'migrations');

  const coreDir = path.join(migrationsRoot, 'core');
  const pluginsDir = path.join(migrationsRoot, 'plugins');

  const files: MigrationFile[] = [];

  if (fs.existsSync(coreDir)) {
    const coreFiles = fs
      .readdirSync(coreDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    for (const file of coreFiles) {
      const filePath = path.join(coreDir, file);
      files.push({
        name: `core/${file}`,
        path: filePath,
        sql: fs.readFileSync(filePath, 'utf8'),
      });
    }
  }

  if (fs.existsSync(pluginsDir)) {
    const pluginNames = fs.readdirSync(pluginsDir).sort();

    for (const pluginName of pluginNames) {
      const pluginDir = path.join(pluginsDir, pluginName);

      if (!fs.statSync(pluginDir).isDirectory()) {
        continue;
      }

      const pluginFiles = fs
        .readdirSync(pluginDir)
        .filter((file) => file.endsWith('.sql'))
        .sort();

      for (const file of pluginFiles) {
        const filePath = path.join(pluginDir, file);
        files.push({
          name: `plugins/${pluginName}/${file}`,
          path: filePath,
          sql: fs.readFileSync(filePath, 'utf8'),
        });
      }
    }
  }

  return files;
}
