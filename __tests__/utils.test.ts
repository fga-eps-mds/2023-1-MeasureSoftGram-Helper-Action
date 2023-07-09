import * as core from '@actions/core';

import { generateFileName, getInfo, getNewTagName, Info, shouldCreateRelease } from '../src/utils';

jest.mock('@actions/core');

describe('getInfo', () => {
  const mockedCore = core as jest.Mocked<typeof core>;

  beforeEach(() => {
    mockedCore.getInput.mockClear();
  });

  test('should return correct Info object', () => {
    const repo = { owner: 'testOwner', repo: 'testRepo' };

    mockedCore.getInput.mockImplementation((inputName: string) => {
      switch(inputName) {
        case 'host': return 'mockHost';
        case 'token': return 'mockToken';
        default: return '';
      }
    });

    const expectedInfo: Info = {
      project: { sonarProjectKey: 'testOwner_testRepo' },
      host: 'mockHost',
      token: 'mockToken',
    };

    expect(getInfo(repo)).toEqual(expectedInfo);
  });

  test('should use default sonarProjectKey if not provided', () => {
    const repo = { owner: 'testOwner', repo: 'testRepo' };

    mockedCore.getInput.mockImplementation((inputName: string) => {
      switch(inputName) {
        case 'host': return 'mockHost';
        case 'token': return 'mockToken';
        default: return '';
      }
    });

    const expectedInfo: Info = {
      project: { sonarProjectKey: `${repo.owner}_${repo.repo}` },
      host: 'mockHost',
      token: 'mockToken',
    };

    expect(getInfo(repo)).toEqual(expectedInfo);
  });
});

describe('generateFileName', () => {
  test('should generate file path correctly', () => {
    const currentDate = new Date('2023-06-28T10:30:00');
    const repo = 'my-repo';
    const file_release_name = 'release-1.0.0';

    const expectedFilePath = 'fga-eps-mds-my-repo-6-28-2023-10-30-0-release-1.0.0.json';
    const generatedFilePath = generateFileName(currentDate, repo, file_release_name);

    expect(generatedFilePath).toBe(expectedFilePath);
  });
});

describe('getNewTagName', () => {
  test.each([
    [['MAJOR_RELEASE'], 'v1.2.3', 'v2.0.0'],
    [['MINOR_RELEASE'], 'v1.2.3', 'v1.3.0'],
    [['PATCH_RELEASE'], 'v1.2.3', 'v1.2.4'],
    [['SOME_LABEL'], 'v1.2.3', 'v1.2.4'],
  ])(
    'should return new tag name for %s',
    (labels, latestTag, expected) => {
      const newTagName = getNewTagName(labels, latestTag);
      expect(newTagName).toBe(expected);
    }
  );
});

describe('shouldCreateRelease', () => {
  test.each([
    [['MINOR_RELEASE'], true],
    [['MAJOR_RELEASE'], true],
    [['PATCH_RELEASE'], true],
    [['SOME_LABEL'], false],
  ])(
    'should return %s if labels contain %s',
    (labels, expected) => {
      const result = shouldCreateRelease(labels);
      expect(result).toBe(expected);
    }
  );
});
