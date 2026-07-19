import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
} from '@jest/globals';
import AdmZip from 'adm-zip';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import {
  PLUGIN_ARCHIVE_POLICY,
  PluginZipExtractorService,
} from './plugin-zip-extractor.service';

describe('PluginZipExtractorService archive admission security', () => {
  let workspace: string;
  let originalWorkingDirectory: string;
  let extractor: PluginZipExtractorService;

  beforeEach(() => {
    originalWorkingDirectory = process.cwd();
    workspace = mkdtempSync(
      join(tmpdir(), 'propertyos-plugin-archive-'),
    );
    process.chdir(workspace);
    extractor = new PluginZipExtractorService();
  });

  afterEach(() => {
    process.chdir(originalWorkingDirectory);
    rmSync(workspace, {
      recursive: true,
      force: true,
    });
  });

  function createArchive(
    name: string,
    configure: (archive: AdmZip) => void,
  ): string {
    const archivePath = join(workspace, name);
    const archive = new AdmZip();

    configure(archive);
    archive.writeZip(archivePath);

    return archivePath;
  }

  function replaceArchiveEntryName(
    archivePath: string,
    safeName: string,
    unsafeName: string,
  ): void {
    const safeBytes = Buffer.from(safeName);
    const unsafeBytes = Buffer.from(unsafeName);

    if (safeBytes.length !== unsafeBytes.length) {
      throw new Error(
        `Test ZIP names must have equal byte lengths: ${safeName} / ${unsafeName}`,
      );
    }

    const archiveBytes = readFileSync(archivePath);
    let replacementCount = 0;
    let offset = 0;

    while (offset < archiveBytes.length) {
      const index = archiveBytes.indexOf(safeBytes, offset);

      if (index === -1) {
        break;
      }

      unsafeBytes.copy(archiveBytes, index);
      replacementCount += 1;
      offset = index + unsafeBytes.length;
    }

    if (replacementCount < 2) {
      throw new Error(
        `Expected ZIP entry name in local and central headers; found ${replacementCount}`,
      );
    }

    writeFileSync(archivePath, archiveBytes);
  }

  function installedEntries(): string[] {
    const installationRoot = join(
      workspace,
      'plugins',
      '.installed',
    );

    if (!existsSync(installationRoot)) {
      return [];
    }

    return readdirSync(installationRoot);
  }

  it('extracts a valid archive into a unique installation directory', () => {
    const archivePath = createArchive('valid.zip', (archive) => {
      archive.addFile(
        'plugin/plugin.json',
        Buffer.from(
          JSON.stringify({
            name: 'valid-plugin',
            version: '1.0.0',
          }),
        ),
      );
      archive.addFile(
        'plugin/dist/index.js',
        Buffer.from('module.exports = {};'),
      );
    });

    const firstOutput = extractor.extract(archivePath);
    const secondOutput = extractor.extract(archivePath);

    expect(firstOutput).not.toBe(secondOutput);
    expect(
      JSON.parse(
        readFileSync(
          join(firstOutput, 'plugin', 'plugin.json'),
          'utf8',
        ),
      ),
    ).toEqual({
      name: 'valid-plugin',
      version: '1.0.0',
    });
    expect(installedEntries()).toHaveLength(2);
  });

  it.each([
    ['parent traversal', 'aa/outside.txt', '../outside.txt'],
    [
      'nested parent traversal',
      'plugin/aa/aa/outside.txt',
      'plugin/../../outside.txt',
    ],
    [
      'absolute POSIX path',
      'xtmp/absolute.txt',
      '/tmp/absolute.txt',
    ],
    ['Windows drive path', 'X:/outside.txt', 'C:/outside.txt'],
    ['Windows traversal', 'aa/outside.txt', '..\\outside.txt'],
  ])(
    'rejects %s entries and cleans partial extraction',
    (_, safeName, unsafeName) => {
      const archivePath = createArchive(
        'unsafe-path.zip',
        (archive) => {
          archive.addFile(
            safeName,
            Buffer.from('must-not-escape'),
          );
        },
      );

      replaceArchiveEntryName(
        archivePath,
        safeName,
        unsafeName,
      );

      expect(() => extractor.extract(archivePath)).toThrow(
        /unsafe path|absolute path/,
      );
      expect(installedEntries()).toEqual([]);
    },
  );

  it('rejects symbolic links and cleans partial extraction', () => {
    const archivePath = createArchive('symlink.zip', (archive) => {
      archive.addFile(
        'plugin/plugin.json',
        Buffer.from('{}'),
      );
      archive.addFile(
        'plugin/link',
        Buffer.from('/etc/passwd'),
      );

      const linkEntry = archive.getEntry('plugin/link');

      if (!linkEntry) {
        throw new Error('Test ZIP symbolic-link entry was not created');
      }

      const symlinkMode = (0o120777 << 16) >>> 0;

      linkEntry.attr = symlinkMode;
      linkEntry.header.attr = symlinkMode;
    });

    expect(() => extractor.extract(archivePath)).toThrow(
      'Plugin archive contains a symbolic link',
    );
    expect(installedEntries()).toEqual([]);
  });

  it('rejects excessive compression ratios before extraction', () => {
    const archivePath = createArchive('compression-bomb.zip', (archive) => {
      archive.addFile(
        'plugin/payload.bin',
        Buffer.alloc(
          PLUGIN_ARCHIVE_POLICY.maximumCompressionRatio * 4096,
          0,
        ),
      );
    });

    expect(() => extractor.extract(archivePath)).toThrow(
      'Plugin archive entry exceeds maximum compression ratio',
    );
    expect(installedEntries()).toEqual([]);
  });

  it('rejects empty archives and cleans the installation directory', () => {
    const archivePath = createArchive('empty.zip', () => undefined);

    expect(() => extractor.extract(archivePath)).toThrow(
      'Plugin archive is empty',
    );
    expect(installedEntries()).toEqual([]);
  });

  it('rejects non-file package paths', () => {
    const directoryPath = join(workspace, 'not-an-archive');
    mkdirSync(directoryPath);

    expect(() => extractor.extract(directoryPath)).toThrow(
      'Plugin package is not a regular file',
    );
    expect(installedEntries()).toEqual([]);
  });
});
